// Tests unitarios de los esquemas de validación Joi.
// No tocan la base: validan reglas de entrada puras (lo más barato y rápido de testear).
import { createProductSchema, updateProductSchema } from '../src/schemas/productSchemas.js';
import { addProductToCartSchema } from '../src/schemas/cartSchemas.js';

describe('createProductSchema', () => {
    const validProduct = {
        title: 'Mate Imperial',
        description: 'Mate de calabaza forrado en cuero',
        code: 'MATE-001',
        price: 15000,
        stock: 20,
        category: 'mates',
    };

    test('acepta un producto válido', () => {
        const { error, value } = createProductSchema.validate(validProduct);
        expect(error).toBeUndefined();
        expect(value.title).toBe('Mate Imperial');
    });

    test('aplica defaults de status y thumbnails', () => {
        const { value } = createProductSchema.validate(validProduct);
        expect(value.status).toBe(true);
        expect(value.thumbnails).toEqual([]);
    });

    test('rechaza si falta el título', () => {
        const { error } = createProductSchema.validate({ ...validProduct, title: undefined });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('title');
    });

    test('rechaza precio negativo', () => {
        const { error } = createProductSchema.validate({ ...validProduct, price: -5 });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('price');
    });

    test('rechaza stock no entero', () => {
        const { error } = createProductSchema.validate({ ...validProduct, stock: 3.5 });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('stock');
    });

    test('rechaza thumbnails que no son URLs', () => {
        const { error } = createProductSchema.validate({ ...validProduct, thumbnails: ['no-es-url'] });
        expect(error).toBeDefined();
    });
});

describe('updateProductSchema', () => {
    test('acepta una actualización parcial', () => {
        const { error, value } = updateProductSchema.validate({ price: 20000 });
        expect(error).toBeUndefined();
        expect(value.price).toBe(20000);
    });

    test('rechaza un body vacío (al menos un campo)', () => {
        const { error } = updateProductSchema.validate({});
        expect(error).toBeDefined();
        expect(error.message).toMatch(/al menos un campo/i);
    });
});

describe('addProductToCartSchema', () => {
    test('usa quantity = 1 por defecto', () => {
        const { error, value } = addProductToCartSchema.validate({});
        expect(error).toBeUndefined();
        expect(value.quantity).toBe(1);
    });

    test('rechaza quantity menor a 1', () => {
        const { error } = addProductToCartSchema.validate({ quantity: 0 });
        expect(error).toBeDefined();
    });

    test('rechaza quantity no entero', () => {
        const { error } = addProductToCartSchema.validate({ quantity: 2.5 });
        expect(error).toBeDefined();
    });
});
