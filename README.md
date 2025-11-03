# E-commerce API con WebSockets y MongoDB

API REST para la gestión de productos y carritos de compra desarrollada con Node.js, Express, Handlebars, Socket.IO y MongoDB.

## Características

- ✅ Gestión completa de productos (CRUD)
- ✅ Gestión de carritos de compra con referencias a productos
- ✅ **Vistas con Handlebars** (home, productos, detalle de producto, carrito)
- ✅ **WebSockets con Socket.IO** para actualizaciones en tiempo real
- ✅ **Persistencia en MongoDB** con Mongoose
- ✅ **Paginación y filtros** de productos
- ✅ **Ordenamiento** ascendente/descendente por precio
- ✅ Validación de datos con Joi
- ✅ Manejo de errores consistente con códigos HTTP apropiados
- ✅ Validación de stock y existencia de productos
- ✅ **Populate** de productos en carritos
- ✅ IDs autogenerados (ObjectId de MongoDB)

## Requisitos

- Node.js (v14 o superior)
- npm
- **MongoDB** (instalado y ejecutándose)

## Instalación

1. Clonar el repositorio
2. Instalar las dependencias:
```bash
npm install
```

3. Instalar y ejecutar MongoDB:
```bash
# En Windows (con MongoDB instalado)
mongod

# En macOS (con Homebrew)
brew services start mongodb-community

# En Linux
sudo systemctl start mongod
```

4. (Opcional) Configurar variable de entorno para MongoDB:
```bash
# Windows
set MONGODB_URI=mongodb://localhost:27017/ecommerce

# macOS/Linux
export MONGODB_URI=mongodb://localhost:27017/ecommerce
```

## Uso

### Iniciar el servidor
```bash
npm start
```

El servidor se ejecutará en `http://localhost:8080`

### Modo desarrollo (con auto-reload)
```bash
npm run dev
```

## Vistas Disponibles

### 🏠 Vista Home (`/home`)
- Lista todos los productos en una interfaz web
- Diseño responsive con Bootstrap
- Navegación entre vistas

### 📦 Vista Productos (`/products`)
- Lista de productos con **paginación**
- Filtros por categoría y disponibilidad
- Ordenamiento por precio (asc/desc)
- Botones para ver detalles o agregar al carrito

### 🔍 Vista Detalle de Producto (`/products/:pid`)
- Muestra información completa del producto
- Imágenes si están disponibles
- Botón para agregar al carrito
- Navegación de vuelta a productos

### 🛒 Vista Carrito (`/carts/:cid`)
- Lista de productos del carrito con **populate**
- Cálculo automático de totales
- Eliminar productos individuales
- Vaciar carrito completo

### ⚡ Vista Tiempo Real (`/realtimeproducts`)
- Lista de productos con actualizaciones en tiempo real
- Formulario para agregar nuevos productos
- Eliminación de productos con confirmación
- Indicador de conexión WebSocket

## Endpoints API

### Vistas Web
- `GET /home` - Vista home con lista de productos
- `GET /products` - Vista de productos con paginación
- `GET /products/:pid` - Detalle de producto
- `GET /carts/:cid` - Vista de carrito
- `GET /realtimeproducts` - Vista en tiempo real con WebSockets

### API REST - Productos (`/api/products`)

#### GET `/api/products`
Lista productos con paginación, filtros y ordenamiento.

**Query Parameters:**
- `limit` (opcional, default: 10): Número de productos por página
- `page` (opcional, default: 1): Página a mostrar
- `sort` (opcional): `asc` o `desc` para ordenar por precio
- `query` (opcional): Filtros JSON codificados

**Ejemplos:**
```bash
# Obtener primera página
GET /api/products

# Obtener segunda página con 5 productos
GET /api/products?page=2&limit=5

# Ordenar por precio descendente
GET /api/products?sort=desc

# Filtrar por categoría
GET /api/products?query={"category":"Electrónicos"}

# Combinar filtros
GET /api/products?page=1&limit=10&sort=asc&query={"status":true}
```

**Respuesta:**
```json
{
  "status": "success",
  "payload": [...],
  "totalPages": 5,
  "prevPage": null,
  "nextPage": 2,
  "page": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevLink": null,
  "nextLink": "/api/products?page=2&limit=10"
}
```

#### GET `/api/products/:pid`
Obtiene un producto por su ID.

