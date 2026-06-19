// Setup global de los tests.
// Levanta una instancia de MongoDB en memoria (mongodb-memory-server) y conecta Mongoose.
// Así los tests de integración corren contra una base real, sin mocks y sin tocar la base de desarrollo.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

// Limpiar todas las colecciones entre tests para que cada uno arranque aislado.
afterEach(async () => {
    const { collections } = mongoose.connection;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
