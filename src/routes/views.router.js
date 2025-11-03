import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';
import CartManager from '../managers/CartManager.js';

const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManager();

// GET /home - Vista home con lista de productos
router.get('/home', async (req, res) => {
    try {
        const result = await productManager.getProducts({});
        res.render('home', { 
            title: 'Lista de Productos',
            products: result.payload
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
});

// GET /realtimeproducts - Vista en tiempo real con WebSockets
router.get('/realtimeproducts', async (req, res) => {
    try {
        const result = await productManager.getProducts({});
        res.render('realTimeProducts', { 
            title: 'Productos en Tiempo Real',
            products: result.payload
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
});

// GET /products - Vista de productos con paginación
router.get('/products', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query, category, availability } = req.query;
        
        const filters = {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sort,
            query: {}
        };

        // Aplicar filtros adicionales
        if (category) {
            filters.query.category = category;
        }

        if (availability !== undefined) {
            filters.query.status = availability === 'true' || availability === 'yes' || availability === '1';
        }

        const result = await productManager.getProducts(filters);
        
        res.render('products', { 
            title: 'Productos',
            products: result.payload,
            pagination: {
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.prevLink,
                nextLink: result.nextLink
            }
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            message: error.message
        });
    }
});

// GET /products/:pid - Vista de detalle de producto
router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productManager.getProductById(pid);
        
        res.render('productDetail', { 
            title: product.title,
            product: product
        });
    } catch (error) {
        res.status(404).render('error', {
            title: 'Producto no encontrado',
            message: error.message
        });
    }
});

// GET /carts/:cid - Vista de carrito específico
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartManager.getCartByIdPopulated(cid);
        
        res.render('cart', { 
            title: 'Mi Carrito',
            cart: cart
        });
    } catch (error) {
        res.status(404).render('error', {
            title: 'Carrito no encontrado',
            message: error.message
        });
    }
});

export default router;
