"""Microservicio de analytics en FastAPI.

Convive con la API Node del e-commerce y lee la MISMA base PostgreSQL. Node se
ocupa de la escritura (productos, carritos, stock); este servicio Python expone
consultas de lectura y métricas agregadas. Es el patrón de microservicios
políglotas: cada servicio en el lenguaje que mejor le calza, contra un dato común.

Levantar:  uvicorn app.main:app --reload
Docs:      http://localhost:8000/docs   (Swagger auto-generado por FastAPI)
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from psycopg import AsyncConnection

from . import repository as repo
from .config import settings
from .db import get_conn, pool
from .schemas import (
    CategoryStats,
    Health,
    InventorySummary,
    Product,
    ProductList,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Abre el pool al arrancar y lo cierra prolijo al apagar.
    await pool.open()
    yield
    await pool.close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Servicio de lectura y analytics sobre el catálogo del e-commerce.",
    lifespan=lifespan,
)


@app.get("/health", response_model=Health, tags=["meta"])
async def health(conn: AsyncConnection = Depends(get_conn)) -> Health:
    ok = await repo.ping(conn)
    return Health(status="ok", database="up" if ok else "down")


@app.get("/products", response_model=ProductList, tags=["catálogo"])
async def list_products(
    category: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    conn: AsyncConnection = Depends(get_conn),
) -> ProductList:
    total, items = await repo.fetch_products(
        conn, category, min_price, max_price, limit, offset
    )
    return ProductList(total=total, limit=limit, offset=offset, items=items)


@app.get("/products/{product_id}", response_model=Product, tags=["catálogo"])
async def get_product(
    product_id: int, conn: AsyncConnection = Depends(get_conn)
) -> Product:
    row = await repo.fetch_product(conn, product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return row


@app.get("/analytics/by-category", response_model=list[CategoryStats], tags=["analytics"])
async def analytics_by_category(
    conn: AsyncConnection = Depends(get_conn),
) -> list[CategoryStats]:
    return await repo.stats_by_category(conn)


@app.get("/analytics/inventory", response_model=InventorySummary, tags=["analytics"])
async def analytics_inventory(
    conn: AsyncConnection = Depends(get_conn),
) -> InventorySummary:
    return await repo.inventory_summary(conn)
