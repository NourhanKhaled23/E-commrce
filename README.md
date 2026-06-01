<p align="center">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/RxJS-7.8-B7178C?style=for-the-badge&logo=reactivex&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<h1 align="center">🛍️ OpenFashion E-Commerce Platform</h1>

<p align="center">
  A full-featured, multi-role e-commerce SPA built with Angular 21. Supports Admin, Seller, and Customer roles, fully mock-API driven — no backend required to run.
</p>

---

## 📌 Project Description

OpenFashion is a production-grade Angular single-page application simulating a real-world multi-vendor e-commerce marketplace. It covers the complete shopping lifecycle: product browsing, cart management, checkout with payment, order tracking, seller inventory management, and admin back-office — all powered by an in-memory mock API interceptor with no backend dependency.

The app is architected for scalability with lazy-loaded feature modules, role-based route guards, HTTP interceptors for auth/CSRF/caching/error handling, i18n (English & Arabic), dark/light theming, and a loyalty points system.

---

## 🛠️ Technologies Used

### Core Framework
| Technology | Version | Purpose |
|---|---|---|
| **Angular** | 21.2 | SPA framework — components, routing, DI, signals |
| **TypeScript** | 5.9 | Strongly typed language |
| **RxJS** | 7.8 | Reactive streams, async data handling |
| **Zone.js** | 0.15 | Angular change detection integration |

### UI & Styling
| Technology | Version | Purpose |
|---|---|---|
| **Bootstrap** | 5.3.8 | Responsive grid, utility classes, base components |
| **Bootstrap Icons** | 1.13.1 | Icon library used throughout the UI |
| Custom CSS/SCSS | — | Component-level scoped styles |

### State & Data Management
| Technology | Purpose |
|---|---|
| **Angular Signals** | Reactive local state (cart count, theme, auth user) |
| **RxJS BehaviorSubject** | Service-level shared state (wishlist, notifications) |
| **In-memory Mock JSON** | `assets/mock-data/*.json` serve as the database |
| **mock-api.interceptor.ts** | Intercepts HTTP calls, routes them to JSON files |
| **HTTP Cache Interceptor** | Client-side caching to reduce redundant mock reads |

### Authentication & Security
| Technology | Purpose |
|---|---|
| **@abacritt/angularx-social-login** | Google OAuth2 social login integration |
| **Custom JWT-style auth** | LocalStorage-persisted session via `AuthService` |
| **Auth Guard** | Protects routes requiring login |
| **Role Guard** | Enforces `admin` / `seller` role access |
| **Verified Guard** | Blocks checkout until email is verified |
| **CSRF Interceptor** | Appends CSRF token to mutating requests |
| **Auth Interceptor** | Attaches Bearer token to all outbound requests |
| **Error Interceptor** | Global HTTP error handling + toast notification |
| **Rate Limit Service** | Client-side request throttling |
| **Sanitize Service** | Input sanitization to prevent XSS |

### Payments
| Technology | Purpose |
|---|---|
| **Stripe.js (v3)** | Credit card payment UI (test mode, mock flow) |
| **stripe.service.ts** | Wraps Stripe tokenization and charge simulation |

### Internationalization
| Technology | Purpose |
|---|---|
| **@ngx-translate/core** | Runtime language switching |
| **@ngx-translate/http-loader** | Loads `assets/i18n/en.json` and `assets/i18n/ar.json` |
| Language Switcher Component | Toggle between English and Arabic (RTL support) |

### Developer Tools
| Technology | Version | Purpose |
|---|---|---|
| **Angular CLI** | 21.2.12 | Scaffolding, build, serve |
| **Prettier** | 3.8.1 | Code formatting |
| **Vitest** | 4.0.8 | Unit testing |
| **jsdom** | 28.0.0 | DOM environment for tests |
| **VS Code config** | — | `.vscode/` with tasks, launch, MCP settings |

### Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Hosting — `vercel.json` configured with SPA fallback routing |

---

## ✨ Features List

