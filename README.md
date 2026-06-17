<h1 align="center">E-commerce API · Real-Time Catalog</h1>

<p align="center">
  <strong>REST API for products and carts with live updates over WebSockets, server-side views, paginated queries and Joi-validated mutations.</strong>
</p>

<p align="center">
  <a href="https://nodejs-ecommerce-api-oqbu.onrender.com">Live API ↗</a> ·
  <a href="https://nodejs-ecommerce-api-oqbu.onrender.com/realtimeproducts">Realtime Demo ↗</a> ·
  <a href="https://nodejs-ecommerce-api-oqbu.onrender.com/health">Health ↗</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white" alt="Node 20" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Joi-validation-0769AD" alt="Joi" />
  <img src="https://img.shields.io/badge/Handlebars-views-F0772B?logo=handlebarsdotjs&logoColor=white" alt="Handlebars" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT" />
</p>

---

> 🐘 **Also available as a relational implementation.** The same domain (products + carts)
> modeled in **PostgreSQL** — schema with foreign keys and constraints, repositories using
> raw parametrized SQL, JOINs, and transactions with row locking. See [`postgres/`](./postgres/).

---

## Overview

A catalog backend built around two ideas: **the API and the views share the same source of truth**, and **mutations propagate in real time**. Adding a product through `POST /api/products` updates the live page instantly through Socket.IO — no refresh, no polling.

It is the kind of project you build to understand how Express, Mongoose, validation middleware, server-rendered views and a WebSocket channel actually fit together — not a separate Frankenstein per concern.

---

## Tech Stack

- **Runtime** — Node.js 20 (ES Modules), Express 4
- **Database** — MongoDB (Mongoose ODM) with `mongoose-paginate-v2`
- **Realtime** — Socket.IO 4 (server emits, view consumes)
- **Views** — Handlebars via `express-handlebars`
- **Validation** — Joi schemas through `express-joi-validation`
- **Tooling** — Nodemon (dev), dotenv

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       HTTP layer                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐  │
│  │  REST    │   │  Views   │   │   Socket.IO server   │  │
│  │ /api/*   │   │  /, /rt  │   │  (broadcast events)  │  │
│  └────┬─────┘   └────┬─────┘   └──────────┬───────────┘  │
└───────┼──────────────┼────────────────────┼──────────────┘
        ▼              ▼                    │
   ┌──────────┐   ┌──────────┐              │
   │ Joi      │   │ HBS      │              │
   │ schemas  │   │ templates│              │
   └────┬─────┘   └──────────┘              │
        ▼                                   │
   ┌──────────────────────┐                 │
   │  ProductManager /    │ ◀───────────────┘
   │  CartManager         │   (emits on mutation)
   └─────────┬────────────┘
             ▼
        MongoDB Atlas
```

A mutation through `POST /api/products` calls the manager, the manager emits a Socket.IO event, and any browser open at `/realtimeproducts` sees the update without polling.

---

## Quick Start

```bash
git clone https://github.com/Tojohtml98/Nodejs-Ecommerce-API.git
cd Nodejs-Ecommerce-API
npm install
cp .env.example .env   # set MONGODB_URI
npm start              # production
npm run dev            # nodemon
```

Server boots on `http://localhost:8080`.

- REST root: `http://localhost:8080/api/products`
- Live view: `http://localhost:8080/realtimeproducts`

---

## API Reference

### Products

| Method | Endpoint              | Notes                                          |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/api/products`       | Paginated. Query: `limit`, `page`, `sort`, `query` |
| GET    | `/api/products/:pid`  | Get one                                        |
| POST   | `/api/products`       | Joi-validated body                             |
| PUT    | `/api/products/:pid`  | Partial update                                 |
| DELETE | `/api/products/:pid`  | Remove                                         |

### Carts

| Method | Endpoint                            | Notes                                          |
| ------ | ----------------------------------- | ---------------------------------------------- |
| POST   | `/api/carts`                        | Create empty cart                              |
| GET    | `/api/carts/:cid`                   | Returns cart with populated products           |
| POST   | `/api/carts/:cid/products/:pid`     | Add product to cart                            |
| PUT    | `/api/carts/:cid/products/:pid`     | Update quantity                                |
| DELETE | `/api/carts/:cid/products/:pid`     | Remove product                                 |
| DELETE | `/api/carts/:cid`                   | Empty cart                                     |

### System

| Method | Endpoint     | Notes                                       |
| ------ | ------------ | ------------------------------------------- |
| GET    | `/`          | API index                                   |
| GET    | `/health`    | Uptime + status JSON                        |
| GET    | `/home`      | Server-rendered product list (Handlebars)   |
| GET    | `/realtimeproducts` | Same list, live via Socket.IO        |

### Try it (cURL)

```bash
# List products, page 1, 5 per page, sorted by price asc
curl 'https://nodejs-ecommerce-api-oqbu.onrender.com/api/products?limit=5&page=1&sort=asc'

# Create a product (triggers a Socket.IO broadcast)
curl -X POST https://nodejs-ecommerce-api-oqbu.onrender.com/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mate Imperial",
    "description": "Calabaza curada, virola de alpaca",
    "price": 8500,
    "stock": 12,
    "category": "mates",
    "code": "MATE-001"
  }'
```

---

## Environment

| Variable        | Required | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| `MONGODB_URI`   | Yes      | MongoDB Atlas connection string              |
| `PORT`          | No       | HTTP port (default `8080`)                   |
| `NODE_ENV`      | No       | `development` \| `production`                |

---

## Deployment

- **Host:** Render (free tier) · `render.yaml` blueprint at repo root
- **CD:** Auto-deploy on push to `main`
- **DB:** MongoDB Atlas (M0 cluster, separate database per project)
- **Cold start:** ~25s on first hit after idle (free tier limitation)

---

## Design Decisions

- **Why share the data layer between REST and views?** A single source of truth means the view never disagrees with the API. Two adapters for one set of business rules is cheaper than two systems pretending the same data twice.
- **Why Socket.IO over Server-Sent Events?** SSE is simpler, but Socket.IO's auto-reconnect and room semantics paid for themselves the first time the WebSocket dropped on Render's free plan.
- **Why Joi at the route and not inside the manager?** Validation is an HTTP concern: bad input should never reach the business layer. The manager assumes its inputs are already trustworthy.
- **Why `mongoose-paginate-v2` over manual `skip/limit`?** Manual pagination loses metadata (`hasNextPage`, `prevLink`) and tends to be reimplemented at every endpoint. A plugin centralizes both.

---

## License

MIT © [Tomás Orella](https://github.com/Tojohtml98)
