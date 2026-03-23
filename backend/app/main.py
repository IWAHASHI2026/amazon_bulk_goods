from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import TemplateVersion, Product, ProductVariation, Export  # noqa: F401
from app.routers import products, templates, export, draft_sheet

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Amazon Bulk Registration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(export.router, prefix="/api", tags=["export"])
app.include_router(draft_sheet.router, prefix="/api/draft-sheet", tags=["draft-sheet"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
