import { Router } from 'express';
import CartManager from '../managers/CartManager.js';
import { addProductToCartSchema, cartParamsSchema } from '../schemas/cartSchemas.js';
import { validateSchema, validateParams } from '../middlewares/validation.js';

const router = Router();
const cartManager = new CartManager();

// POST / - Crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json({
            status: 'success',
            message: 'Carrito creado exitosamente',
            payload: newCart
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// GET /:cid - Obtener los productos de un carrito (con populate)
router.get('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        const cart = await cartManager.getCartByIdPopulated(cid);
        
        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Carrito no encontrado'
            });
        }

        res.json({
            status: 'success',
            payload: cart
        });
    } catch (error) {
        next(error);
    }
});

// POST /:cid/product/:pid - Agregar un producto al carrito
router.post('/:cid/product/:pid', 
    validateSchema(addProductToCartSchema), 
    async (req, res, next) => {
    try {
        const { cid, pid } = req.params;
        const { quantity = 1 } = req.body;
        
        const updatedCart = await cartManager.addProductToCart(cid, pid, quantity);
        
        res.json({
            status: 'success',
            message: 'Producto agregado al carrito exitosamente',
            payload: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /:cid/products/:pid - Eliminar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res, next) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = await cartManager.removeProductFromCart(cid, pid);
        
        res.json({
            status: 'success',
            message: 'Producto eliminado del carrito exitosamente',
            payload: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

// PUT /:cid - Actualizar todos los productos del carrito
router.put('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;
        
        const updatedCart = await cartManager.updateCartProducts(cid, products);
        
        res.json({
            status: 'success',
            message: 'Carrito actualizado exitosamente',
            payload: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

// PUT /:cid/products/:pid - Actualizar la cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res, next) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'La cantidad debe ser un número entero mayor a 0'
            });
        }
        
        const updatedCart = await cartManager.updateProductQuantity(cid, pid, quantity);
        
        res.json({
            status: 'success',
            message: 'Cantidad actualizada exitosamente',
            payload: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /:cid - Eliminar todos los productos del carrito
router.delete('/:cid', async (req, res, next) => {
    try {
        const { cid } = req.params;
        const updatedCart = await cartManager.clearCart(cid);
        
        res.json({
            status: 'success',
            message: 'Carrito vaciado exitosamente',
            payload: updatedCart
        });
    } catch (error) {
        next(error);
    }
});

export default router;
