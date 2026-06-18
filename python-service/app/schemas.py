"""Modelos Pydantic — el contrato tipado de entrada y salida.

Pydantic valida y serializa: lo que entra se chequea contra estos tipos, y lo
que sale se garantiza con esta forma. Es el equivalente Python a las interfaces
de TypeScript, pero con validación en runtime además de chequeo estático.
"""

from datetime import datetime

from pydantic import BaseModel


class Product(BaseModel):
    id: int
    title: str
    description: str
    code: str
    price: float
    status: bool
    stock: int
    category: str
    thumbnails: list[str]
    created_at: datetime
    updated_at: datetime


class ProductList(BaseModel):
    """Respuesta paginada del listado de productos."""

    total: int
    limit: int
    offset: int
    items: list[Product]


class CategoryStats(BaseModel):
    """Métricas agregadas por categoría (GROUP BY en SQL)."""

    category: str
    products: int
    total_stock: int
    inventory_value: float
    avg_price: float


class InventorySummary(BaseModel):
    """Foto global del inventario."""

    total_products: int
    total_stock: int
    inventory_value: float
    out_of_stock: int
    categories: int


class Health(BaseModel):
    status: str
    database: str
