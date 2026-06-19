// Tests de integración de los endpoints /api/carts.
// Cubren el flujo real: crear carrito, agregar producto (descuenta stock),
// validar stock insuficiente, quitar producto (devuelve stock) y errores 404.
import request from 'supertest';
import { app } from '../src/app.js';
import Product from '../src/models/Product.js';

const buildProduct = (overrides = {}) => ({
    title: 'Bombilla Alpaca',
    description: 'Bombilla de alpaca pico de loro',
    code: `BOMB-${Math.random().toString(36).slice(2, 8)}`,
    price: 8000,
    stock: 10,
    category: 'bombillas',
    ...overrides,
});

const crearCarrito = async () => {
    const res = await request(app).post('/api/carts');
    return res.body.payload._id;
};

describe('POST /api/carts', () => {
    test('crea un carrito vacío y devuelve 201', async () => {
        const res = await request(app).post('/api/carts');

        expect(res.status).toBe(201);
        expect(res.body.payload).toHaveProperty('_id');
        expect(res.body.payload.products).toEqual([]);
    });
});

describe('GET /api/carts/:cid', () => {
    test('devuelve un carrito existente', async () => {
        const cid = await crearCarrito();

        const res = await request(app).get(`/api/carts/${cid}`);

        expect(res.status).toBe(200);
        expect(res.body.payload._id).toBe(cid);
    });

    test('devuelve 404 para un carrito inexistente', async () => {
        const res = await request(app).get('/api/carts/64b7f9f9f9f9f9f9f9f9f9f9');

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/carrito no encontrado/i);
    });
});

describe('POST /api/carts/:cid/product/:pid', () => {
    test('agrega un producto y descuenta el stock', async () => {
        const cid = await crearCarrito();
        const product = await Product.create(buildProduct({ stock: 10 }));

        const res = await request(app)
            .post(`/api/carts/${cid}/product/${product._id}`)
            .send({ quantity: 3 });

        expect(res.status).toBe(200);
        expect(res.body.payload.products).toHaveLength(1);
        expect(res.body.payload.products[0].quantity).toBe(3);

        const actualizado = await Product.findById(product._id);
        expect(actualizado.stock).toBe(7);
    });

    test('rechaza con 409 si no hay stock suficiente', async () => {
        const cid = await crearCarrito();
        const product = await Product.create(buildProduct({ stock: 2 }));

        const res = await request(app)
            .post(`/api/carts/${cid}/product/${product._id}`)
            .send({ quantity: 5 });

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/stock insuficiente/i);
    });
});

describe('DELETE /api/carts/:cid/products/:pid', () => {
    test('quita un producto del carrito y devuelve el stock', async () => {
        const cid = await crearCarrito();
        const product = await Product.create(buildProduct({ stock: 10 }));

        await request(app)
            .post(`/api/carts/${cid}/product/${product._id}`)
            .send({ quantity: 4 });

        const res = await request(app).delete(`/api/carts/${cid}/products/${product._id}`);

        expect(res.status).toBe(200);
        expect(res.body.payload.products).toHaveLength(0);

        const actualizado = await Product.findById(product._id);
        expect(actualizado.stock).toBe(10);
    });
});
