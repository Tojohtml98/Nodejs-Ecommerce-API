import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import { errorHandler } from './middlewares/validation.js';
import { socketMiddleware } from './middlewares/socketMiddleware.js';
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
const PORT = process.env.PORT || 8080;

// --- Configuración Handlebars ---
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views'));

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Socket.IO middleware ---
app.use(socketMiddleware(io));

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

        // --- Socket.IO: Manejo de conexiones ---
        io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);

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
