from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary
from sqlalchemy.sql import func
from app.database import Base, CompatJSONB as JSONB


class TemplateVersion(Base):
    __tablename__ = "template_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_label = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    column_schema = Column(JSONB, nullable=False)
    validation_schema = Column(JSONB, nullable=False)
    dropdown_schema = Column(JSONB, nullable=False)
    defined_names_schema = Column(JSONB, nullable=False)
    schema_hash = Column(String(64), nullable=False)
    template_file = Column(LargeBinary)
