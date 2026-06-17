import { query } from './db.js';

// Columnas que el cliente puede actualizar (lista blanca anti-inyección).
const UPDATABLE = ['title', 'description', 'code', 'price', 'status', 'stock', 'category', 'thumbnails'];

class ProductRepository {
    // Listado paginado. Filtra por categoría opcional y ordena por precio.
    // Equivale al .paginate() de mongoose-paginate, pero con SQL puro.
    async getProducts({ limit = 10, page = 1, sort = null, category = null } = {}) {
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const perPage = Math.max(parseInt(limit) || 10, 1);
        const offset = (pageNum - 1) * perPage;

        const where = [];
        const params = [];
        if (category) {
            params.push(category);
            where.push(`category = $${params.length}`);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        let orderSql = 'ORDER BY id ASC';
        if (sort) orderSql = `ORDER BY price ${sort.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;

        // Total para calcular totalPages (mismo filtro, sin paginar).
        const countResult = await query(`SELECT COUNT(*)::int AS total FROM products ${whereSql}`, params);
        const totalDocs = countResult.rows[0].total;
        const totalPages = Math.max(Math.ceil(totalDocs / perPage), 1);

        // Página de resultados.
        const dataParams = [...params, perPage, offset];
        const dataResult = await query(
            `SELECT * FROM products ${whereSql} ${orderSql} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );

        const hasPrevPage = pageNum > 1;
        const hasNextPage = pageNum < totalPages;
        return {
            status: dataResult.rows.length > 0 ? 'success' : 'error',
            payload: dataResult.rows,
            totalDocs,
            totalPages,
            page: pageNum,
            hasPrevPage,
            hasNextPage,
            prevPage: hasPrevPage ? pageNum - 1 : null,
            nextPage: hasNextPage ? pageNum + 1 : null,
        };
    }

    async getProductById(id) {
        const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
        if (!rows[0]) throw new Error('Producto no encontrado');
        return rows[0];
    }

    async productExists(code) {
        const { rows } = await query('SELECT 1 FROM products WHERE code = $1', [code]);
        return rows.length > 0;
    }

    async addProduct(data) {
        const code = data.code || `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        if (await this.productExists(code)) {
            throw new Error('Ya existe un producto con el mismo código');
        }
        const { rows } = await query(
            `INSERT INTO products (title, description, code, price, status, stock, category, thumbnails)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                data.title,
                data.description,
                code,
                data.price,
                data.status ?? true,
                data.stock ?? 0,
                data.category,
                data.thumbnails ?? [],
            ]
        );
        return rows[0];
    }

    async updateProduct(id, data) {
        const fields = Object.keys(data).filter((k) => UPDATABLE.includes(k));
        if (fields.length === 0) return this.getProductById(id);

        if (data.code) {
            const { rows } = await query('SELECT 1 FROM products WHERE code = $1 AND id <> $2', [data.code, id]);
            if (rows.length) throw new Error('Ya existe otro producto con el mismo código');
        }

        const setSql = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const params = fields.map((f) => data[f]);
        params.push(id);

        const { rows } = await query(
            `UPDATE products SET ${setSql} WHERE id = $${params.length} RETURNING *`,
            params
        );
        if (!rows[0]) throw new Error('Producto no encontrado');
        return rows[0];
    }

    async deleteProduct(id) {
        const { rows } = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (!rows[0]) throw new Error('Producto no encontrado');
        return rows[0];
    }
}

export default ProductRepository;
