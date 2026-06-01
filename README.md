# E-Commerce Platform

A full-stack e-commerce REST API built with **Node.js**, **Express 5**, **PostgreSQL**, and **Drizzle ORM**, scaffolded inside a **pnpm monorepo**. The project follows an OpenAPI-first contract, with auto-generated React Query hooks and Zod validation schemas.

---

## Features

- **API Server** — Express 5 REST API served under `/api`
- **OpenAPI-first contract** — single source of truth in `lib/api-spec/openapi.yaml`
- **Auto-generated client** — React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) generated via Orval
- **PostgreSQL + Drizzle ORM** — type-safe database access with migration support
- **Pino structured logging** — request/response logging with `req.log` in handlers
- **CORS enabled** — ready for cross-origin frontend clients
- **Component Preview Server** — isolated Vite sandbox for prototyping UI components
- **Health check endpoint** — `GET /api/healthz`

> **Note:** Product, user, cart, and order features are planned. The current codebase is the foundational scaffold. See *Architecture Notes* for the intended data model.

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/         # Express 5 API server
│   └── mockup-sandbox/     # Vite component preview sandbox
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + config
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## Setup Instructions

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- A running **PostgreSQL** instance

### 1. Clone the repository

```bash
git clone https://github.com/NourhanKhaled23/E-commrce.git
cd E-commrce
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file at the project root (or export vars in your shell):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
PORT=5000
SESSION_SECRET=your-secret-here
NODE_ENV=development
```

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Run the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The server will be available at `http://localhost:5000/api`.

### 6. (Optional) Run the component sandbox

```bash
pnpm --filter @workspace/mockup-sandbox run dev
```

### Useful commands

| Command | Description |
|---|---|
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate hooks and Zod schemas from the OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |

---

## Mock Data Structure

The following data structures are planned for the e-commerce domain. Implement them in `lib/db/src/schema/` as Drizzle tables.

### Users

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "passwordHash": "string",
  "role": "admin | seller | customer",
  "name": "string",
  "createdAt": "timestamp"
}
```

### Products

```json
{
  "id": "uuid",
  "sellerId": "uuid",
  "name": "Wireless Headphones",
  "description": "string",
  "price": 49.99,
  "stock": 120,
  "category": "Electronics",
  "imageUrl": "string",
  "createdAt": "timestamp"
}
```

### Orders

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "status": "pending | paid | shipped | delivered | cancelled",
  "totalAmount": 149.97,
  "createdAt": "timestamp",
  "items": [
    {
      "productId": "uuid",
      "quantity": 3,
      "unitPrice": 49.99
    }
  ]
}
```

### Cart

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ]
}
```

---

## Available Test Accounts

> These are the planned seed accounts. Once authentication and the `users` table are implemented, run the seed script to create them.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ecommerce.dev` | `Admin@123!` |
| Seller | `seller@ecommerce.dev` | `Seller@123!` |
| Customer | `customer@ecommerce.dev` | `Customer@123!` |

**Admin** — full access to users, products, and orders.  
**Seller** — can create, update, and delete their own products; view their orders.  
**Customer** — can browse products, manage their cart, and place/view orders.

---

## API Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Server health check |

### Planned Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive a session token |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get a single product |
| `POST` | `/api/products` | Create a product (seller/admin) |
| `PUT` | `/api/products/:id` | Update a product |
| `DELETE` | `/api/products/:id` | Delete a product |
| `GET` | `/api/cart` | Get current user's cart |
| `POST` | `/api/cart/items` | Add item to cart |
| `DELETE` | `/api/cart/items/:id` | Remove item from cart |
| `POST` | `/api/orders` | Place an order |
| `GET` | `/api/orders` | List orders for current user |
| `GET` | `/api/orders/:id` | Get a single order |
| `GET` | `/api/admin/users` | List all users (admin only) |

---

## Architecture Notes

### Monorepo layout

The project is a **pnpm workspace** with four distinct package types:

- `artifacts/` — deployable services (API server, UI sandbox)
- `lib/` — shared, composite TypeScript packages with declaration emit
- `scripts/` — one-off utility scripts checked as a leaf package
- Root — dev tooling only (`typescript`, `prettier`); no runtime code

### OpenAPI-first contract

`lib/api-spec/openapi.yaml` is the **single source of truth** for all API shapes. Never define types by hand in client or server code — always derive them from the spec:

- Run `pnpm --filter @workspace/api-spec run codegen` after any spec change
- The server uses Zod schemas from `@workspace/api-zod` to validate inputs and outputs
- Frontend code uses hooks from `@workspace/api-client-react`

### Database

- Drizzle ORM with PostgreSQL via `pg` driver
- Schema lives in `lib/db/src/schema/` — one file per domain entity
- `drizzle-zod` derives insert/select Zod schemas from Drizzle tables automatically
- `pnpm --filter @workspace/db run push` syncs schema to dev database (use migrations in production)

### Logging

Server code must **never** use `console.log`. Use:

- `req.log` inside route handlers (injected by `pino-http`)
- `logger` singleton (`artifacts/api-server/src/lib/logger.ts`) everywhere else

### Known issues / TODOs

- `cookie-parser` is listed as a dependency but is not imported in `app.ts` — remove or wire it up
- `lib/db/src/schema/index.ts` is empty — define the domain tables to enable real functionality
- No authentication middleware exists yet — sessions or JWT need to be implemented
- The mockup sandbox has no components in `src/components/mockups` — add `.tsx` files there to use the preview server

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| API framework | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.1 |
| Client codegen | Orval (React Query + Zod) |
| Build | esbuild |
| Package manager | pnpm workspaces |
| Logging | Pino + pino-http |

---

## License

MIT