**Respuesta:**
```json
{
  "status": "success",
  "payload": {
    "_id": "...",
    "title": "Producto de ejemplo",
    "description": "Descripción del producto",
    "code": "PROD001",
    "price": 100.50,
    "status": true,
    "stock": 50,
    "category": "Categoría",
    "thumbnails": ["https://example.com/image1.jpg"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### POST `/api/products`
Crea un nuevo producto.

**Body:**
```json
{
  "title": "Producto de ejemplo",
  "description": "Descripción del producto",
  "code": "PROD001",
  "price": 100.50,
  "status": true,
  "stock": 50,
  "category": "Categoría",
  "thumbnails": ["https://example.com/image1.jpg"]
}
```

**Campos requeridos:** `title`, `description`, `code`, `price`, `stock`, `category`

**Validaciones:**
- `title`: 1-100 caracteres
- `description`: 1-500 caracteres
- `code`: 1-20 caracteres, único
- `price`: número positivo
- `stock`: entero no negativo
- `category`: 1-50 caracteres
- `thumbnails`: array de URLs válidas

#### PUT `/api/products/:pid`
Actualiza un producto existente (todos los campos opcionales).

#### DELETE `/api/products/:pid`
Elimina un producto.

### API REST - Carritos (`/api/carts`)

#### POST `/api/carts`
Crea un nuevo carrito vacío.

**Respuesta:**
```json
{
  "status": "success",
  "message": "Carrito creado exitosamente",
  "payload": {
    "_id": "...",
    "products": []
  }
}
```

#### GET `/api/carts/:cid`
Obtiene los productos de un carrito **con populate**.

**Respuesta:**
```json
{
  "status": "success",
  "payload": {
    "_id": "...",
    "products": [
      {
        "productId": {
          "_id": "...",
          "title": "Producto de ejemplo",
          "price": 100.50,
          ...
        },
        "quantity": 2
      }
    ]
  }
}
```

#### POST `/api/carts/:cid/product/:pid`
Agrega un producto al carrito o incrementa su cantidad.

**Body:**
```json
{
  "quantity": 2
}
```

**Funcionalidades:**
- ✅ Valida que el carrito existe
- ✅ Valida que el producto existe
- ✅ Verifica stock disponible
- ✅ Si el producto ya está en el carrito, incrementa la cantidad
- ✅ Descuenta el stock del producto

#### DELETE `/api/carts/:cid/products/:pid`
Elimina un producto del carrito.

#### PUT `/api/carts/:cid`
Actualiza todos los productos del carrito.

**Body:**
```json
{
  "products": [
    {
      "productId": "product_id_1",
      "quantity": 3
    },
    {
      "productId": "product_id_2",
      "quantity": 1
    }
  ]
}
```

#### PUT `/api/carts/:cid/products/:pid`
Actualiza SOLO la cantidad de un producto en el carrito.

**Body:**
```json
{
  "quantity": 5
}
```

#### DELETE `/api/carts/:cid`
Elimina todos los productos del carrito.

## Manejo de Errores

La API utiliza códigos de estado HTTP apropiados y mensajes de error consistentes:

### Códigos de Estado
- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Error en los parámetros de la petición
- `404`: Recurso no encontrado
- `409`: Conflicto (código duplicado, stock insuficiente)
- `422`: Error de validación de datos
- `500`: Error interno del servidor

### Formato de Errores
```json
{
  "status": "error",
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo",
      "message": "Mensaje específico del error",
      "value": "valor proporcionado"
    }
  ]
}
```

## Estructura del Proyecto

```
src/
├── config/
│   └── database.js           # Configuración de MongoDB
├── models/
│   ├── Product.js            # Modelo de Producto con Mongoose
│   └── Cart.js               # Modelo de Carrito con Mongoose
├── managers/
│   ├── ProductManager.js     # Lógica de negocio para productos
│   └── CartManager.js        # Lógica de negocio para carritos
├── routes/
│   ├── products.router.js    # Rutas de productos
│   ├── carts.router.js       # Rutas de carritos
│   └── views.router.js       # Rutas de vistas web
├── schemas/
│   ├── productSchemas.js     # Esquemas de validación Joi para productos
│   └── cartSchemas.js        # Esquemas de validación Joi para carritos
├── middlewares/
│   └── validation.js         # Middlewares de validación y manejo de errores
├── views/                    # Plantillas Handlebars
│   ├── home.handlebars
│   ├── products.handlebars
│   ├── productDetail.handlebars
│   ├── cart.handlebars
│   ├── realTimeProducts.handlebars
│   └── error.handlebars
└── app.js                    # Configuración principal con Socket.IO
```

## WebSockets

El proyecto incluye integración completa con Socket.IO:

### Eventos del Servidor
- `productAdded`: Se emite cuando se agrega un nuevo producto
- `productDeleted`: Se emite cuando se elimina un producto
- `productsUpdated`: Se emite cuando se actualiza la lista de productos

### Eventos del Cliente
- `addProduct`: Envía datos de un nuevo producto al servidor
- `deleteProduct`: Solicita la eliminación de un producto

## Persistencia de Datos

Los datos se almacenan en **MongoDB**:
- Base de datos: `ecommerce` (configurable)
- Colecciones: `products`, `carts`
- Modelos con Mongoose
- Referencias entre documentos para productos en carritos
- Plugin `mongoose-paginate-v2` para paginación

## Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **mongoose-paginate-v2**: Plugin de paginación
- **Handlebars**: Motor de plantillas
- **Socket.IO**: WebSockets
- **Joi**: Validación de esquemas
- **Bootstrap**: Framework CSS

## Características Principales

### ✅ Paginación de Productos
- Sistema completo de paginación con links previos/siguientes
- Filtros flexibles por categoría y disponibilidad
- Ordenamiento ascendente/descendente por precio

### ✅ Gestión Avanzada de Carritos
- Referencias a productos con populate
- Actualización individual de cantidades
- Actualización masiva de productos
- Eliminación de productos específicos
- Vaciar carrito completo
- Gestión automática de stock

### ✅ Validación y Errores
- Validación completa con Joi
- Mensajes de error descriptivos
- Códigos HTTP apropiados
- Manejo centralizado de errores

### ✅ Experiencia de Usuario
- Interfaz responsive con Bootstrap
- Navegación intuitiva
- Cálculo automático de totales
- Confirmaciones para acciones destructivas

## Licencia

ISC
