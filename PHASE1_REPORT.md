# Phase 1: Auth & User Management — Implementation Report

> **Audience:** Angular learners (intermediate)
> **Stack:** Angular 21.2, standalone components, Signals, Bootstrap 5, RxJS
> **Pattern:** Mock API interceptor, lazy loading, functional guards

---

## Architecture Overview

```
src/
├── main.ts                          # App bootstrap + providers
├── app/
│   ├── app.routes.ts                # Root routes (lazy-loaded)
│   ├── app.component.ts             # Standalone root component
│   ├── core/
│   │   ├── models/user.model.ts     # User, Address, SavedCard interfaces
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Auth state via Signals
│   │   │   ├── wishlist.service.ts  # Wishlist state via Signals
│   │   │   └── cart.service.ts      # Cart state via Signals
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        # CanActivateFn — checks login
│   │   │   └── role.guard.ts        # CanActivateFn — checks role
│   │   └── interceptors/
│   │       └── mock-api.interceptor.ts  # Catches /api/* → JSON files
│   ├── features/
│   │   ├── auth/auth.routes.ts      # /auth/* routes
│   │   ├── wishlist/wishlist.component.ts
│   │   └── ...
│   ├── auth/                        # Component implementations
│   │   ├── login/login.component.ts
│   │   ├── register/register.component.ts
│   │   └── profile/profile.component.ts
│   └── shared/components/
│       ├── navbar/                  # Wishlist + Cart badges
│       └── unauthorized/
└── assets/mock-data/users.json      # 5 mock users, 3 roles
```

---

## 1. Key Angular Concepts Demonstrated

### 1.1 Standalone Components (no NgModules)

Every component uses `standalone: true` and imports its dependencies directly:

```typescript
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent { ... }
```

**Why:** Angular 15+ made standalone the default. No `NgModule` wrappers — each component declares what it needs. This reduces boilerplate and makes lazy loading simpler.

### 1.2 Signals (Reactivity)

Signals replace `BehaviorSubject` + `async` pipe for state management:

```typescript
// Private writable signal (only this service can write)
private _user = signal<User | null>(null);

// Public readonly signal (everyone reads)
readonly user = this._user.asReadonly();

// Computed signal (derived value, auto-updates)
readonly isLoggedIn = computed(() => !!this._user());
readonly role = computed(() => this._user()?.role ?? 'guest');
```

**How it works:**
| Concept | Syntax | Purpose |
|---|---|---|
| Create | `signal(initialValue)` | Writable state container |
| Read | `signal()` | Call like a function to get value |
| Write | `signal.set(newValue)` | Replace entire value |
| Update | `signal.update(old => new)` | Derive from current value |
| Readonly | `signal.asReadonly()` | Expose publicly without write access |
| Computed | `computed(() => ...)` | Derived value, re-evaluated when dependencies change |

**Why Signals over `BehaviorSubject`:**
- No `| async` pipe needed in templates — just `signal()`
- Better performance with `OnPush` (Angular knows exactly what changed)
- Simpler API: `.set()`, `.update()`, no `.next()`, no subscriptions
- Cleaner template syntax: `@if (auth.user(); as user)` instead of `(auth.user$ | async)`

### 1.3 `inject()` over Constructor Injection

Instead of listing dependencies in the constructor:

```typescript
// Old way (constructor injection)
constructor(private authService: AuthService) { }

// New way (inject function)
private readonly authService = inject(AuthService);
```

**Why:** `inject()` works in any initializer context (not just constructors). It avoids the "used before initialization" TS2729 error when you assign class properties from injected services. It also works in guards, interceptors, and utility functions.

### 1.4 Functional Route Guards

Instead of classes, guards are plain functions:

```typescript
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;       // Allow navigation
  return router.parseUrl('/auth/login');     // Redirect
};

export const roleGuard = (allowedRoles: string[]) => {
  return () => {                              // Returns a guard function
    const auth = inject(AuthService);
    if (allowedRoles.includes(auth.role())) return true;
    return router.parseUrl('/unauthorized');
  };
};
```

