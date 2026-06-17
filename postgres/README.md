# Versión PostgreSQL — capa de datos relacional

Implementación **SQL pura** (con `pg`) de la capa de datos del e-commerce, como
alternativa a la versión original con MongoDB/Mongoose. Convive con el código Mongo
sin reemplazarlo: muestra el mismo dominio (productos y carritos) modelado de forma
**relacional**.

## Por qué relacional acá
El carrito es una relación **N:M** entre carritos y productos con un atributo extra
(la cantidad). En SQL eso es una tabla puente `cart_items` con claves foráneas —
el modelo natural para datos con integridad referencial y operaciones de stock
que deben ser consistentes.

## Esquema (`schema.sql`)
- **products** — `price > 0`, `stock >= 0` por `CHECK`, `code` único, `thumbnails` como `TEXT[]`.
- **carts** — carrito.
- **cart_items** — puente `cart_id`/`product_id` con `quantity`, `UNIQUE (cart_id, product_id)`.
  - `ON DELETE CASCADE` desde `carts`: borrar el carrito borra sus ítems.
  - `ON DELETE RESTRICT` hacia `products`: no se borra un producto que está en un carrito.
- Índices en `category`, `price` y `cart_id`. Trigger que mantiene `updated_at`.

## Decisiones técnicas que se ven en el código
- **Queries parametrizadas** (`$1, $2…`) en todo: nunca concateno input → sin SQL injection.
- **Pool de conexiones** (`db.js`) en vez de abrir/cerrar conexión por query.
- **Transacciones** (`withTransaction` → `BEGIN/COMMIT/ROLLBACK`) en toda operación
  que toca stock + carrito a la vez, para que sea atómica.
- **`SELECT … FOR UPDATE`**: bloquea la fila del producto durante la transacción
  para evitar vender el mismo stock dos veces en requests concurrentes.
- **`INSERT … ON CONFLICT DO UPDATE`** (upsert): si el producto ya está en el carrito, suma cantidad.
- **`JOIN` + `json_agg`** en `getCartById`: trae el carrito con los datos completos
  de cada producto en una sola query (equivalente al `populate` de Mongoose).
- **Paginación** con `LIMIT/OFFSET` + `COUNT(*)` para `totalPages`.

## Cómo correrlo
```bash
npm run pg:up      # levanta PostgreSQL 16 en Docker (puerto 5433)
npm run pg:seed    # aplica schema.sql + carga catálogo de ejemplo
npm run pg:demo    # ejercita paginación, JOIN, transacciones y constraints
npm run pg:down    # apaga el contenedor
```

## Archivos
| Archivo | Qué hace |
|---|---|
| `schema.sql` | DDL: tablas, claves foráneas, constraints, índices, trigger |
| `db.js` | Pool de `pg` + helper de transacciones |
| `ProductRepository.js` | CRUD de productos + paginación/filtro en SQL |
| `CartRepository.js` | Carrito con JOIN, transacciones y manejo de stock |
| `seed.js` | Recrea el esquema y carga productos de ejemplo |
| `demo.js` | Smoke test que corre todo contra la base real |
