"""Capa de acceso a datos — todas las queries SQL en un solo lugar.

Funciones async que reciben una conexión y devuelven filas como diccionarios.
Las queries son parametrizadas (%s) para evitar inyección SQL: los valores del
usuario nunca se concatenan dentro del string.
"""

from typing import Any

from psycopg import AsyncConnection
from psycopg.rows import dict_row


async def fetch_products(
    conn: AsyncConnection,
    category: str | None,
    min_price: float | None,
    max_price: float | None,
    limit: int,
    offset: int,
) -> tuple[int, list[dict[str, Any]]]:
    """Listado con filtros opcionales y paginación. Devuelve (total, items)."""
    filters: list[str] = []
    params: list[Any] = []

    if category is not None:
        filters.append("category = %s")
        params.append(category)
    if min_price is not None:
        filters.append("price >= %s")
        params.append(min_price)
    if max_price is not None:
        filters.append("price <= %s")
        params.append(max_price)

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    async with conn.cursor(row_factory=dict_row) as cur:
        # COUNT separado para conocer el total real más allá de la página actual.
        await cur.execute(f"SELECT COUNT(*)::int AS total FROM products {where}", params)
        total = (await cur.fetchone())["total"]

        await cur.execute(
            f"SELECT * FROM products {where} ORDER BY id LIMIT %s OFFSET %s",
            [*params, limit, offset],
        )
        items = await cur.fetchall()

    return total, items


async def fetch_product(conn: AsyncConnection, product_id: int) -> dict[str, Any] | None:
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute("SELECT * FROM products WHERE id = %s", [product_id])
        return await cur.fetchone()


async def stats_by_category(conn: AsyncConnection) -> list[dict[str, Any]]:
    """Agregación por categoría: cantidad, stock, valor de inventario y precio medio."""
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            SELECT category,
                   COUNT(*)::int                AS products,
                   SUM(stock)::int              AS total_stock,
                   SUM(price * stock)           AS inventory_value,
                   ROUND(AVG(price), 2)         AS avg_price
            FROM products
            GROUP BY category
            ORDER BY inventory_value DESC
            """
        )
        return await cur.fetchall()


async def inventory_summary(conn: AsyncConnection) -> dict[str, Any]:
    """Totales globales del catálogo en una sola pasada."""
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            SELECT COUNT(*)::int                              AS total_products,
                   COALESCE(SUM(stock), 0)::int               AS total_stock,
                   COALESCE(SUM(price * stock), 0)            AS inventory_value,
                   COUNT(*) FILTER (WHERE stock = 0)::int     AS out_of_stock,
                   COUNT(DISTINCT category)::int              AS categories
            FROM products
            """
        )
        return await cur.fetchone()


async def ping(conn: AsyncConnection) -> bool:
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1")
        return (await cur.fetchone())[0] == 1