Used in routes:
```typescript
{ path: 'admin', canActivate: [authGuard, roleGuard(['admin'])] }
```

### 1.5 `bootstrapApplication` (standalone bootstrap)

Instead of `platformBrowser().bootstrapModule(AppModule)`:

```typescript
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    importProvidersFrom(SocialLoginModule.initialize({ ... })),
    { provide: APP_INITIALIZER, useFactory: ..., deps: [AuthService], multi: true },
  ],
});
```

**How providers work in standalone mode:**
| Function | Provides |
|---|---|
| `provideRouter(routes)` | Router with route config |
| `provideHttpClient(withInterceptors([...]))` | HttpClient + HTTP interceptors |
| `importProvidersFrom(NgModule)` | Use an NgModule's providers in standalone mode |
| `{ provide: TOKEN, useClass/useFactory/useValue }` | Classic DI provider |

---

## 2. Mock API Architecture

### 2.1 The Interceptor Pattern

`mock-api.interceptor.ts` catches all `/api/*` HTTP requests before they reach a real server:

```typescript
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);  // Pass through non-API calls

  const http = inject(HttpClient);
  // Match URL patterns and respond from JSON files
  if (url === '/api/auth/login' && method === 'POST') {
    return http.get('/assets/mock-data/users.json').pipe(
      delay(300),        // Simulate network latency
      switchMap(data => {
        const user = data.users.find(u => u.email === email);
        if (!user) return throwError(() => new HttpErrorResponse({ status: 401, ... }));
        return of(new HttpResponse({ status: 200, body: user }));
      })
    );
  }
  // ... more routes
};
```

**Why a functional interceptor?** Angular's `HttpInterceptorFn` is simpler than the class-based `HttpInterceptor`. No `implements`, no `ngModule` registration — just a function injected via `withInterceptors()`.

### 2.2 Mock Data

`users.json` contains 5 users with different roles:

```json
[
  { "id": 1, "email": "admin@openfashion.com", "role": "admin", ... },
  { "id": 2, "email": "seller@openfashion.com", "role": "seller", ... },
  { "id": 3, "email": "customer@openfashion.com", "role": "customer", ... },
  { "id": 4, "email": "jane@example.com", "role": "customer", ... },
  { "id": 5, "email": "bob@example.com", "role": "seller", ... }
]
```

**Demo credentials for testing:**
| Email | Password | Role |
|---|---|---|
| admin@openfashion.com | admin123 | Admin |
| customer@openfashion.com | customer123 | Customer |
| seller@openfashion.com | seller123 | Seller |

---

## 3. AuthService Deep Dive

This is the core of Phase 1. Every other component depends on it.

### Signal Design

```typescript
private _user = signal<User | null>(null);     // Write access: only AuthService
readonly user = this._user.asReadonly();         // Read access: everyone
readonly isLoggedIn = computed(() => !!this._user());
readonly role = computed(() => this._user()?.role ?? 'guest');
```

**Why `asReadonly()`?** Components can read the user but not modify it. Only `AuthService` can call `_user.set()`. This enforces unidirectional data flow.

