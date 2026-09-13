# Leaf & Letter — Bookstore API (Backend)

A REST API backend for the Leaf & Letter online bookstore. Built with Express 5, Sequelize ORM, and a SQLite database.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
  - [Health](#health)
  - [Auth](#auth)
  - [Books / Catalogue](#books--catalogue)
  - [Orders / Payment](#orders--payment)
- [Authentication](#authentication)
- [Database](#database)
- [Testing](#testing)

---

## Features

- **User registration & login** — bcrypt password hashing, JWT issued on success
- **Protected routes** — Bearer token middleware guards order and profile endpoints
- **Book catalogue** — list, search (title/author), filter by category, paginate, and fetch individual books
- **Featured books** — dedicated endpoint for homepage highlights
- **Order management** — place orders with server-side totals (subtotal, 8% tax, shipping); retrieve full order history
- **Input validation** — `express-validator` on all write endpoints
- **Swagger / OpenAPI docs** — interactive docs served at `/api/docs`
- **CORS** — configurable allowed origin for the frontend dev server

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Web framework | Express 5 |
| ORM | Sequelize 6 |
| Database | SQLite 3 (via `sqlite3`) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | bcryptjs |
| Validation | express-validator |
| API docs | swagger-jsdoc + swagger-ui-express |
| Environment | dotenv |
| Dev server | nodemon |

---

## Project Structure

```
bookstore-backend/
├── data/
│   └── bookstore.db          # SQLite database file (created on first run)
├── src/
│   ├── db/
│   │   ├── index.js          # Sequelize instance (SQLite connection)
│   │   ├── models/
│   │   │   ├── Book.js       # Book model
│   │   │   ├── Order.js      # Order model (with totals + shipping fields)
│   │   │   ├── OrderItem.js  # OrderItem model (line items per order)
│   │   │   ├── User.js       # User model (name, username, email, password)
│   │   │   └── index.js      # Model associations + initDb()
│   ├── docs/
│   │   └── swagger.js        # OpenAPI 3.0 spec
│   ├── middleware/
│   │   ├── auth.js           # JWT authenticate middleware + signToken helper
│   │   └── validate.js       # express-validator error formatter
│   ├── routes/
│   │   ├── auth.js           # /api/auth — register, login, me
│   │   ├── books.js          # /api/books, /api/catalogue — book queries
│   │   ├── orders.js         # /api/orders, /api/payment — order CRUD
│   │   └── pages.js          # /api — page-level data endpoints
│   └── server.js             # Express app setup + HTTP server boot
├── test/
│   └── pages.test.js         # Integration test (supertest)
├── .env.example              # Environment variable template
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**

### Installation

```bash
# From the bookstore-backend directory
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` as needed (defaults work for local development — see [Environment Variables](#environment-variables)).

### Running the development server

```bash
npm run dev
```

The API starts at `http://localhost:4000`. The database file is created automatically at `./data/bookstore.db` on first run.

### Running in production

```bash
npm start
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP port the server listens on |
| `JWT_SECRET` | *(see .env.example)* | Secret used to sign/verify JWTs — **change in production** |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration (e.g. `1h`, `7d`) |
| `DB_PATH` | `./data/bookstore.db` | Path to the SQLite database file |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for CORS (frontend dev server) |

Copy `.env.example` to `.env` and update values before running:

```bash
cp .env.example .env
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restarts on file changes) |
| `npm start` | Start the server with `node` (production) |
| `npm run seed` | Seed the database with sample book data |

---

## API Reference

All endpoints are prefixed with `/api`. Interactive documentation is available at:

```
http://localhost:4000/api/docs
```

The raw OpenAPI JSON spec is served at:

```
http://localhost:4000/api/openapi.json
```

---

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Returns `{ status: "ok", timestamp }` |

---

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create a new account, returns JWT + user |
| POST | `/api/auth/login` | None | Verify credentials, returns JWT + user with orders |
| GET | `/api/auth/me` | Bearer | Return the current user + full order history |

#### POST `/api/auth/register`

```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

Validation rules:
- `name` — required, non-empty
- `username` — minimum 3 characters, unique
- `email` — valid email format, unique
- `password` — minimum 6 characters

Response `201`:
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Jane Doe", "username": "janedoe", "email": "...", "orders": [] }
}
```

#### POST `/api/auth/login`

```json
{
  "username": "janedoe",
  "password": "secret123"
}
```

Response `200`:
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Jane Doe", "username": "janedoe", "email": "...", "orders": [...] }
}
```

---

### Books / Catalogue

Both `/api/books` and `/api/catalogue` resolve to the same router.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/books` | None | List books with optional search, filter, and pagination |
| GET | `/api/books/categories` | None | Return the distinct list of categories |
| GET | `/api/books/featured` | None | Return books marked as featured |
| GET | `/api/books/:id` | None | Return a single book by ID |

#### GET `/api/books` — Query parameters

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search term matched against title and author (case-insensitive) |
| `category` | string | Filter by exact category name |
| `inStock` | `"true"` | Return only in-stock books |
| `page` | integer | Page number, 1-based (default: `1`) |
| `limit` | integer | Page size, max 100 (default: `20`) |

Response `200`:
```json
{
  "books": [ { "id": "1", "title": "...", "author": "...", "price": 12.99, ... } ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### Orders / Payment

Both `/api/orders` and `/api/payment` resolve to the same router. **All routes require a valid Bearer token.**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Bearer | Place a new order (totals calculated server-side) |
| GET | `/api/orders` | Bearer | List all orders for the authenticated user |
| GET | `/api/orders/:orderRef` | Bearer | Retrieve a single order by reference (e.g. `LL1234567890`) |

#### POST `/api/orders` — Request body

```json
{
  "items": [
    { "bookId": "3", "title": "Dune", "author": "Frank Herbert", "price": 12.99, "quantity": 2 }
  ],
  "shippingMethod": "standard",
  "shippingAddress": { "name": "Jane Doe", "line1": "1 Book Lane", "line2": "London" },
  "paymentMethod": "Visa **** 4242",
  "estimatedDelivery": "3–5 business days"
}
```

Shipping costs:
- `standard` — £5.99
- `express` — £14.99

Tax is calculated at **8%** of the subtotal server-side.

Response `201`:
```json
{
  "order": {
    "id": "LL1234567890",
    "status": "confirmed",
    "subtotal": 25.98,
    "shippingCost": 5.99,
    "tax": 2.08,
    "total": 34.05,
    "items": [ ... ]
  }
}
```

---

## Authentication

Protected endpoints require an `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN`. The [`authenticate`](src/middleware/auth.js) middleware verifies the token and attaches the decoded user to `req.user`.

---

## Database

The app uses **SQLite** via Sequelize. The database file is created automatically at the path specified by `DB_PATH` (default: `./data/bookstore.db`).

### Models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | id, name, username, email, password (hashed) |
| `Book` | `books` | id, title, author, price, category, cover, rating, isbn, tags (JSON), featured, inStock |
| `Order` | `orders` | id, orderRef, userId, status, subtotal, shippingCost, tax, total, shippingMethod, shippingAddress, paymentMethod |
| `OrderItem` | `order_items` | id, orderId, bookId, title, author, price, quantity |

### Associations

- `User` has many `Order`
- `Order` has many `OrderItem` (aliased as `items`)
- `Book` has many `OrderItem`

### Seeding

If a `seed` script is available, run it to populate the database with sample books:

```bash
npm run seed
```

---

## Testing

Integration tests use **supertest** against the live Express app.

```bash
# No dedicated test runner script is configured — run directly with Node or add one:
node --test test/pages.test.js
```

Test files:

| File | Description |
|---|---|
| `test/pages.test.js` | Verifies the OpenAPI spec includes the expected page-level endpoint paths |
