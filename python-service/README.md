# 🐍 python-service — Microservicio de analytics (FastAPI)

Versión **Python** de una capa de lectura sobre el mismo e-commerce. Convive con
la API Node (no la reemplaza) y lee la **misma base PostgreSQL** que la capa
`postgres/`. Node se ocupa de la escritura (productos, carritos, stock con
transacciones); este servicio expone **consultas de lectura y métricas
agregadas** en Python.

Es el patrón de **microservicios políglotas**: cada servicio en el lenguaje que
mejor le calza, hablando contra un dato compartido.

```
React / cliente
      │  HTTP
      ├──────────────► Node + Express      (escritura: carrito, stock, checkout)
      │                      │
      └──────────────► FastAPI (este)      (lectura + analytics)
                             │
                             ▼
                    🐘 PostgreSQL  ← una sola base, dos servicios
```

## Stack

- **FastAPI** — framework async, validación y **Swagger** auto-generado.
- **Pydantic v2** — modelos tipados de entrada/salida (el "TypeScript" de Python).
- **psycopg 3** (async + pool) — driver PostgreSQL con queries parametrizadas.
- **uvicorn** — servidor ASGI.

## Estructura

```
python-service/
├── app/
│   ├── config.py       # Settings tipadas (Pydantic) — lee PG_URL del entorno
│   ├── db.py           # Pool de conexiones async + dependency get_conn
│   ├── schemas.py      # Modelos Pydantic (el contrato de la API)
│   ├── repository.py   # Todas las queries SQL (parametrizadas)
│   └── main.py         # FastAPI app + rutas
├── requirements.txt
├── .env.example
└── demo.sh             # demo end-to-end contra la base real
```

## Cómo correrlo

Requiere el Postgres del proyecto levantado y seedeado:

```bash
# 1) Base (desde la raíz del repo)
cd ../postgres && docker compose up -d && node seed.js && cd -

# 2) Entorno Python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 3) Servidor
uvicorn app.main:app --reload
# Docs interactivas: http://localhost:8000/docs
```

O todo junto, automático: `./demo.sh`

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/health` | Ping a la base |
| `GET` | `/products` | Listado con filtros (`category`, `min_price`, `max_price`) + paginación (`limit`, `offset`) |
| `GET` | `/products/{id}` | Detalle de un producto (404 si no existe) |
| `GET` | `/analytics/by-category` | Por categoría: cantidad, stock, valor de inventario, precio promedio (`GROUP BY`) |
| `GET` | `/analytics/inventory` | Totales globales del catálogo |

## Lo que demuestra

- API en Python con **FastAPI** + tipado **Pydantic** + **async/await**.
- Driver PostgreSQL real con **pool de conexiones** y **queries parametrizadas** (anti inyección SQL).
- **SQL de agregación** (`GROUP BY`, `SUM`, `AVG`, `FILTER`) detrás de endpoints de analytics.
- Pensar en **microservicios**: dos lenguajes, una base, responsabilidades separadas.