### 🛒 Customer Features
- **Product Browsing** — grid/list view, pagination, skeleton loaders
- **Advanced Filtering** — by category, price range, rating, stock status, seller
- **Search** — live search bar with debounced queries
- **Product Details** — image gallery, reviews, star ratings, social share, recently viewed
- **Wishlist** — add/remove items, persisted to mock user profile
- **Cart** — add/remove/update quantities, stock validation, promo code application
- **Product Comparison** — side-by-side comparison of up to 4 products
- **Checkout Flow** — multi-step: Shipping → Payment → Confirmation
- **Payment** — Stripe card integration (test mode) + wallet balance option
- **Promo Codes** — apply discount codes at checkout
- **Order Tracking** — order list, order detail, status timeline
- **Loyalty Points** — earn points on purchases, view dashboard
- **Profile Management** — edit info, saved cards, wallet balance
- **Email Verification** — verified guard enforced before checkout
- **Notifications** — in-app notification center
- **Newsletter Signup** — subscribe component in footer
- **Back-to-Top** — scroll utility component
- **Dark / Light Theme** — persisted theme toggle via ThemeService
- **Responsive Design** — mobile-first with Bootstrap 5 grid

### 🏪 Seller Features
- **Seller Dashboard** — revenue, order counts, product stats
- **Product Inventory** — create, edit, delete own products with stock management
- **Order Processing** — view and update status of orders for own products
- **Earnings** — payout history and balance summary
- **Seller Onboarding** — guided registration flow for new sellers

### 🔧 Admin Features
- **Admin Dashboard** — platform-wide analytics overview
- **User Management** — view all users, change status (active/restricted), role management
- **Product CRUD** — full create/edit/delete for any product on the platform
- **Order Management** — view and update status for all orders
- **Category Management** — add/edit/delete product categories
- **Banner Management** — control homepage promotional banners
- **Promo Code Management** — create and manage discount codes
- **Newsletter Admin** — view subscriber list

### 🏗️ Architecture Features
- **Lazy-loaded Routing** — all feature modules loaded on demand
- **HTTP Interceptor Stack** — auth, CSRF, cache, error, mock-API
- **Angular Signals** — used for reactive UI state without NgRx
- **SEO Service** — dynamic title/meta tag updates per route
- **Analytics Service** — event tracking hooks (ready for GA/Mixpanel)
- **Feature Flags** — `FeatureFlagService` for toggling features at runtime
- **Push Notification Service** — Web Push API wrapper (mock mode)
- **Error Boundary Component** — graceful error rendering

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 11.x (or use `npx`)
- **Angular CLI** (optional, installed locally in devDependencies)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NourhanKhaled23/E-commrce.git
cd E-commrce

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
# or
npx ng serve
```

The app will be available at **http://localhost:4200**

### Build for Production

```bash
npm run build
# Output goes to dist/
```

### Run Tests

```bash
npm test
```

### Environment Configuration

The app uses `src/environments/environment.ts`. By default, `useMockApi: true` means no real backend is needed.

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '',              // Leave empty to use mock interceptor
  googleClientId: 'MOCK_CLIENT_ID.apps.googleusercontent.com',
  stripePublishableKey: 'pk_test_...', // Stripe test key
  useMockApi: true,
};
```

To connect to a real backend, set `apiUrl` to your API base URL and `useMockApi: false`.

---

## 🗄️ Mock Data Structure

All mock data lives under `src/assets/mock-data/`. The mock API interceptor (`mock-api.interceptor.ts`) intercepts HTTP calls and serves responses from these JSON files.

| File | Description |
|---|---|
| `users.json` | User accounts with roles, wallets, wishlists, saved cards |
| `products.json` | Product catalog with pricing, stock, ratings, images |
| `categories.json` | Hierarchical category tree (parent/child IDs) |
| `orders.json` | Order records with line items, statuses, address |
| `reviews.json` | Product reviews with ratings and user references |
| `promo-codes.json` | Discount codes with type, value, expiry |
| `promos.json` | Homepage promotional content |
| `banners.json` | Hero/banner data for admin management |
| `payouts.json` | Seller earnings and payout history |

### Product Schema (abbreviated)
```json
{
  "id": 1,
  "title": "Product Name",
  "description": "...",
  "price": 9.99,
  "originalPrice": 11.75,
  "discountPercentage": 15,
  "rating": 4.82,
  "reviewCount": 12,
  "stock": 120,
  "brand": "BrandName",
  "category": "beauty",
  "categoryId": 1,
  "categorySlug": "beauty",
  "sellerId": 2,
  "thumbnail": "https://...",
  "images": ["https://...", "https://..."],
  "tags": ["tag1", "tag2"],
  "active": true,
  "createdAt": "2026-05-01T00:00:00Z"
}
```

