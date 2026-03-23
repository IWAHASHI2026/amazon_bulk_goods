from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class TemplateVersionBase(BaseModel):
    version_label: str


class TemplateVersionCreate(TemplateVersionBase):
    pass


class TemplateVersionResponse(TemplateVersionBase):
    id: int
    uploaded_at: datetime
    is_active: bool
    schema_hash: str
    column_schema: Any
    validation_schema: Any
    dropdown_schema: Any
    defined_names_schema: Any

    class Config:
        from_attributes = True


class TemplateVersionSummary(BaseModel):
    id: int
    version_label: str
    uploaded_at: datetime
    is_active: bool
    schema_hash: str

    class Config:
        from_attributes = True


class TemplateDiffResponse(BaseModel):
    has_changes: bool
    severity: str  # "none", "minor", "major"
    column_changes: Any
    validation_changes: Any
    dropdown_changes: Any
    summary: list[str]
