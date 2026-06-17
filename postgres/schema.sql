-- =====================================================================
--  E-commerce — Esquema relacional PostgreSQL
--  Versión SQL de la capa de datos (equivalente a los modelos Mongoose).
--  Tablas: products, carts, cart_items (relación N:M con cantidad).
-- =====================================================================

DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ---------------------------------------------------------------------
--  products
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    status      BOOLEAN      NOT NULL DEFAULT TRUE,
    stock       INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category    VARCHAR(50)  NOT NULL,
    thumbnails  TEXT[]       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_price    ON products (price);

-- ---------------------------------------------------------------------
--  carts
-- ---------------------------------------------------------------------
CREATE TABLE carts (
    id          SERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
--  cart_items  (tabla puente carrito <-> producto, con cantidad)
--  - ON DELETE CASCADE: si se borra el carrito, se borran sus ítems.
--  - ON DELETE RESTRICT: no se puede borrar un producto que está en un carrito.
--  - UNIQUE (cart_id, product_id): un producto aparece una sola vez por carrito.
-- ---------------------------------------------------------------------
CREATE TABLE cart_items (
    id          SERIAL PRIMARY KEY,
    cart_id     INTEGER NOT NULL REFERENCES carts (id)    ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items (cart_id);

-- ---------------------------------------------------------------------
--  Trigger: mantener updated_at al día en UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
