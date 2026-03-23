from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import TemplateVersion
from app.schemas.template import TemplateVersionResponse, TemplateVersionSummary, TemplateDiffResponse
from app.services.template_parser import parse_template
from app.services.template_diff import compute_diff
import hashlib

router = APIRouter()


@router.post("/upload", response_model=TemplateVersionSummary)
async def upload_template(
    file: UploadFile = File(...),
    version_label: str = Form(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith((".xlsm", ".xlsx")):
        raise HTTPException(status_code=400, detail="File must be .xlsm or .xlsx")

    content = await file.read()
    schema = parse_template(content)

    schema_hash = hashlib.sha256(
        str(sorted(str(schema).encode())).encode()
    ).hexdigest()

    # Deactivate previous active versions
    db.query(TemplateVersion).filter(TemplateVersion.is_active == True).update(
        {"is_active": False}
    )

    template_version = TemplateVersion(
        version_label=version_label,
        is_active=True,
        column_schema=schema["column_schema"],
        validation_schema=schema["validation_schema"],
        dropdown_schema=schema["dropdown_schema"],
        defined_names_schema=schema["defined_names_schema"],
        schema_hash=schema_hash,
        template_file=content,
    )
    db.add(template_version)
    db.commit()
    db.refresh(template_version)
    return template_version


@router.get("/active", response_model=TemplateVersionResponse)
def get_active_template(db: Session = Depends(get_db)):
    template = (
        db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="No active template found")
    return template


@router.get("/", response_model=list[TemplateVersionSummary])
def list_templates(db: Session = Depends(get_db)):
    return db.query(TemplateVersion).order_by(TemplateVersion.uploaded_at.desc()).all()


@router.post("/check", response_model=TemplateDiffResponse)
async def check_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    active = (
        db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
    )
    if not active:
        raise HTTPException(status_code=404, detail="No active template to compare against")

    content = await file.read()
    new_schema = parse_template(content)

    old_schema = {
        "column_schema": active.column_schema,
        "validation_schema": active.validation_schema,
        "dropdown_schema": active.dropdown_schema,
        "defined_names_schema": active.defined_names_schema,
    }

    diff = compute_diff(old_schema, new_schema)
    return diff
