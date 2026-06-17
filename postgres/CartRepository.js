import { query, withTransaction } from './db.js';

class CartRepository {
    async createCart() {
        const { rows } = await query('INSERT INTO carts DEFAULT VALUES RETURNING *');
        return { ...rows[0], products: [] };
    }

    // Carrito + sus productos en una sola query con JOIN + agregación JSON.
    // Es el equivalente SQL al .populate('products.productId') de Mongoose.
    async getCartById(cartId) {
        const { rows } = await query(
            `SELECT c.id, c.created_at, c.updated_at,
                    COALESCE(
                        json_agg(
                            json_build_object('product', to_jsonb(p), 'quantity', ci.quantity)
                            ORDER BY ci.id
                        ) FILTER (WHERE ci.id IS NOT NULL),
                        '[]'
                    ) AS products
             FROM carts c
             LEFT JOIN cart_items ci ON ci.cart_id = c.id
             LEFT JOIN products   p  ON p.id = ci.product_id
             WHERE c.id = $1
             GROUP BY c.id`,
            [cartId]
        );
        if (!rows[0]) throw new Error('Carrito no encontrado');
        return rows[0];
    }

    // Agrega un producto al carrito descontando stock de forma atómica.
    // SELECT ... FOR UPDATE bloquea la fila del producto durante la transacción
    // para que dos requests simultáneos no vendan el mismo stock dos veces.
    async addProductToCart(cartId, productId, quantity = 1) {
        return withTransaction(async (client) => {
            const cart = await client.query('SELECT id FROM carts WHERE id = $1', [cartId]);
            if (!cart.rows[0]) throw new Error('Carrito no encontrado');

            const product = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
            if (!product.rows[0]) throw new Error('Producto no encontrado');
            if (product.rows[0].stock < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.rows[0].stock}, Solicitado: ${quantity}`);
            }

            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);

            // Upsert: si el producto ya está en el carrito, suma la cantidad.
            await client.query(
                `INSERT INTO cart_items (cart_id, product_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (cart_id, product_id)
                 DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
                [cartId, productId, quantity]
            );
            await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

            return this.getCartById(cartId);
        });
    }

    // Quita un producto del carrito y devuelve su cantidad al stock.
    async removeProductFromCart(cartId, productId) {
        return withTransaction(async (client) => {
            const item = await client.query(
                'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING quantity',
                [cartId, productId]
            );
            if (!item.rows[0]) throw new Error('Producto no encontrado en el carrito');

            await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.rows[0].quantity, productId]);
            await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

            return this.getCartById(cartId);
        });
    }

    // Fija una nueva cantidad ajustando el stock por la diferencia.
    async updateProductQuantity(cartId, productId, newQuantity) {
        if (!Number.isInteger(newQuantity) || newQuantity < 1) {
            throw new Error('La cantidad debe ser un número entero mayor a 0');
        }
        return withTransaction(async (client) => {
            const item = await client.query(
                'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
                [cartId, productId]
            );
            if (!item.rows[0]) throw new Error('Producto no encontrado en el carrito');

            const product = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [productId]);
            if (!product.rows[0]) throw new Error('Producto no encontrado');

            const diff = newQuantity - item.rows[0].quantity;
            if (diff > 0 && product.rows[0].stock < diff) {
                throw new Error('Stock insuficiente para la cantidad solicitada');
            }

            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [diff, productId]);
            await client.query('UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3', [
                newQuantity,
                cartId,
                productId,
            ]);
            await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

            return this.getCartById(cartId);
        });
    }

    // Vacía el carrito devolviendo todo el stock.
    async clearCart(cartId) {
        return withTransaction(async (client) => {
            const items = await client.query('SELECT product_id, quantity FROM cart_items WHERE cart_id = $1', [cartId]);
            for (const { product_id, quantity } of items.rows) {
                await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, product_id]);
            }
            await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
            await client.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);
            return this.getCartById(cartId);
        });
    }

    // Borra el carrito (los cart_items caen por ON DELETE CASCADE) devolviendo stock.
    async deleteCart(cartId) {
        return withTransaction(async (client) => {
            const items = await client.query('SELECT product_id, quantity FROM cart_items WHERE cart_id = $1', [cartId]);
            for (const { product_id, quantity } of items.rows) {
                await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, product_id]);
            }
            const deleted = await client.query('DELETE FROM carts WHERE id = $1 RETURNING id', [cartId]);
            if (!deleted.rows[0]) throw new Error('Carrito no encontrado');
        });
    }
}

export default CartRepository;
