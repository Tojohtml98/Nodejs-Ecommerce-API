import { pool, query } from './db.js';
import ProductRepository from './ProductRepository.js';
import CartRepository from './CartRepository.js';

const products = new ProductRepository();
const carts = new CartRepository();

const line = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 50 - t.length))}`);
const stockOf = async (id) => (await products.getProductById(id)).stock;

const run = async () => {
    line('1. Paginación (limit=3, page=1) — LIMIT/OFFSET + COUNT');
    const page1 = await products.getProducts({ limit: 3, page: 1 });
    console.log(`payload: ${page1.payload.map((p) => p.title).join(', ')}`);
    console.log(`page ${page1.page}/${page1.totalPages} · total ${page1.totalDocs} · next? ${page1.hasNextPage}`);

    line('2. Filtro por categoría = "mates" + orden precio DESC');
    const mates = await products.getProducts({ category: 'mates', sort: 'desc' });
    console.log(mates.payload.map((p) => `${p.title} ($${p.price})`).join('\n'));

    line('3. Crear carrito');
    const cart = await carts.createCart();
    console.log(`carrito #${cart.id} creado`);

    const [a, b] = page1.payload;
    line('4. Agregar 2 productos (transacción + descuento de stock)');
    console.log(`stock "${a.title}" antes: ${await stockOf(a.id)}`);
    await carts.addProductToCart(cart.id, a.id, 2);
    await carts.addProductToCart(cart.id, b.id, 1);
    await carts.addProductToCart(cart.id, a.id, 3); // upsert: suma cantidad
    console.log(`stock "${a.title}" después de comprar 5: ${await stockOf(a.id)}`);

    line('5. Ver carrito con JOIN (cart_items ⋈ products) — equivale a populate');
    const full = await carts.getCartById(cart.id);
    full.products.forEach((it) => console.log(`  ${it.quantity}× ${it.product.title} ($${it.product.price})`));

    line('6. Cambiar cantidad y quitar un ítem (ajusta stock)');
    await carts.updateProductQuantity(cart.id, a.id, 1);
    await carts.removeProductFromCart(cart.id, b.id);
    const after = await carts.getCartById(cart.id);
    console.log(`carrito ahora: ${after.products.map((it) => `${it.quantity}× ${it.product.title}`).join(', ')}`);
    console.log(`stock "${a.title}" restaurado a: ${await stockOf(a.id)}`);

    line('7. Validación de constraint (stock insuficiente)');
    try {
        await carts.addProductToCart(cart.id, a.id, 999999);
    } catch (e) {
        console.log(`✅ rechazado correctamente: "${e.message}"`);
    }

    line('Limpieza');
    await carts.deleteCart(cart.id);
    console.log('carrito borrado (cart_items por CASCADE)');

    console.log('\n✅ Demo PostgreSQL OK — todas las operaciones corrieron contra la base real.');
    await pool.end();
};

run().catch((err) => {
    console.error('\n❌ Demo falló:', err.message);
    pool.end();
    process.exit(1);
});
