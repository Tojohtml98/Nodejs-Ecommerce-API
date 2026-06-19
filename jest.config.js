// Jest configurado para ESM nativo (el proyecto usa "type": "module").
// El script de test agrega NODE_OPTIONS=--experimental-vm-modules para soportarlo.
export default {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    // Sin transform: ejecutamos ESM nativo, sin Babel.
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    // La primera corrida descarga el binario de mongodb-memory-server.
    testTimeout: 30000,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js',
        '!src/config/**',
    ],
    verbose: true,
};
