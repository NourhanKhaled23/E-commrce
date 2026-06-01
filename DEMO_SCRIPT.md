# Live Demo Script — OpenFashion E-Commerce

> **Before the demo:** Open the app in a browser. Clear localStorage (`localStorage.clear()` in the console). Have the DevTools Network tab ready. Keep this file open on a second screen.

---

## Scene 1 — First Impression (2 min)

**Say:**
> "This is OpenFashion — a fully functional Angular e-commerce platform. There is no backend server running. Every API call you see in the Network tab is intercepted and served from local JSON files, but the app doesn't know that — it uses real `HttpClient` calls throughout."

**Do:**
1. Open the home page (`/`).
2. Open DevTools → Network → filter by `Fetch/XHR`.
3. Scroll the homepage — point out the hero banner, featured products, and category grid loading.
4. Click a Network request (e.g. `/api/products/featured`).

**Say:**
> "Notice the request goes to `/api/products/featured`. There is no server at that address. The HTTP interceptor catches it, reads `assets/mock-data/products.json`, runs the filter logic, and returns an `HttpResponse` with a synthetic 200ms delay — so it looks and behaves exactly like a real API."

**Highlight in code:** `src/app/core/interceptors/mock-api.interceptor.ts`, the block starting with `if (url === '/api/products/featured' && method === 'GET')`.

---

## Scene 2 — Product Browsing & Filtering (3 min)

**Say:**
> "Let's browse products. The filter engine inside the interceptor supports search, category, price range, rating, stock status, sort order, and pagination — all without a database."

**Do:**
1. Navigate to `/products`.
2. Type "mascara" in the search bar — show results update.
3. Open DevTools → find the `/api/products?search=mascara` request.
4. Change the sort to "Price: Low to High".
5. Set a max price filter.

**Say:**
> "Each of these UI interactions fires a new GET to `/api/products` with different query params. The interceptor parses them with `parseProductFilters()`, runs `applyProductFilters()`, sorts and paginates the result, and returns the slice — exactly what a real API endpoint would do."

**Highlight in code:** `parseProductFilters()` and `applyProductFilters()` functions in `mock-api.interceptor.ts`.

---

## Scene 3 — Product Detail & Reviews (2 min)

**Do:**
1. Click any product card to open the detail page (`/products/:id`).
2. Scroll to the reviews section.

**Say:**
> "The product detail page makes two independent API calls: one to `/api/products/:id` for the product, and one to `/api/reviews?productId=:id` for the reviews. The interceptor handles both. Reviews are filtered, sorted by date, and the average rating is computed dynamically on each request."

**Highlight in code:** The `GET /api/products/:id` and `GET /api/reviews` blocks in `mock-api.interceptor.ts`.

---

## Scene 4 — Cart Persistence (3 min)

**Say:**
> "Let me show you one of the most requested features in production apps: the cart surviving a full page refresh."

**Do:**
1. (Still browsing as a guest.) Click "Add to Cart" on 2–3 products.
2. Open DevTools → Application → Local Storage → find the key `cart_user_guest`.
3. Show the JSON array of cart items stored there.
4. Hard-refresh the page (`Cmd+Shift+R` / `Ctrl+Shift+R`).
5. Click the cart icon — items are still there.

**Say:**
> "The `CartService` uses Angular Signals for reactive state and `localStorage` for persistence. After every mutation — add, remove, quantity update — it calls `persistCart()`, which serialises the signal value to `localStorage`. On construction, it calls `loadCart()` to rehydrate from storage. The key is `cart_user_guest` for anonymous users and `cart_user_<id>` for logged-in users, so each user has their own cart."

**Highlight in code:** `cartKey` getter, `persistCart()`, `loadCart()`, and `addToCart()` in `src/app/core/services/cart.service.ts`.

---

## Scene 5 — Login & Role-Based Access (4 min)

### 5a — Customer login

**Do:**
1. Navigate to `/auth/login`.
2. Log in with `customer@openfashion.com` / `customer123`.

**Say:**
> "The login form POSTs to `/api/auth/login`. The interceptor finds the matching user in `users.json`, strips the password field using `sanitizeUser()`, and returns the user object. `AuthService` stores it in a Signal and writes it to localStorage — so the session also survives a refresh."

**Do:**
3. After login, navigate to `/admin` in the address bar directly.

**Say:**
> "Blocked. The admin route has `canActivate: [authGuard, roleGuard(['admin'])]`. The `roleGuard` calls `auth.role()` — which is a `computed()` signal derived from the current user — sees `'customer'`, and redirects to `/unauthorized`."

**Highlight in code:** `app.routes.ts` admin route, `role.guard.ts`.

### 5b — Logout and log back in as Admin

**Do:**
4. Log out.
5. Log in with `admin@openfashion.com` / `admin123`.
6. Navigate to `/admin`.

**Say:**
> "Now the same guard sees `'admin'`, returns `true`, and the admin dashboard loads. The entire admin module was never downloaded during the customer session — it only lazy-loads now."

