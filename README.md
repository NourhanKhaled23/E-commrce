# Open Fashion — E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white" />

  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

A full-featured, role-based Angular e-commerce web application for fashion retail. Built with Angular 21 standalone components, Signals-based state management, and a built-in mock API — **no backend required**.

---

## Quick Start

```bash
git clone https://github.com/NourhanKhaled23/E-commrce.git
cd E-commrce
npm install
npm start
# → http://localhost:5000
```

Log in with any [test account](#test-accounts) to explore role-specific dashboards.

---

## Tech Stack

| Category    | Technology                                                          |
|-------------|---------------------------------------------------------------------|
| Framework   | Angular 21 (standalone, no NgModules)                               |
| Language    | TypeScript ~5.9                                                     |
| Styling     | CSS with dark/light theme + Bootstrap 5.3 + Bootstrap Icons         |
| i18n        | @ngx-translate/core (Arabic & English, RTL support)                 |
| Auth        | Email/password + Google OAuth 2.0 (@abacritt/angularx-social-login) |
| Email       | EmailJS (OTP verification, password reset)                          |
| Payments    | Stripe.js v3 (test mode)                                            |
| Mock API    | HTTP interceptor — no backend required                              |
| Testing     | Vitest with jsdom                                                   |
| Build       | Angular CLI 21, application builder                                 |
| Deployment  | Vercel-ready (`vercel.json` included)                               |
| Formatting  | Prettier                                                            |

---

## Features

### Customer
- Product browsing — paginated grid, search, category/price/rating filters, sort, in-stock toggle
- Category tree with parent/child hierarchy and image thumbnails
- Product details — image gallery, reviews, stock, related & recently viewed
- Shopping cart — guest & authenticated, quantity, coupons, loyalty points
- 3-step checkout — shipping → payment → review (Stripe, PayPal, COD, wallet)
- Order management — status timeline, cancel, reorder
- Wishlist, product comparison (up to 4), quick view modal
- Recently viewed (localStorage, max 10)
- Newsletter subscription
- SEO — per-route meta tags, Open Graph, Twitter cards
- Dark/light mode with system preference detection
- Arabic/English i18n with RTL layout
- Loyalty program (Bronze/Silver/Gold tiers), referral codes
- Skeleton loaders, empty states, toast notifications, error boundary

### Seller (`/seller`)
- Dashboard — sales metrics, pending orders, low stock alerts, monthly rating
- Product inventory — CRUD for own products, stock management
- Order processing — filter/update by status
- Earnings — payout history, monthly chart, platform fees, net payout
- Seller onboarding — shop name, description, logo, bank details

### Admin (`/admin`)
- Dashboard — revenue, orders, products, users, low stock, monthly revenue chart
- User management — view/filter by role & status
- Product CRUD — full management
- Category management — tree CRUD
- Order management — view all orders, update status
- Banner management — homepage hero CRUD
- Newsletter — view subscribers, send broadcasts
- Promo code management — percentage/fixed discounts
- Homepage sections — toggle visibility of featured, best sellers, newsletter, trust signals, category grid

---

## Setup

### Prerequisites
- Node.js (current LTS)
- npm 11+

### Install & Run

```bash
npm install
ng serve
# or: npm start
# → http://localhost:5000
```

### Build for Production

```bash
npm run build -- --configuration=production
# Output: dist/e-commerce/browser
```

### Run Tests

```bash
ng test
```

### Optional: Configure External Services

**EmailJS** (OTP / password reset)
1. Sign up at https://www.emailjs.com
2. Create a Service (e.g., Gmail), create OTP and password-reset email templates (see `src/assets/email-templates/`)
3. Copy Public Key, Service ID, Template IDs into `src/environments/environment.ts`

**Google OAuth**
1. Create OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
2. Add `http://localhost:5000` to Authorised JavaScript origins
3. Copy Client ID into `src/environments/environment.ts`

**Stripe**
1. Get publishable key from https://dashboard.stripe.com/test/apikeys
2. Place in `src/environments/environment.ts`

### Connecting a Real Backend

Set `useMockApi: false` in the environment file. The app will send all requests to the `apiUrl` configured there (default: same origin). Zero changes to services or components are needed.

---

## Mock Data

All fixture data lives in `src/assets/mock-data/`:

| File               | Contents                                       |
|--------------------|------------------------------------------------|
| `users.json`       | 5 users (1 admin, 2 sellers, 2 customers)      |
| `products.json`    | 30 products across 25+ categories              |
| `categories.json`  | 28 categories with parent/child hierarchy      |
| `orders.json`      | Order records with timeline & payment info     |
| `reviews.json`     | 20 product reviews                             |
| `banners.json`     | 4 hero slider banners                          |
| `promos.json`      | 7 promo codes                                  |
| `promo-codes.json` | Same promo codes (alternate format)            |
| `payouts.json`     | 5 seller payout records                        |
| `homeSettings.json`| Homepage section visibility toggles            |

---

## Test Accounts

| Role     | Name          | Email                    | Password    | Notes                       |
|----------|---------------|--------------------------|-------------|-----------------------------|
| Admin    | Admin User    | admin@openfashion.com    | admin123    | Full `/admin/*` access      |
| Seller   | Sarah Seller  | seller@openfashion.com   | seller123   | Full `/seller/*` access     |
| Seller   | Bob Chen      | bob@example.com          | bob123      | Second seller account       |
| Customer | Customer One  | customer@openfashion.com | customer123 | Standard shopping access    |
| Customer | Jane Miller   | jane@example.com         | jane123     | **Restricted** — tests error flow |

> Jane's account is flagged as `restricted` in `users.json`. She can log in but cannot place orders — useful for testing the account-restricted error response in the mock interceptor.

---

## Architecture

### Project Layout

```
src/
├── app/
│   ├── app.routes.ts                  # Root route definitions (all lazy-loaded)
│   ├── app.component.ts               # Root layout shell
│   ├── core/                          # Singleton services, models, guards, interceptors
│   │   ├── models/                    # TypeScript interfaces
│   │   ├── services/                  # Business logic (28 services)
│   │   ├── guards/                    # authGuard, roleGuard, verifiedGuard
│   │   └── interceptors/              # auth, CSRF, cache, mock API, error
│   ├── features/                      # Lazy-loaded route bundles
│   │   ├── admin/                     # Admin dashboard & management (10 components)
│   │   ├── checkout/                  # Multi-step checkout (5 components)
│   │   ├── home/                      # Homepage
│   │   ├── orders/                    # Customer orders
│   │   ├── seller/                    # Seller dashboard & management (6 components)
│   │   ├── auth/                      # Forgot password, email verification
│   │   ├── comparison/                # Product comparison
│   │   └── wishlist/                  # Wishlist
│   ├── auth/                          # Login, Register, Profile
│   ├── cart/                          # Cart view
│   ├── products/                      # Product list & details
│   └── shared/                        # Reusable components (31), directives, pipes
├── assets/
│   ├── i18n/                          # en.json, ar.json
│   ├── email-templates/               # OTP & password reset HTML
│   ├── mock-data/                     # 10 JSON fixture files
│   └── images/
├── environments/                      # environment.ts (dev), environment.production.ts
└── styles.css                         # Global styles
```

### Key Patterns

| Pattern | Description |
|---|---|
| **Standalone components** | No NgModules anywhere in the project |
| **Signals** | State via `signal()`, `computed()`, `effect()` — no NgRx/Redux |
| **Lazy loading** | Admin, seller, checkout, and orders are lazy route bundles |
| **Route guards** | `authGuard` (logged in), `roleGuard(['admin'\|'seller'])`, `verifiedGuard` (email verified) |
| **Interceptor stack** | auth token → CSRF → cache → mock API → error handling |
| **Auth flow** | Login returns user object → stored in `localStorage` as `auth_user` → `AuthService` signal updates |
| **Dark mode** | CSS class toggle via `classList.toggle('dark')` on `<html>` |
| **API convention** | All services call `/api/*` paths caught by the mock interceptor |
| **SEO** | `SeoService` listens to route changes and sets `<title>`, meta description, Open Graph, Twitter cards |
| **DI** | All services `providedIn: 'root'`; no component-level providers |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes following the existing commit style
4. Open a pull request describing what you changed and why

Bug reports and feature suggestions are welcome via [GitHub Issues](https://github.com/NourhanKhaled23/E-commrce/issues).

---

## License

MIT © [Nourhan Khaled](https://github.com/NourhanKhaled23)
