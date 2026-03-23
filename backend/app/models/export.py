from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base, CompatJSONB as JSONB


class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    template_version_id = Column(Integer, ForeignKey("template_versions.id"))
    exported_at = Column(DateTime(timezone=True), server_default=func.now())
    template_warnings = Column(JSONB)