**Do:**
7. Open DevTools → Network → filter by JS. Point out the `admin-*.js` chunk loading for the first time.

---

## Scene 6 — Admin Dashboard (3 min)

**Say:**
> "The admin has full platform control. Let's walk through the main sections."

**Do:**
1. Click **User Management** — show the user list, point out the "restricted" badge on Jane Miller.
2. Click **Product Management** — show the product table, demonstrate editing a product (PUT request goes to the interceptor and returns the updated object).
3. Click **Order Management** — show orders, change one order's status.

**Say:**
> "Every write operation in the admin panel — PATCH, PUT, POST, DELETE — goes through the interceptor's `requireRole()` helper. If the current user's Signal-derived role isn't in the allowed list, the interceptor immediately returns a 403 response without touching the data. The UI never needs to add its own role checks for these API calls."

**Highlight in code:** `requireRole()` helper at the top of `mock-api.interceptor.ts`.

---

## Scene 7 — Seller Dashboard (3 min)

**Do:**
1. Log out, then log in as `seller@openfashion.com` / `seller123`.
2. Navigate to `/seller`.

**Say:**
> "The seller role gets a completely different layout. The route `/seller` has `canActivate: [authGuard, roleGuard(['seller'])]` — so an admin visiting `/seller` is also blocked and redirected to `/unauthorized`."

**Do:**
3. Go to **Product Inventory** — show Sarah's products (filtered by `sellerId` in the interceptor).
4. Go to **Order Processing** — show only orders that contain Sarah's products.
5. Try to change an order status to `delivered`.

**Say:**
> "Even if a seller manually sends a PUT request to change an order to `delivered`, the interceptor blocks it. Sellers can only set `processing` or `shipped` — that rule is enforced server-side in the mock, so the UI restriction and the API restriction are in sync."

**Highlight in code:** The order status PUT block in `mock-api.interceptor.ts`, the seller-specific status check.

---

## Scene 8 — Checkout Flow (3 min)

**Do:**
1. Log in as `customer@openfashion.com`.
2. Add 2 items to the cart.
3. Navigate to `/checkout`.

**Say:**
> "Checkout is protected by two guards: `authGuard` (must be logged in) and `verifiedGuard` (email must be verified). Since our test account is verified, we proceed."

**Do:**
4. Walk through the stepper: Shipping form → Payment → Review order.
5. On the payment step, show the mock Stripe payment intent being created (`POST /api/payment/create-intent`).
6. Complete the order.

**Say:**
> "The payment step calls `/api/payment/create-intent`, which returns a fake Stripe `clientSecret`. In production, this would call your real Stripe backend. The order confirmation POST to `/api/orders` validates that items are present, a shipping address exists, and a payment method is set — then returns a full order object with a timeline and estimated delivery date."

---

## Scene 9 — Lazy Loading Proof (2 min)

**Say:**
> "I want to make one architectural point very visible. Let me show lazy loading in action."

**Do:**
1. Open a fresh incognito window.
2. Open DevTools → Network → JS filter.
3. Navigate to the home page. Show only the initial chunks loading (~5–6 files).
4. Navigate to `/products`. Show the products chunk loading.
5. Log in as admin, navigate to `/admin`. Show the admin chunk loading.
6. Navigate to `/seller` (you'll be blocked, but still show nothing loaded).

**Say:**
> "Every route in `app.routes.ts` uses `loadComponent` or `loadChildren` — there are zero eagerly-loaded feature modules. The browser only downloads the code for a page when the user actually navigates to it. The admin bundle — the largest feature — is never sent to a customer or a seller."

**Highlight in code:** `app.routes.ts` — point out `loadComponent: () => import(...)` on every single route.

---

## Scene 10 — Wrap-Up (1 min)

**Say:**
> "To summarise: this app demonstrates a production-grade Angular architecture — Signals for reactive state without NgRx, a mock API interceptor that makes the frontend completely self-contained, lazy-loaded routes for every feature, role-based guards powered by computed signals, and localStorage-backed cart persistence scoped per user. The same codebase is ready to swap the mock interceptor for a real API by simply removing one line from `app.config.ts` — nothing else changes."

---

## Quick Reference — Test Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | `admin@openfashion.com` | `admin123` | Full platform |
| Seller | `seller@openfashion.com` | `seller123` | Own products & orders |
| Customer | `customer@openfashion.com` | `customer123` | Shopping, cart, orders |
| Restricted | `jane@example.com` | `jane123` | Login only — cannot place orders |

---

## Demo Timing Guide

| Scene | Topic | Time |
|---|---|---|
| 1 | First impression + interceptor proof | 2 min |
| 2 | Product browsing & filtering | 3 min |
| 3 | Product detail & reviews | 2 min |
| 4 | Cart persistence | 3 min |
| 5 | Login + role-based access | 4 min |
| 6 | Admin dashboard | 3 min |
| 7 | Seller dashboard | 3 min |
| 8 | Checkout flow | 3 min |
| 9 | Lazy loading proof | 2 min |
| 10 | Wrap-up | 1 min |
| **Total** | | **~26 min** |
