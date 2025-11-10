import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';
import { createProductSchema, updateProductSchema } from '../schemas/productSchemas.js';
import { validateSchema } from '../middlewares/validation.js';

const router = Router();
const productManager = new ProductManager();

// GET / - Listar todos los productos con paginación y filtros
router.get('/', async (req, res) => {
    try {
        const { limit, page, sort, query } = req.query;
        
        // Procesar los filtros
        const filters = {
            limit: limit || 10,
            page: page || 1,
            sort: sort,
            query: query ? decodeURIComponent(query) : {}
        };

        const result = await productManager.getProducts(filters);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// GET /:pid - Obtener un producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productManager.getProductById(pid);
        
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Producto no encontrado'
            });
        }

        res.json({
            status: 'success',
            payload: product
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// POST / - Agregar un nuevo producto
router.post('/', validateSchema(createProductSchema), async (req, res, next) => {
    try {
        const productData = req.body;
        const newProduct = await productManager.addProduct(productData);
        
        // Emitir evento de Socket.IO
        if (req.io) {
            req.io.emit('productAdded', newProduct);
            const updatedProducts = await productManager.getProducts();
            req.io.emit('productsUpdated', updatedProducts);
        }
        
        res.status(201).json({
            status: 'success',
            message: 'Producto creado exitosamente',
            payload: newProduct
        });
    } catch (error) {
        // El errorHandler se encargará de los códigos de estado apropiados
        next(error);
    }
});

// PUT /:pid - Actualizar un producto
router.put('/:pid', validateSchema(updateProductSchema), async (req, res, next) => {
    try {
        const { pid } = req.params;
        const updateData = req.body;
        
        const updatedProduct = await productManager.updateProduct(pid, updateData);
        
        res.json({
            status: 'success',
            message: 'Producto actualizado exitosamente',
            payload: updatedProduct
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /:pid - Eliminar un producto
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const deletedProduct = await productManager.deleteProduct(pid);
        
        // Emitir evento de Socket.IO
        if (req.io) {
            req.io.emit('productDeleted', pid);
            const updatedProducts = await productManager.getProducts();
            req.io.emit('productsUpdated', updatedProducts);
        }
        
        res.json({
            status: 'success',
            message: 'Producto eliminado exitosamente',
            payload: deletedProduct
        });
    } catch (error) {
        const statusCode = error.message === 'Producto no encontrado' ? 404 : 500;
        res.status(statusCode).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
