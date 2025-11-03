import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import { errorHandler } from './middlewares/validation.js';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';
import ProductManager from './managers/ProductManager.js';
import { connectDB } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = 8080;

// --- Configuración Handlebars ---
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views'));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Hacer io globalmente accesible ---
app.set('io', io);

// --- Rutas ---
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// --- Endpoint raíz ---
app.get('/', (req, res) => {
    res.json({
        message: 'API de E-commerce',
        endpoints: {
            products: '/api/products',
            carts: '/api/carts',
            home: '/home',
            realtime: '/realtimeproducts'
        }
    });
});

// --- Manejo de rutas no encontradas ---
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ruta no encontrada',
        path: req.path
    });
});

// --- Middleware global de errores ---
app.use(errorHandler);

// --- Iniciar servidor ---
const startServer = async () => {
    try {
        // --- Conectar a MongoDB ---
        await connectDB();

        // --- Instancia única de ProductManager ---
        const productManager = new ProductManager();

        // --- Socket.IO ---
        io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);

            // Agregar producto
            socket.on('addProduct', async (productData) => {
                try {
                    const newProduct = await productManager.addProduct(productData);
                    const updatedProducts = await productManager.getProducts();

                    io.emit('productAdded', newProduct);
                    io.emit('productsUpdated', updatedProducts);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Eliminar producto
            socket.on('deleteProduct', async (productId) => {
                try {
                    await productManager.deleteProduct(productId);
                    const updatedProducts = await productManager.getProducts();

                    io.emit('productDeleted', productId);
                    io.emit('productsUpdated', updatedProducts);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });

        server.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();
