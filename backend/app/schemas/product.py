from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ProductVariationBase(BaseModel):
    sort_order: int = 0
    child_sku: Optional[str] = None
    child_data: dict = {}


class ProductVariationCreate(ProductVariationBase):
    pass


class ProductVariationUpdate(BaseModel):
    sort_order: Optional[int] = None
    child_sku: Optional[str] = None
    child_data: Optional[dict] = None


class ProductVariationResponse(ProductVariationBase):
    id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    parent_sku: Optional[str] = None
    parent_data: dict = {}
    variation_theme: Optional[str] = None


class ProductCreate(ProductBase):
    template_version_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    parent_sku: Optional[str] = None
    parent_data: Optional[dict] = None
    variation_theme: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    status: str
    template_version_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    variations: list[ProductVariationResponse] = []

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    name: str
    status: str
    parent_sku: Optional[str]
    variation_theme: Optional[str]
    variation_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BulkVariationCreate(BaseModel):
    variations: list[ProductVariationCreate]
