from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.models.template import TemplateVersion
from app.models.export import Export
from app.services.excel_generator import generate_excel
from app.services.variation_builder import build_rows
from app.services.template_diff import compute_diff
import io

router = APIRouter()


@router.post("/products/{product_id}/export")
def export_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    active_template = (
        db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
    )
    if not active_template:
        raise HTTPException(status_code=400, detail="No active template found")

    # Check for template version mismatch
    warnings = None
    if product.template_version_id and product.template_version_id != active_template.id:
        old_template = db.query(TemplateVersion).filter(
            TemplateVersion.id == product.template_version_id
        ).first()
        if old_template:
            old_schema = {
                "column_schema": old_template.column_schema,
                "validation_schema": old_template.validation_schema,
                "dropdown_schema": old_template.dropdown_schema,
                "defined_names_schema": old_template.defined_names_schema,
            }
            new_schema = {
                "column_schema": active_template.column_schema,
                "validation_schema": active_template.validation_schema,
                "dropdown_schema": active_template.dropdown_schema,
                "defined_names_schema": active_template.defined_names_schema,
            }
            diff = compute_diff(old_schema, new_schema)
            if diff["has_changes"]:
                warnings = diff

    # Build rows
    rows = build_rows(product, active_template.column_schema)

    # Generate Excel
    excel_bytes = generate_excel(active_template.template_file, rows, active_template.column_schema)

    # Record export
    export_record = Export(
        product_id=product_id,
        template_version_id=active_template.id,
        template_warnings=warnings,
    )
    db.add(export_record)
    db.commit()

    filename = f"amazon_upload_{product.parent_sku or product.name}.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/products/{product_id}/preview")
def preview_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    active_template = (
        db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
    )
    if not active_template:
        raise HTTPException(status_code=400, detail="No active template found")

    rows = build_rows(product, active_template.column_schema)

    # Check template version mismatch
    warnings = None
    if product.template_version_id and product.template_version_id != active_template.id:
        old_template = db.query(TemplateVersion).filter(
            TemplateVersion.id == product.template_version_id
        ).first()
        if old_template:
            old_schema = {
                "column_schema": old_template.column_schema,
                "validation_schema": old_template.validation_schema,
                "dropdown_schema": old_template.dropdown_schema,
                "defined_names_schema": old_template.defined_names_schema,
            }
            new_schema = {
                "column_schema": active_template.column_schema,
                "validation_schema": active_template.validation_schema,
                "dropdown_schema": active_template.dropdown_schema,
                "defined_names_schema": active_template.defined_names_schema,
            }
            diff = compute_diff(old_schema, new_schema)
            if diff["has_changes"]:
                warnings = diff

    return {
        "columns": [col["technical_name"] for col in active_template.column_schema],
        "rows": rows,
        "warnings": warnings,
    }