### User Schema (abbreviated)
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin | seller | customer",
  "password": "plaintext (mock only)",
  "walletBalance": 5000,
  "loyaltyPoints": 2500,
  "wishlist": [1, 3, 5],
  "savedCards": [{ "id": "card_1", "last4": "4242", "brand": "Visa" }],
  "status": "active | restricted",
  "address": { "street": "...", "city": "...", "country": "US" }
}
```

---

## 👤 Available Test Accounts

All accounts use simple passwords (mock environment only — no real auth backend).

| Role | Email | Password | Notes |
|---|---|---|---|
| **Admin** | `admin@openfashion.com` | `admin123` | Full platform access, all admin routes |
| **Seller** | `seller@openfashion.com` | `seller123` | Sarah Seller — manages own products & orders |
| **Seller 2** | `bob@example.com` | `bob123` | Bob Chen — second seller account |
| **Customer** | `customer@openfashion.com` | `customer123` | Customer One — standard shopping access |
| **Customer 2** | `jane@example.com` | `jane123` | Jane Miller — restricted status account |

> ⚠️ Passwords are stored in plaintext in `users.json` for demo purposes only. Never do this in production.

---

## 🏛️ Architecture Notes

### Module Structure
```
src/app/
├── app.routes.ts              # Root lazy-loaded route config
├── app.component.ts           # Root shell with router-outlet
├── auth/                      # Legacy auth components (login, register, profile)
├── cart/                      # Cart feature
├── core/
│   ├── guards/                # auth.guard, role.guard, verified.guard
│   ├── interceptors/          # auth, csrf, error, cache, mock-api
│   ├── models/                # TypeScript interfaces (User, Product, Order, …)
│   └── services/              # All singleton services (30+)
├── features/
│   ├── admin/                 # Admin dashboard + management pages
│   ├── auth/                  # Email verify, forgot password, auth routes
│   ├── checkout/              # Multi-step checkout flow
│   ├── comparison/            # Product comparison page
│   ├── home/                  # Landing page
│   ├── orders/                # Order list + detail routes
│   ├── seller/                # Seller dashboard, inventory, earnings
│   └── wishlist/              # Wishlist page
├── products/                  # Product list + detail pages
└── shared/
    ├── components/            # Reusable UI components (navbar, footer, toast, …)
    ├── directives/            # scroll-reveal directive
    └── pipes/                 # currency-egp, stock-status, time-ago, truncate
```

### Key Design Decisions

**Mock API Interceptor** — All HTTP requests are intercepted by `mock-api.interceptor.ts` before reaching the network. It simulates CRUD operations, role-based access control, filtering, pagination, and search entirely in-memory. Switching to a real API only requires setting `useMockApi: false` and providing `apiUrl`.

**Angular Signals for State** — Cart count, current theme, and authenticated user are exposed as Signals from their respective services, enabling fine-grained reactivity without NgRx boilerplate.

**Lazy Loading** — Every feature area (admin, seller, checkout, orders, auth) is a lazy-loaded module. The initial bundle only loads the root shell, home, and shared components.

**Role-Based Access** — Three guards form a chain: `authGuard` (must be logged in) → `roleGuard(['admin'])` or `roleGuard(['seller'])` → `verifiedGuard` (email verified for checkout). Unauthorized access redirects to `/unauthorized`.

**i18n Architecture** — `@ngx-translate` is initialized at the app root with an HTTP loader. Language preference is toggled via `LanguageSwitcherComponent` and the switch is instant without a page reload.

**Checkout Flow** — `CheckoutService` maintains a shared checkout state across the multi-step flow (Shipping → Payment → Confirmation). `StripeService` wraps Stripe.js tokenization; in mock mode the payment always succeeds.

**Security Layers** — Even in mock mode, the interceptor enforces role checks (`requireRole()`) and strips passwords from all user responses (`sanitizeUser()`). The CSRF interceptor and auth interceptor are wired for a real backend connection with zero changes.

---


## 📄 License

This project is for educational and portfolio purposes.
