from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO

from app.database import get_db
from app.models.template import TemplateVersion
from app.models.product import Product, ProductVariation
from app.schemas.draft_sheet import DraftSheetUploadResponse
from app.services.draft_sheet_generator import generate_draft_sheet
from app.services.draft_sheet_parser import parse_draft_sheet

router = APIRouter()


def _get_active_template(db: Session) -> TemplateVersion:
    template = db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
    if not template:
        raise HTTPException(status_code=404, detail="アクティブなテンプレートが登録されていません")
    return template


@router.get("/download")
def download_draft_sheet(db: Session = Depends(get_db)):
    """Download an empty draft sheet based on the active template."""
    template = _get_active_template(db)

    content = generate_draft_sheet(
        column_schema=template.column_schema,
        dropdown_schema=template.dropdown_schema,
        schema_hash=template.schema_hash,
    )

    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=draft_sheet.xlsx"},
    )


@router.post("/upload", response_model=DraftSheetUploadResponse)
async def upload_draft_sheet(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a filled-in draft sheet and create a new product."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="ファイル形式が不正です。.xlsx または .xlsm ファイルをアップロードしてください。")

    template = _get_active_template(db)
    file_content = await file.read()

    # Parse the draft sheet
    try:
        parsed = parse_draft_sheet(file_content, template.column_schema, template.schema_hash)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate required fields
    product_name = parsed["name"] or parsed["parent_sku"]
    if not product_name:
        raise HTTPException(status_code=400, detail="商品名またはSKUが必要です。基本情報シートに記入してください。")

    # Create product
    db_product = Product(
        name=parsed["name"] or parsed["parent_sku"],
        status="draft",
        template_version_id=template.id,
        parent_sku=parsed["parent_sku"],
        parent_data=parsed["parent_data"],
        variation_theme=parsed["variation_theme"],
    )
    db.add(db_product)
    db.flush()  # Get product ID

    # Create variations
    for idx, var in enumerate(parsed["variations"]):
        db_var = ProductVariation(
            product_id=db_product.id,
            sort_order=idx,
            child_sku=var["child_sku"],
            child_data=var["child_data"],
        )
        db.add(db_var)

    db.commit()
    db.refresh(db_product)

    return DraftSheetUploadResponse(
        product_id=db_product.id,
        product_name=db_product.name,
        parent_sku=db_product.parent_sku,
        variation_count=len(parsed["variations"]),
        warnings=parsed["warnings"],
    )
