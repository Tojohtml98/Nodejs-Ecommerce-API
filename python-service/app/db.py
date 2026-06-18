"""Pool de conexiones async a PostgreSQL.

Un pool reutiliza conexiones en vez de abrir una por request — igual que el
`pg.Pool` del lado Node. Acá es async: cada request agarra una conexión libre
sin bloquear el event loop.
"""

from collections.abc import AsyncIterator

from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool

from .config import settings

# open=False: se abre explícitamente en el lifespan de la app, no al importar.
pool = AsyncConnectionPool(settings.pg_url, open=False, min_size=1, max_size=10)


async def get_conn() -> AsyncIterator[AsyncConnection]:
    """Dependency de FastAPI: presta una conexión del pool y la devuelve al final."""
    async with pool.connection() as conn:
        yield conn
