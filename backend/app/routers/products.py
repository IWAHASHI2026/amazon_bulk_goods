from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product, ProductVariation
from app.models.template import TemplateVersion
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductVariationCreate,
    ProductVariationUpdate,
    ProductVariationResponse,
    BulkVariationCreate,
)

router = APIRouter()


@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Auto-assign active template if not specified
    if not product.template_version_id:
        active = db.query(TemplateVersion).filter(TemplateVersion.is_active == True).first()
        if active:
            product.template_version_id = active.id

    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=list[ProductListResponse])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.updated_at.desc()).all()
    result = []
    for p in products:
        result.append(
            ProductListResponse(
                id=p.id,
                name=p.name,
                status=p.status,
                parent_sku=p.parent_sku,
                variation_theme=p.variation_theme,
                variation_count=len(p.variations),
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        )
    return result


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"detail": "Product deleted"}


# --- Variations ---

@router.post("/{product_id}/variations", response_model=ProductVariationResponse)
def add_variation(product_id: int, variation: ProductVariationCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_variation = ProductVariation(product_id=product_id, **variation.model_dump())
    db.add(db_variation)
    db.commit()
    db.refresh(db_variation)
    return db_variation


@router.put("/{product_id}/variations/{variation_id}", response_model=ProductVariationResponse)
def update_variation(
    product_id: int, variation_id: int, update: ProductVariationUpdate, db: Session = Depends(get_db)
):
    variation = (
        db.query(ProductVariation)
        .filter(ProductVariation.id == variation_id, ProductVariation.product_id == product_id)
        .first()
    )
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variation, key, value)

    db.commit()
    db.refresh(variation)
    return variation


@router.delete("/{product_id}/variations/{variation_id}")
def delete_variation(product_id: int, variation_id: int, db: Session = Depends(get_db)):
    variation = (
        db.query(ProductVariation)
        .filter(ProductVariation.id == variation_id, ProductVariation.product_id == product_id)
        .first()
    )
    if not variation:
        raise HTTPException(status_code=404, detail="Variation not found")
    db.delete(variation)
    db.commit()
    return {"detail": "Variation deleted"}


@router.post("/{product_id}/variations/bulk", response_model=list[ProductVariationResponse])
def bulk_add_variations(product_id: int, bulk: BulkVariationCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_variations = []
    for v in bulk.variations:
        db_variation = ProductVariation(product_id=product_id, **v.model_dump())
        db.add(db_variation)
        db_variations.append(db_variation)

    db.commit()
    for v in db_variations:
        db.refresh(v)
    return db_variations
