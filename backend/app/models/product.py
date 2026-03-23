from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base, CompatJSONB as JSONB


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    status = Column(String(20), default="draft")
    template_version_id = Column(Integer, ForeignKey("template_versions.id"))
    parent_sku = Column(String(100))
    parent_data = Column(JSONB, nullable=False, default={})
    variation_theme = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    variations = relationship("ProductVariation", back_populates="product", cascade="all, delete-orphan")


class ProductVariation(Base):
    __tablename__ = "product_variations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    sort_order = Column(Integer, default=0)
    child_sku = Column(String(100))
    child_data = Column(JSONB, nullable=False, default={})

    product = relationship("Product", back_populates="variations")
