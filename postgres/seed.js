import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, query } from './db.js';
import ProductRepository from './ProductRepository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Catálogo de ejemplo (products.json venía vacío).
const SAMPLE_PRODUCTS = [
    { title: 'Mate Imperial Calabaza', description: 'Mate de calabaza forrado en cuero', code: 'MATE-001', price: 12500.0, stock: 30, category: 'mates' },
    { title: 'Mate Camionero Acero', description: 'Mate de acero inoxidable doble pared', code: 'MATE-002', price: 18900.0, stock: 18, category: 'mates' },
    { title: 'Bombilla Alpaca Pico de Loro', description: 'Bombilla de alpaca cincelada', code: 'BOMB-001', price: 8700.0, stock: 45, category: 'bombillas' },
    { title: 'Bombilla Acero Premium', description: 'Bombilla de acero con filtro desmontable', code: 'BOMB-002', price: 6400.0, stock: 50, category: 'bombillas' },
    { title: 'Termo Stanley 1L', description: 'Termo con cebador de acero, mantiene 24h', code: 'TERM-001', price: 64900.0, stock: 12, category: 'termos' },
    { title: 'Termo Lumilagro 1L', description: 'Termo nacional clásico con ampolla de vidrio', code: 'TERM-002', price: 23500.0, stock: 25, category: 'termos' },
    { title: 'Yerba Playadito 1kg', description: 'Yerba con palo, suave', code: 'YERB-001', price: 3200.0, stock: 80, category: 'yerbas' },
    { title: 'Yerba Rosamonte 1kg', description: 'Yerba intensa de Misiones', code: 'YERB-002', price: 3400.0, stock: 75, category: 'yerbas' },
    { title: 'Set Matero Completo', description: 'Mate + bombilla + termo + yerbera', code: 'SET-001', price: 89000.0, stock: 8, category: 'sets' },
    { title: 'Yerbera + Azucarera Set', description: 'Juego de acero para llevar', code: 'SET-002', price: 15600.0, stock: 20, category: 'sets' },
];

const run = async () => {
    console.log('→ Aplicando schema.sql (recrea las tablas)...');
    const schema = await readFile(join(__dirname, 'schema.sql'), 'utf-8');
    await query(schema);

    console.log('→ Insertando productos de ejemplo...');
    const repo = new ProductRepository();
    for (const p of SAMPLE_PRODUCTS) await repo.addProduct(p);

    const { rows } = await query('SELECT COUNT(*)::int AS total FROM products');
    console.log(`✅ Seed completo: ${rows[0].total} productos en la base.`);
    await pool.end();
};

run().catch((err) => {
    console.error('❌ Seed falló:', err.message);
    pool.end();
    process.exit(1);
});
