# Codebase Talking Points — OpenFashion

> Three-sentence explanations for each architectural pattern, written for a live demo audience.

---

## 1. How Signals Replace NgRx

In `auth.service.ts`, the entire auth state is a single private `signal<User | null>(null)` — no store, no actions, no reducers, no selectors. Derived facts like `isLoggedIn` and `role` are `computed()` values that Angular re-evaluates automatically whenever `_user` changes, making them the exact equivalent of NgRx selectors without any boilerplate. The `CartService` follows the same pattern: `_items`, `cartCount`, `cartTotal`, `discount`, and `finalTotal` are all signals or computeds, so the navbar badge, the cart page, and the checkout summary all stay in sync through Angular's fine-grained reactivity rather than through a centralised store subscription.

**Code to show:**
```typescript
// auth.service.ts
private _user = signal<User | null>(null);
readonly isLoggedIn = computed(() => !!this._user());
readonly role       = computed(() => this._user()?.role ?? 'guest');

// cart.service.ts
private _items   = signal<CartItem[]>([]);
readonly cartCount = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
readonly cartTotal = computed(() => this._items().reduce((s, i) => s + i.product.price * i.quantity, 0));
readonly finalTotal = computed(() => Math.max(0, this.cartTotal() - this.discount() - this._loyaltyDiscount()));
```

---

## 2. How the HTTP Interceptor Creates a Realistic Mock API

`mock-api.interceptor.ts` is a functional interceptor registered in `app.config.ts` — the moment any `HttpClient` call has a URL starting with `/api/`, it never leaves the browser; instead the interceptor matches the URL and method, loads the relevant JSON file from `assets/mock-data/`, processes the data in-memory (filtering, sorting, pagination, role checks), and returns a real `HttpResponse` object with a `delay()` so network timing looks genuine. The interceptor enforces the same security rules a backend would: `requireRole()` checks `authService.user()` and returns a 401 or 403 `HttpResponse` before any data is touched, so seller routes block customers and admin-only mutations block sellers — all without any real server. Because every service in the app calls `HttpClient` via `/api/...` URLs and never knows whether a real server exists, swapping from mock to production requires only removing one line from the interceptors array — zero changes to services, components, or models.

**Code to show:**
```typescript
// mock-api.interceptor.ts
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);   // pass-through for non-API calls
  // ...
  if (url === '/api/products' && method === 'GET') {
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(250),
      map(data => {
        const filters = parseProductFilters(req.params);
        const filtered = applyProductFilters(raw, filters);
        return new HttpResponse({ status: 200, body: { products: filtered.slice(...), total } });
      })
    );
  }
};
```

---

## 3. How Lazy Loading Improves Performance

Every route in `app.routes.ts` uses `loadComponent: () => import(...)` or `loadChildren: () => import(...)` — there are zero eagerly-loaded feature modules, meaning the browser's initial bundle contains only the app shell, the router, and the core services. When a user visits the home page, the admin dashboard code is never downloaded; when a customer shops, the seller and admin bundles don't exist in memory at all; Angular's build pipeline automatically code-splits each `import()` into its own chunk. The measurable result is a smaller initial bundle, faster First Contentful Paint, and — combined with `roleGuard` — an additional security benefit: a customer physically cannot inspect the admin UI's JavaScript because the browser never fetched it.

**Code to show:**
```typescript
// app.routes.ts
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  canActivate: [authGuard, roleGuard(['admin'])],
},
{
  path: 'seller',
  loadChildren: () => import('./features/seller/seller.routes').then(m => m.sellerRoutes),
  canActivate: [authGuard, roleGuard(['seller'])],
},
{
  path: '',  // even the home page is lazy
  loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
},
```

---

## 4. How RoleGuard Restricts Access Using Computed Signals

`role.guard.ts` is a factory function that takes an `allowedRoles` array and returns a guard function — the guard injects `AuthService`, reads `auth.role()`, and either returns `true` or redirects to `/unauthorized`. `auth.role()` is a `computed()` signal that derives from `_user` — it always reflects the current login state without any subscription or manual change detection, so if the user's role changes (e.g. they log out) every guard that reads the signal will see the new value instantly. The same signal drives the navbar's conditional links, the interceptor's `requireRole()` helper, and the route guards — there is a single source of truth for "who is the current user" and it flows reactively everywhere.

**Code to show:**
```typescript
// role.guard.ts
export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (allowedRoles.includes(auth.role())) return true;   // auth.role() is a computed signal
    return router.parseUrl('/unauthorized');
  };
};

// auth.service.ts — the signal that powers the guard
readonly role = computed(() => this._user()?.role ?? 'guest');
```

---

## 5. How the Cart Persists Across Page Refreshes

`CartService` writes to `localStorage` after every mutation via a private `persistCart()` method that serialises the current `_items` signal value — so `addToCart()`, `removeFromCart()`, `updateQuantity()`, and `clearCart()` all end with `this.persistCart()`. On service construction, `loadCart()` reads `localStorage.getItem(this.cartKey)`, parses the JSON, and restores the signal — meaning the moment Angular bootstraps, the cart is already populated before any component renders. The storage key is `cart_user_<userId>` for authenticated users and `cart_user_guest` for anonymous users, so each account has its own isolated cart: logging in as the seller shows the seller's cart; logging out and back in as the customer restores the customer's cart exactly as they left it.

**Code to show:**
```typescript
// cart.service.ts
private get cartKey(): string {
  return `cart_user_${this._currentUserId}`;   // scoped per user
}

private loadCart(): void {
  const saved = localStorage.getItem(this.cartKey);
  if (saved) this._items.set(JSON.parse(saved));   // rehydrate signal on boot
}

private persistCart(): void {
  localStorage.setItem(this.cartKey, JSON.stringify(this._items()));  // write after every change
}

addToCart(product: Product, quantity = 1): void {
  this._items.update(items => { /* ...merge logic... */ });
  this.persistCart();   // <-- always persisted
}
```

---

## Quick Pattern Reference

| Pattern | Key file | Angular feature used |
|---|---|---|
| Signals replace NgRx | `core/services/auth.service.ts` | `signal()`, `computed()` |
| Mock API interceptor | `core/interceptors/mock-api.interceptor.ts` | `HttpInterceptorFn`, `HttpResponse`, `delay()` |
| Lazy loading | `app/app.routes.ts` | `loadComponent`, `loadChildren` |
| RoleGuard with signals | `core/guards/role.guard.ts` | `computed()`, functional guards |
| Cart persistence | `core/services/cart.service.ts` | `signal()`, `localStorage`, auth events |