**Why `?? 'guest'` in role?** When no user is logged in, `role()` returns `'guest'` instead of `undefined`. This means `roleGuard(['admin'])` will correctly block unauthenticated users (they're `'guest'`, not `'admin'`).

### Login Flow

```
LoginComponent                    AuthService                 MockApiInterceptor
     │                               │                             │
     │  onSubmit()                   │                             │
     │──login(email, password)──────>│                             │
     │                               │─POST /api/auth/login──────>│
     │                               │                             │─read users.json
     │                               │                             │─find by email
     │                               │<──User (or 401 error)──────│
     │                               │
     │                               │─localStorage.setItem()
     │                               │─_user.set(user)
     │                               │─wishlistService.syncFromUser()
     │<──router.navigate('/products')│
```

### Registration Flow

Same structure, but:
1. Mock interceptor checks for duplicate email (409 Conflict)
2. Creates a new user object with `pendingVerification: true`
3. Returns the user with a token
4. AuthService stores + redirects, then shows the email confirmation modal

### Profile Update Flow

```
ProfileComponent              AuthService               MockApiInterceptor
     │                            │                           │
     │ updateProfile(data)───────>│                           │
     │                            │─PUT /api/auth/profile───>│
     │                            │                           │─returns data as-is
     │                            │<──updated user────────────│
     │                            │
     │                            │─localStorage update
     │                            │─_user.set(updated)
     │<── "Saved!" toast          │
```

**Note:** Since there's no real database, `PUT /api/auth/profile` just echoes back the request body. In production, this would persist to a backend.

---

## 4. Component Breakdown

### 4.1 LoginComponent

**Form setup:**
```typescript
this.loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(3)]]
});
```

**Features:**
- Reactive form with validators
- Show/hide password toggle via `showPassword` signal
- Google OAuth button (mock — logs in as `customer@openfashion.com`)
- Email + password submit

**Template highlights:**
```html
<!-- Password toggle -->
<div class="input-wrapper">
  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" />
  <button type="button" (click)="togglePassword()">
    <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
  </button>
</div>

<!-- Error message -->
@if (errorMessage(); as msg) {
  <div class="auth-error">{{ msg }}</div>
}
```

### 4.2 RegisterComponent

**Form fields:** name, email, phone, password, confirmPassword, role (customer/seller)

**Role selector:**
```html
<div class="role-selector">
  <label class="role-option" [class.active]="registerForm.get('role')?.value === 'customer'">
    <input type="radio" formControlName="role" value="customer" />
    <i class="bi bi-person"></i>
    <span>Buy Products</span>
  </label>
  <label class="role-option" [class.active]="registerForm.get('role')?.value === 'seller'">
    <input type="radio" formControlName="role" value="seller" />
    <i class="bi bi-shop"></i>
    <span>Sell Products</span>
  </label>
</div>
```

**Email confirmation modal:**
After successful registration, a Bootstrap modal opens automatically with a mock verification email body. Uses `afterNextRender()` to show the modal after the DOM renders:

```typescript
private showModal(): void {
  afterNextRender(() => {
    const el = this.modalElement()?.nativeElement;
    if (el && bootstrap) {
      const modal = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  });
}
```

**Why `afterNextRender`?** The modal element is created conditionally (`@if (registeredUser())`). `afterNextRender` waits for Angular to render the updated DOM before trying to create the Bootstrap modal instance.

### 4.3 ProfileComponent

**Layout:** Two-column grid — avatar/sidebar (wallet, points) + main form area.

**Form:** Disabled email, editable name, phone, full address (street, city, state, zip, country).

**Other sections:**
- Saved payment cards (displayed in a card grid, with "Default" badge)
- Quick links to Order History and Wishlist (with count badge)

**Signal usage:**
```typescript
readonly user = this.authService.user;                                // Reactive user from AuthService
readonly wishlistCount = computed(() => this.authService.user()?.wishlist.length ?? 0);
```

---

## 5. WishlistService

### Signal Design

```typescript
private wishlistSignal = signal<number[]>([]);
readonly wishlist = this.wishlistSignal.asReadonly();
readonly count = computed(() => this.wishlistSignal().length);
```

### Key Methods

| Method | What it does |
|---|---|
| `add(productId)` | Appends if not already present |
| `remove(productId)` | Filters out the ID |
| `toggle(productId)` | Adds if absent, removes if present |
| `isInWishlist(productId)` | Returns boolean (synchronous check) |
| `clear()` | Empties the array |
| `syncFromUser(id, wishlist)` | Replaces with user's server-side wishlist |

### Persistence

The wishlist is saved to `localStorage` on every mutation (`persist()` method called after each update). On app init, the constructor restores it.

### Sync with AuthService

When login/register/restore happens, the user's `wishlist` array (stored in the mock data) is loaded into the service:

```typescript
private onLogin(user: User): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
  this._user.set(user);
  this.wishlistService.syncFromUser(user.id, user.wishlist);
}
```

---

## 6. Route Guards

### AuthGuard

```typescript
export const authGuard = () => {
  if (auth.isLoggedIn()) return true;
  return router.parseUrl('/auth/login');   // Redirects (doesn't navigate — returns UrlTree)
};
```

**Why `parseUrl` instead of `router.navigate`?** `parseUrl` returns a `UrlTree` that Angular's router treats as a redirect. The original URL is preserved in the navigation history. `router.navigate` inside a guard is unreliable because the guard runs during navigation, not after it.

### RoleGuard

```typescript
export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    if (allowedRoles.includes(auth.role())) return true;
    return router.parseUrl('/unauthorized');
  };
};
```

**Usage:** `roleGuard(['admin'])` — this is a **curried function**. It takes allowed roles and returns the actual guard function. This pattern lets you reuse the same guard for different role requirements.

### Where they're applied

```typescript
{ path: 'orders', canActivate: [authGuard] },                    // Any logged-in user
{ path: 'admin', canActivate: [authGuard, roleGuard(['admin'])] }, // Admin only
{ path: 'auth/profile', canActivate: [authGuard] },               // Any logged-in user
```

---

## 7. Routing & Lazy Loading

### Route Structure

```
/products          → ProductListComponent     (lazy)
/products/:id       → ProductDetailsComponent  (lazy)
/auth/login        → LoginComponent           (lazy)
/auth/register     → RegisterComponent        (lazy)
/auth/profile      → ProfileComponent         (lazy, guarded)
/cart              → CartComponent            (lazy)
/wishlist          → WishlistComponent        (lazy)
/orders            → OrderListComponent       (lazy, guarded)
/admin/dashboard   → DashboardComponent       (lazy, guarded)
/unauthorized      → UnauthorizedComponent    (lazy)
```

### How Lazy Loading Works

```typescript
{
  path: 'auth',
  loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
}
```

The `auth` module is loaded only when the user visits `/auth/*`. The browser downloads the JavaScript chunk on demand, not at initial page load.

`loadComponent` (for leaf routes) is even more granular — each component is its own chunk:

```typescript
{
  path: 'wishlist',
  loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent),
}
```

---

## 8. Error Handling Pattern

### Mock Interceptor → Proper HTTP Errors

The interceptor returns `HttpErrorResponse` (not thrown strings) so the component can read structured error data:

```typescript
// Interceptor
throwError(() => new HttpErrorResponse({
  status: 401,
  error: { message: 'Invalid email or password' }
}))

// Component
error: (err) => {
  this.errorMessage.set(err?.error?.message || err?.message || 'Fallback message');
}
```

**Why `throwError(() => ...)` instead of `throw new Error()`?** `throwError` returns an Observable that emits an error notification. This preserves Angular's error handling pipeline and lets the component catch it via the `.subscribe()` error callback. A raw `throw` inside a `map` operator also works, but `throwError` with `HttpErrorResponse` gives you structured HTTP error data.

---

## 9. APP_INITIALIZER Pattern

```typescript
{
  provide: APP_INITIALIZER,
  useFactory: () => {
    return () => {
      return Promise.resolve();
    };
  },
  deps: [AuthService],     // Injects AuthService, triggering constructor
  multi: true,
}
```

**How it works:**
1. Angular resolves `deps: [AuthService]` → creates/injects the singleton
2. The `AuthService` constructor runs → reads `localStorage` → restores session
3. The factory returns a resolved Promise → initialization completes
4. The app renders

**Why not just rely on the constructor?** The `APP_INITIALIZER` guarantees the auth session is restored **before** the app renders. The constructor approach works too, but `APP_INITIALIZER` makes the dependency explicit and ensures ordering if you have multiple initialization tasks.

---

## 10. Google OAuth (Mock)

### Setup

```
npm install @abacritt/angularx-social-login
```

### Provider Configuration

```typescript
importProvidersFrom(
  SocialLoginModule.initialize({
    providers: [{
      id: GoogleLoginProvider.PROVIDER_ID,
      provider: new GoogleLoginProvider('MOCK_CLIENT_ID.apps.googleusercontent.com'),
    }],
  })
)
```

### Component Integration

```typescript
export class LoginComponent implements OnDestroy {
  private readonly socialAuthService = inject(SocialAuthService);

  // Subscribe to auth state changes
  private readonly authSub = this.socialAuthService.authState.subscribe(user => {
    if (user?.email) {
      this.authService.login(user.email, 'mock-oauth').subscribe(...);
    }
  });

  // Mock button (since dummy client ID won't actually work)
  mockGoogleSignIn(): void {
    this.authService.login('customer@openfashion.com', 'customer123').subscribe(...);
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();  // Prevent memory leaks
  }
}
```

---

## 11. Styling Approach

### CSS Custom Properties

All colors, fonts, and spacing are defined as CSS variables in `:root`:

```css
:root {
  --font-heading: 'Bodoni Moda', serif;
  --font-body: 'Tenor Sans', sans-serif;
  --color-accent: #DD8560;
  --color-accent-hover: #C9714D;
  --color-text: #333333;
  --color-border: #E8E8E8;
}
```

### Component-Specific Styles

Each component has its own `.css` file. Global patterns (like `.input-wrapper`, `.role-selector`) are in `styles.css` so they can be reused across components.

---

## 12. Common Pitfalls & Solutions

| Problem | Solution |
|---|---|
| `TS2729: Property used before initialization` | Use `inject()` as a field initializer, not in constructor |
| Guard redirect doesn't work | Return `router.parseUrl('/path')` instead of `router.navigate()` |
| Modal won't show | Use `afterNextRender()` when the modal element is conditionally rendered |
| `Object is possibly null` (req.body) | Check `typeof req.body === 'object' && req.body !== null` before spreading |
| `Signal<Order[]>` has no `.subscribe()` | Signals are synchronous values; use `toObservable()` or HTTP directly |
| `APP_INITIALIZER` type error | Import from `@angular/core`, not `@angular/platform-browser` |
| Spread types only from object types | Cast to `any` in interceptor: `{ ...(body as any) }` |

---

## 13. Summary: What Was Built

| File | Lines | Purpose |
|---|---|---|
| `core/models/user.model.ts` | 40 | TypeScript interfaces for User, Address, SavedCard |
| `core/services/auth.service.ts` | 68 | Signal-based auth, login/register/profile/logout |
| `core/services/wishlist.service.ts` | 55 | Signal-based wishlist, localStorage persistence |
| `core/guards/auth.guard.ts` | 10 | Redirects to login if not authenticated |
| `core/guards/role.guard.ts` | 12 | Redirects to /unauthorized if wrong role |
| `core/interceptors/mock-api.interceptor.ts` | 150 | Catches /api/*, returns mock JSON responses |
| `auth/login/login.component.ts` | 82 | Email + password form, Google OAuth button |
| `auth/register/register.component.ts` | 96 | Registration form, email verification modal |
| `auth/profile/profile.component.ts` | 72 | Editable profile, payment cards, quick links |
| `features/wishlist/wishlist.component.ts` | 51 | Product card grid with remove + add-to-cart |
| `app.routes.ts` | 42 | Lazy-loaded routes with guards |
| `main.ts` | 38 | Bootstrap with all providers |
| `assets/mock-data/users.json` | ~50 | 5 users across 3 roles |

**Total: ~700 lines of TypeScript/HTML/CSS for Phase 1.**
