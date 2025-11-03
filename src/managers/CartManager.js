import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

class CartManager {
    constructor() {
        this.model = Cart;
        this.productModel = Product;
    }

    async createCart() {
        try {
            const newCart = new this.model({ products: [] });
            await newCart.save();
            return newCart;
        } catch (error) {
            console.error('Error creating cart:', error);
            throw error;
        }
    }

    async getCartById(cartId) {
        try {
            const cart = await this.model.findById(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return cart;
        } catch (error) {
            if (error.message === 'Carrito no encontrado') {
                throw error;
            }
            throw new Error('Carrito no encontrado');
        }
    }

    async getCartByIdPopulated(cartId) {
        try {
            const cart = await this.model.findById(cartId).populate('products.productId');
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            return cart;
        } catch (error) {
            if (error.message === 'Carrito no encontrado') {
                throw error;
            }
            throw new Error('Carrito no encontrado');
        }
    }

    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            // Check if cart exists
            const cart = await this.getCartById(cartId);

            // Check if product exists
            const product = await this.productModel.findById(productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Check stock availability
            if (product.stock < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`);
            }

            // Check if product already exists in cart
            const existingProductIndex = cart.products.findIndex(
                p => p.productId.toString() === productId
            );

            if (existingProductIndex >= 0) {
                // Update quantity if product already in cart
                cart.products[existingProductIndex].quantity += quantity;
            } else {
                // Add new product to cart
                cart.products.push({
                    productId,
                    quantity
                });
            }

            // Decrease product stock
            product.stock -= quantity;
            await product.save();

            // Save cart changes
            await cart.save();
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async removeProductFromCart(cartId, productId) {
        try {
            const cart = await this.getCartById(cartId);
            const productIndex = cart.products.findIndex(
                p => p.productId.toString() === productId
            );

            if (productIndex === -1) {
                throw new Error('Producto no encontrado en el carrito');
            }

            // Get quantity to return to stock
            const { quantity } = cart.products[productIndex];

            // Remove product from cart
            cart.products.splice(productIndex, 1);

            // Return stock
            const product = await this.productModel.findById(productId);
            if (product) {
                product.stock += quantity;
                await product.save();
            }

            // Save cart changes
            await cart.save();
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async updateProductQuantity(cartId, productId, newQuantity) {
        try {
            // Validate quantity
            if (!Number.isInteger(newQuantity) || newQuantity < 1) {
                throw new Error('La cantidad debe ser un número entero mayor a 0');
            }

            const cart = await this.getCartById(cartId);
            const productInCart = cart.products.find(
                p => p.productId.toString() === productId
            );

            if (!productInCart) {
                throw new Error('Producto no encontrado en el carrito');
            }

            const quantityDifference = newQuantity - productInCart.quantity;
            const product = await this.productModel.findById(productId);

            if (!product) {
                throw new Error('Producto no encontrado');
            }

            if (quantityDifference > 0) {
                // Increasing quantity - check stock
                if (product.stock < quantityDifference) {
                    throw new Error('Stock insuficiente para la cantidad solicitada');
                }
                product.stock -= quantityDifference;
            } else if (quantityDifference < 0) {
                // Decreasing quantity - return stock
                product.stock += -quantityDifference;
            }

            await product.save();

            // Update quantity in cart
            productInCart.quantity = newQuantity;

            // Save changes
            await cart.save();
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async updateCartProducts(cartId, products) {
        try {
            const cart = await this.getCartById(cartId);

            // Validar que products sea un array
            if (!Array.isArray(products)) {
                throw new Error('Los productos deben ser un array');
            }

            // Validar cada producto y actualizar el stock
            for (const item of cart.products) {
                const product = await this.productModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Actualizar el carrito con los nuevos productos
            const newProducts = [];
            for (const item of products) {
                const product = await this.productModel.findById(item.productId);
                if (!product) {
                    throw new Error(`Producto con ID ${item.productId} no encontrado`);
                }

                // Validar cantidad
                if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                    throw new Error('La cantidad debe ser un número entero mayor a 0');
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para el producto ${product.title}`);
                }

                product.stock -= item.quantity;
                await product.save();

                newProducts.push({
                    productId: item.productId,
                    quantity: item.quantity
                });
            }

            cart.products = newProducts;
            await cart.save();

            return cart;
        } catch (error) {
            throw error;
        }
    }

    async clearCart(cartId) {
        try {
            const cart = await this.getCartById(cartId);

            // Return all products to stock
            for (const item of cart.products) {
                const product = await this.productModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Clear cart
            cart.products = [];
            await cart.save();

            return cart;
        } catch (error) {
            throw error;
        }
    }

    async deleteCart(cartId) {
        try {
            const cart = await this.getCartById(cartId);

            // Return all products to stock before deleting
            for (const item of cart.products) {
                const product = await this.productModel.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Remove cart
            await this.model.findByIdAndDelete(cartId);
        } catch (error) {
            throw error;
        }
    }
}

export default CartManager;
