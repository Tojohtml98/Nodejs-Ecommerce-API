import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Pool de conexiones a PostgreSQL. Un pool reutiliza conexiones en vez de
// abrir/cerrar una por query — clave para performance en una API.
export const pool = new Pool({
    connectionString:
        process.env.PG_URL || 'postgres://ecommerce:ecommerce@localhost:5433/ecommerce',
    max: 10,
    idleTimeoutMillis: 30000,
});

// Helper para queries sueltas. Devuelve directamente las filas.
export const query = (text, params) => pool.query(text, params);

// Helper para transacciones: corre un callback con un client dedicado,
// hace COMMIT si todo sale bien y ROLLBACK ante cualquier error.
export const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
