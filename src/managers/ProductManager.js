import Product from '../models/Product.js';

class ProductManager {
    constructor() {
        this.model = Product;
    }

    async getProducts(filters = {}) {
        try {
            const {
                limit = 10,
                page = 1,
                sort = null,
                query = {}
            } = filters;

            // Construir el filtro de búsqueda
            let mongoQuery = {};

            // Si hay un query (filtro), aplicarlo
            if (query) {
                if (typeof query === 'string') {
                    // Si es string, intentar parsearlo
                    try {
                        mongoQuery = JSON.parse(query);
                    } catch (e) {
                        // Si no se puede parsear, tratarlo como búsqueda por categoría
                        mongoQuery = { category: query };
                    }
                } else {
                    mongoQuery = query;
                }
            }

            // Construir opciones de paginación y ordenamiento
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                lean: true // Para obtener objetos JavaScript simples en lugar de documentos Mongoose
            };

            // Agregar ordenamiento si se especifica
            if (sort) {
                const sortOrder = sort.toLowerCase() === 'desc' ? -1 : 1;
                options.sort = { price: sortOrder };
            }

            // Ejecutar la consulta con paginación
            const result = await this.model.paginate(mongoQuery, options);

            // Construir parámetros de query para los links
            const buildQueryParams = (pageNum) => {
                const params = new URLSearchParams();
                params.append('page', pageNum);
                params.append('limit', limit);
                if (sort) params.append('sort', sort);
                if (query && Object.keys(mongoQuery).length > 0) {
                    params.append('query', encodeURIComponent(JSON.stringify(mongoQuery)));
                }
                return params.toString();
            };

            return {
                status: result.docs.length > 0 ? 'success' : 'error',
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage 
                    ? `/api/products?${buildQueryParams(result.prevPage)}`
                    : null,
                nextLink: result.hasNextPage 
                    ? `/api/products?${buildQueryParams(result.nextPage)}`
                    : null
            };
        } catch (error) {
            console.error('Error getting products:', error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const product = await this.model.findById(id);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            return product;
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                throw error;
            }
            throw new Error('Producto no encontrado');
        }
    }

    async productExists(code) {
        try {
            const product = await this.model.findOne({ code });
            return !!product;
        } catch (error) {
            console.error('Error checking product existence:', error);
            return false;
        }
    }

    async addProduct(productData) {
        try {
            // Generate code if not provided
            if (!productData.code) {
                productData.code = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            if (await this.productExists(productData.code)) {
                throw new Error('Ya existe un producto con el mismo código');
            }

            const newProduct = new this.model(productData);
            await newProduct.save();
            return newProduct;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                throw new Error('Ya existe un producto con el mismo código');
            }
            throw error;
        }
    }

    async updateProduct(id, updateData) {
        try {
            if (updateData.code) {
                const existingProduct = await this.model.findOne({ 
                    code: updateData.code,
                    _id: { $ne: id }
                });
                
                if (existingProduct) {
                    throw new Error('Ya existe otro producto con el mismo código');
                }
            }

            const updatedProduct = await this.model.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedProduct) {
                throw new Error('Producto no encontrado');
            }

            return updatedProduct;
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                throw new Error('Ya existe otro producto con el mismo código');
            }
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const deletedProduct = await this.model.findByIdAndDelete(id);
            if (!deletedProduct) {
                throw new Error('Producto no encontrado');
            }
            return deletedProduct;
        } catch (error) {
            throw new Error('Producto no encontrado');
        }
    }

    async hasStock(productId, quantity = 1) {
        try {
            const product = await this.getProductById(productId);
            return product.stock >= quantity;
        } catch (error) {
            return false;
        }
    }

    async updateStock(productId, quantity, action = 'decrement') {
        try {
            const product = await this.getProductById(productId);
            
            if (action === 'decrement') {
                if (product.stock < quantity) {
                    throw new Error('Stock insuficiente');
                }
                product.stock -= quantity;
            } else if (action === 'increment') {
                product.stock += quantity;
            } else {
                throw new Error('Acción no válida para actualizar el stock');
            }

            await product.save();
            return product;
        } catch (error) {
            throw error;
        }
    }
}

export default ProductManager;
