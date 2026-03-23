from pydantic import BaseModel


class DraftSheetUploadResponse(BaseModel):
    product_id: int
    product_name: str
    parent_sku: str | None = None
    variation_count: int = 0
    warnings: list[str] = []
