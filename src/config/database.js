import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB conectado exitosamente');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

// Manejo de eventos de conexión
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de MongoDB:', err.message);
});

export default mongoose;

