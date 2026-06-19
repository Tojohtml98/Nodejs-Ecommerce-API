// Tests de integración de los endpoints /api/products.
// Usan Supertest contra la app Express real y la Mongo en memoria (sin mocks).
import request from 'supertest';
import { app } from '../src/app.js';
import Product from '../src/models/Product.js';

const sampleProduct = {
    title: 'Mate Imperial',
    description: 'Mate de calabaza forrado en cuero',
    code: 'MATE-001',
    price: 15000,
    stock: 20,
    category: 'mates',
};

describe('POST /api/products', () => {
    test('crea un producto y devuelve 201', async () => {
        const res = await request(app).post('/api/products').send(sampleProduct);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.payload).toHaveProperty('_id');
        expect(res.body.payload.title).toBe('Mate Imperial');

        const enDB = await Product.findOne({ code: 'MATE-001' });
        expect(enDB).not.toBeNull();
    });

    test('rechaza un producto inválido con 422', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ ...sampleProduct, title: undefined });

        expect(res.status).toBe(422);
        expect(res.body.status).toBe('error');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('rechaza código duplicado con 409', async () => {
        await request(app).post('/api/products').send(sampleProduct);
        const res = await request(app).post('/api/products').send(sampleProduct);

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/código/i);
    });
});

describe('GET /api/products', () => {
    test('devuelve lista paginada con success cuando hay productos', async () => {
        await Product.create(sampleProduct);

        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.payload)).toBe(true);
        expect(res.body.payload).toHaveLength(1);
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('hasNextPage');
    });

    test('respeta el límite de paginación', async () => {
        await Product.create([
            { ...sampleProduct, code: 'A1' },
            { ...sampleProduct, code: 'A2' },
            { ...sampleProduct, code: 'A3' },
        ]);

        const res = await request(app).get('/api/products?limit=2');

        expect(res.status).toBe(200);
        expect(res.body.payload).toHaveLength(2);
        expect(res.body.hasNextPage).toBe(true);
    });
});

describe('GET /api/products/:pid', () => {
    test('devuelve un producto existente', async () => {
        const creado = await Product.create(sampleProduct);

        const res = await request(app).get(`/api/products/${creado._id}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.payload._id).toBe(creado._id.toString());
    });
});

describe('PUT /api/products/:pid', () => {
    test('actualiza un producto existente', async () => {
        const creado = await Product.create(sampleProduct);

        const res = await request(app)
            .put(`/api/products/${creado._id}`)
            .send({ price: 22000 });

        expect(res.status).toBe(200);
        expect(res.body.payload.price).toBe(22000);
    });

    test('rechaza un update con body vacío (422)', async () => {
        const creado = await Product.create(sampleProduct);

        const res = await request(app).put(`/api/products/${creado._id}`).send({});

        expect(res.status).toBe(422);
    });
});

describe('DELETE /api/products/:pid', () => {
    test('elimina un producto existente', async () => {
        const creado = await Product.create(sampleProduct);

        const res = await request(app).delete(`/api/products/${creado._id}`);

        expect(res.status).toBe(200);
        const enDB = await Product.findById(creado._id);
        expect(enDB).toBeNull();
    });

    test('devuelve 404 al eliminar un producto inexistente', async () => {
        const idInexistente = '64b7f9f9f9f9f9f9f9f9f9f9';
        const res = await request(app).delete(`/api/products/${idInexistente}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/no encontrado/i);
    });
});
