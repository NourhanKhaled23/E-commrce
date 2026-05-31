import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, map, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/* ═══════════════════════════════════════════════════════════════
   SECURITY HELPERS
   ═══════════════════════════════════════════════════════════════ */

function sanitizeUser(user: any): any {
  const { password, ...safe } = user;
  return safe;
}

function requireRole(authService: AuthService, ...roles: string[]): HttpResponse<any> | null {
  const user = authService.user();
  if (!user) return new HttpResponse({ status: 401, body: { message: 'Unauthorized' } });
  if (!roles.includes(user.role)) return new HttpResponse({ status: 403, body: { message: 'Forbidden' } });
  return null;
}

function currentUser(authService: AuthService): any {
  return authService.user();
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT FILTER ENGINE
   ═══════════════════════════════════════════════════════════════ */

interface ProductFilters {
  search?: string;
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sellerId?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  limit?: number;
  skip?: number;
}

/**
 * Normalize a raw product from JSON so every consumer sees consistent fields:
 *   title / name  (JSON uses `title`, model uses `name`)
 *   rating / avgRating  (JSON uses `rating`, model uses `avgRating`)
 *   comparePrice / originalPrice  (JSON may use either)
 */
function normalizeProduct(p: any): any {
  return {
    ...p,
    title:       p.title       ?? p.name ?? '',
    name:        p.name        ?? p.title ?? '',
    rating:      p.rating      ?? p.avgRating ?? 0,
    avgRating:   p.avgRating   ?? p.rating ?? 0,
    comparePrice:  p.comparePrice  ?? p.originalPrice ?? null,
    originalPrice: p.originalPrice ?? p.comparePrice  ?? null,
    reviewCount: p.reviewCount ?? 0,
    stock:       p.stock       ?? 0,
    tags:        p.tags        ?? [],
    images:      (p.images && p.images.length > 0) ? p.images : [p.thumbnail],
    active:      p.active !== false,
    createdAt:   p.createdAt   ?? new Date().toISOString(),
  };
}

function parseProductFilters(params: HttpParams): ProductFilters {
  return {
    search:       params.get('search')       || undefined,
    categoryId:   params.get('categoryId')   ? +params.get('categoryId')!  : undefined,
    categorySlug: params.get('category')     || params.get('slug')         || undefined,
    minPrice:     params.get('minPrice')     ? +params.get('minPrice')!    : undefined,
    maxPrice:     params.get('maxPrice')     ? +params.get('maxPrice')!    : undefined,
    minRating:    params.get('minRating')    ? +params.get('minRating')!   : undefined,
    inStock:      params.get('inStock')      === 'true'                    ? true : undefined,
    sellerId:     params.get('sellerId')     ? +params.get('sellerId')!    : undefined,
    sort:         (params.get('sort') as any) || 'newest',
    limit:        params.get('limit')        ? +params.get('limit')!       : 20,
    skip:         params.get('skip')         ? +params.get('skip')!        : 0,
  };
}


function getParentCategoryId(categoryId: number): number | null {
  const parentMap: Record<number, number> = {
    2: 1, 3: 1, 4: 1,
    9: 8, 10: 8, 11: 8, 12: 8,
    14: 13, 15: 13, 16: 13, 25: 13,
    18: 17, 19: 17, 20: 17, 21: 17, 22: 17, 26: 17
  };
  return parentMap[categoryId] ?? null;
}

function applyProductFilters(products: any[], f: ProductFilters): any[] {
  let result = [...products].filter(p => p.active !== false);

  if (f.search) {
    const q = f.search.toLowerCase();
    result = result.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  if (f.categoryId) {
    result = result.filter(p =>
      p.categoryId === f.categoryId ||
      getParentCategoryId(p.categoryId) === f.categoryId
    );
  } else if (f.categorySlug) {
    result = result.filter(p =>
      p.categorySlug === f.categorySlug ||
      p.category === f.categorySlug
    );
  }

  if (f.minPrice !== undefined) result = result.filter(p => p.price >= f.minPrice!);
  if (f.maxPrice !== undefined) result = result.filter(p => p.price <= f.maxPrice!);
  if (f.minRating !== undefined) result = result.filter(p => (p.rating ?? 0) >= f.minRating!);
  if (f.inStock) result = result.filter(p => (p.stock ?? 0) > 0);
  if (f.sellerId) result = result.filter(p => p.sellerId === f.sellerId);

  switch (f.sort) {
    case 'price_asc':  result.sort((a, b) => a.price - b.price); break;
    case 'price_desc': result.sort((a, b) => b.price - a.price); break;
    case 'rating':     result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    case 'popular':    result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)); break;
    case 'newest':
    default:           result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   MOCK API INTERCEPTOR
   ═══════════════════════════════════════════════════════════════ */

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  const http = inject(HttpClient);
  const authService = inject(AuthService);
  const url = req.url;
  const method = req.method;

  /* ── GET /api/products/featured ── */
  if (url === '/api/products/featured' && method === 'GET') {
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(200),
      map(data => {
        const raw = Array.isArray(data) ? data : (data.products ?? []);
        const all = raw.map(normalizeProduct);
        const featured = [...all].filter(p => p.active !== false)
          .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
          .slice(0, 8);
        return new HttpResponse({ status: 200, body: featured });
      })
    );
  }

  /* ── GET /api/products/search ── */
  if (url.startsWith('/api/products/search')) {
    const query = req.params.get('q')?.toLowerCase() || '';
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(200),
      map(data => {
        const all = Array.isArray(data) ? data : (data.products ?? []);
        const filtered = all.filter((p: any) =>
          p.title?.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)
        );
        return new HttpResponse({ status: 200, body: { products: filtered, total: filtered.length, skip: 0, limit: filtered.length } });
      })
    );
  }

  /* ── GET /api/products (full filter engine) ── */
  if (url === '/api/products' && method === 'GET') {
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(250),
      map(data => {
        const raw = Array.isArray(data) ? data : (data.products ?? []);
        const allProducts = raw.map(normalizeProduct);
        const filters = parseProductFilters(req.params);
        const filtered = applyProductFilters(allProducts, filters);
        const total = filtered.length;
        const paginated = filtered.slice(filters.skip!, filters.skip! + filters.limit!);
        return new HttpResponse({
          status: 200,
          body: { products: paginated, total, skip: filters.skip, limit: filters.limit }
        });
      })
    );
  }

  /* ── GET /api/products/categories ── */
  if (url.startsWith('/api/products/categories')) {
    return http.get<any>('/assets/mock-data/categories.json').pipe(
      delay(200), map(body => new HttpResponse({ status: 200, body }))
    );
  }

  /* ── GET /api/products/category/:slug ── */
  if (url.match(/\/api\/products\/category\/(.+)/)) {
    const category = decodeURIComponent(url.match(/\/api\/products\/category\/(.+)/)![1]).replace(/%20/g, ' ');
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(250),
      map(data => {
        const all = Array.isArray(data) ? data : (data.products ?? []);
        const filtered = all.filter((p: any) => p.category?.toLowerCase() === category.toLowerCase());
        return new HttpResponse({ status: 200, body: { products: filtered, total: filtered.length, skip: 0, limit: filtered.length } });
      })
    );
  }

  /* ── POST /api/products ── */
  if (url === '/api/products' && method === 'POST') {
    const denied = requireRole(authService, 'seller', 'admin');
    if (denied) return of(denied);
    const body = req.body as any;
    const newProduct = {
      id: Date.now(),
      ...body,
      categoryId: body.categoryId || 1,
      categorySlug: body.categorySlug || body.category || 'beauty',
      sellerId: currentUser(authService)?.id || 1,
      rating: 0,
      reviewCount: 0,
      originalPrice: null,
      active: true,
      tags: body.tags || [],
      createdAt: new Date().toISOString()
    };
    return of(new HttpResponse({ status: 201, body: newProduct })).pipe(delay(200));
  }

  /* ── GET /api/products/:id ── */
  const productMatch = url.match(/\/api\/products\/(\d+)$/);
  if (productMatch && method === 'GET') {
    return http.get<any>('/assets/mock-data/products.json').pipe(
      delay(150),
      map(data => {
        const raw = Array.isArray(data) ? data : (data.products ?? []);
        const id = parseInt(productMatch[1]);
        const product = raw.find((p: any) => p.id === id);
        return product
          ? new HttpResponse({ status: 200, body: normalizeProduct(product) })
          : new HttpResponse({ status: 404, body: { message: 'Product not found' } });
      })
    );
  }

  /* ── PUT /api/products/:id ── */
  if (productMatch && method === 'PUT') {
    const denied = requireRole(authService, 'seller', 'admin');
    if (denied) return of(denied);
    const id = parseInt(productMatch[1]);
    const body = req.body as any;
    return of(new HttpResponse({ status: 200, body: { id, ...body } })).pipe(delay(200));
  }

  /* ── DELETE /api/products/:id ── */
  if (productMatch && method === 'DELETE') {
    const denied = requireRole(authService, 'seller', 'admin');
    if (denied) return of(denied);
    return of(new HttpResponse({ status: 200, body: null })).pipe(delay(200));
  }

  /* ── GET /api/categories ── */
  if (url === '/api/categories' && method === 'GET') {
    return http.get<any>('/assets/mock-data/categories.json').pipe(
      delay(200),
      map(cats => {
        const parentId = req.params.get('parentId');
        const slug = req.params.get('slug');
        let result = cats;

        if (parentId === 'null' || parentId === '') {
          result = cats.filter((c: any) => c.parentId === null);
        } else if (parentId) {
          result = cats.filter((c: any) => c.parentId === parseInt(parentId));
        }

        if (slug) {
          result = cats.filter((c: any) => c.slug === slug);
        }

        // Build tree: add children array to each parent
        if (!parentId && !slug) {
          const tree = result.map((cat: any) => ({
            ...cat,
            children: cats.filter((c: any) => c.parentId === cat.id)
          }));
          return new HttpResponse({ status: 200, body: tree });
        }

        return new HttpResponse({ status: 200, body: result });
      })
    );
  }

  /* ── GET /api/reviews ── */
  if (url.startsWith('/api/reviews') && method === 'GET') {
    return http.get<any[]>('/assets/mock-data/reviews.json').pipe(
      delay(200),
      map(reviews => {
        const productId = parseInt(req.params.get('productId') || '0');
        const userId = parseInt(req.params.get('userId') || '0');
        let filtered = productId ? reviews.filter(r => r.productId === productId) : reviews;
        if (userId) filtered = filtered.filter(r => r.userId === userId);
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const avgRating = filtered.length
          ? +(filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
          : 0;
        return new HttpResponse({ status: 200, body: { reviews: filtered, total: filtered.length, avgRating } });
      })
    );
  }

  /* ── POST /api/reviews ── */
  if (url === '/api/reviews' && method === 'POST') {
    const user = currentUser(authService);
    if (!user) return of(new HttpResponse({ status: 401, body: { message: 'Unauthorized' } }));
    const body = req.body as any;
    if (!body.productId || !body.rating || body.rating < 1 || body.rating > 5) {
      return of(new HttpResponse({ status: 400, body: { message: 'Invalid review data' } }));
    }
    if (!body.comment || body.comment.length < 10) {
      return of(new HttpResponse({ status: 400, body: { message: 'Comment must be at least 10 characters' } }));
    }
    const newReview = {
      id: Date.now(),
      productId: body.productId,
      userId: user.id,
      userName: user.name || 'Anonymous',
      rating: body.rating,
      title: body.title || '',
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    return of(new HttpResponse({ status: 201, body: newReview })).pipe(delay(300));
  }

  /* ── GET /api/banners ── */
  if (url.startsWith('/api/banners') && method === 'GET' && !url.match(/\/api\/banners\/\d+/)) {
    return http.get<any[]>('/assets/mock-data/banners.json').pipe(
      delay(200),
      map(banners => {
        const activeOnly = req.params.get('active') === 'true';
        let result = activeOnly ? banners.filter(b => b.active) : banners;
        result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return new HttpResponse({ status: 200, body: result });
      })
    );
  }

  /* ── POST /api/banners ── */
  if (url === '/api/banners' && method === 'POST') {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    const body = req.body as any;
    return of(new HttpResponse({ status: 201, body: { id: Date.now(), ...body } })).pipe(delay(200));
  }

  /* ── PUT/PATCH /api/banners/:id ── */
  const bannerMatch = url.match(/\/api\/banners\/(\d+)/);
  if (bannerMatch && (method === 'PUT' || method === 'PATCH')) {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    return of(new HttpResponse({ status: 200, body: req.body })).pipe(delay(200));
  }

  /* ── DELETE /api/banners/:id ── */
  if (bannerMatch && method === 'DELETE') {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    return of(new HttpResponse({ status: 200, body: null })).pipe(delay(200));
  }

  /* ── GET /api/promo-codes ── */
  if (url === '/api/promo-codes' && method === 'GET') {
    return http.get<any[]>('/assets/mock-data/promo-codes.json').pipe(
      delay(200),
      map(codes => {
        const user = currentUser(authService);
        // Customers should not see all promo codes — only active ones for validation
        if (user?.role === 'customer' || !user) {
          const codeParam = req.params.get('code');
          if (codeParam) {
            const found = codes.find(c => c.code.toUpperCase() === codeParam.toUpperCase() && c.active);
            return new HttpResponse({ status: found ? 200 : 404, body: found || null });
          }
          // Return only codes with basic info (no admin details)
          const safeCodes = codes.map(c => ({ code: c.code, type: c.type, value: c.value, minAmount: c.minAmount }));
          return new HttpResponse({ status: 200, body: safeCodes });
        }
        // Admin/seller can see everything
        const codeParam = req.params.get('code');
        if (codeParam) {
          const found = codes.find(c => c.code.toUpperCase() === codeParam.toUpperCase());
          return new HttpResponse({ status: found ? 200 : 404, body: found || null });
        }
        return new HttpResponse({ status: 200, body: codes });
      })
    );
  }

  /* ── POST /api/promo-codes/validate ── */
  if (url === '/api/promo-codes/validate' && method === 'POST') {
    const { code, cartTotal } = req.body as any;
    return http.get<any[]>('/assets/mock-data/promo-codes.json').pipe(
      delay(200),
      map(codes => {
        const promo = codes.find(c => c.code.toUpperCase() === (code || '').toUpperCase());
        if (!promo) {
          return new HttpResponse({ status: 200, body: { valid: false, message: 'Code not found' } });
        }
        if (!promo.active) {
          return new HttpResponse({ status: 200, body: { valid: false, message: 'Code inactive' } });
        }
        if (promo.expiry && new Date(promo.expiry) < new Date()) {
          return new HttpResponse({ status: 200, body: { valid: false, message: 'Code expired' } });
        }
        if (promo.minAmount > 0 && cartTotal < promo.minAmount) {
          return new HttpResponse({ status: 200, body: { valid: false, message: `Minimum order $${promo.minAmount} required` } });
        }
        const discount = promo.type === 'percentage'
          ? +(cartTotal * promo.value / 100).toFixed(2)
          : Math.min(promo.value, cartTotal);
        return new HttpResponse({
          status: 200,
          body: { valid: true, discount, type: promo.type, message: `${promo.type === 'percentage' ? promo.value + '%' : '$' + promo.value} discount applied!` }
        });
      })
    );
  }

  /* ── POST /api/promo-codes ── */
  if (url === '/api/promo-codes' && method === 'POST') {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    const body = req.body as any;
    return of(new HttpResponse({ status: 201, body: { id: Date.now(), ...body } })).pipe(delay(200));
  }

  /* ── PUT/PATCH /api/promo-codes/:id ── */
  const promoCodeMatch = url.match(/\/api\/promo-codes\/(\d+)/);
  if (promoCodeMatch && (method === 'PUT' || method === 'PATCH')) {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    return of(new HttpResponse({ status: 200, body: { id: parseInt(promoCodeMatch[1]), ...(req.body as any) } })).pipe(delay(200));
  }

  /* ── DELETE /api/promo-codes/:id ── */
  if (promoCodeMatch && method === 'DELETE') {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    return of(new HttpResponse({ status: 200, body: null })).pipe(delay(200));
  }

  /* ── GET /api/payouts ── */
  if (url === '/api/payouts' && method === 'GET') {
    const user = currentUser(authService);
    if (!user) return of(new HttpResponse({ status: 401, body: { message: 'Unauthorized' } }));
    return http.get<any[]>('/assets/mock-data/payouts.json').pipe(
      delay(200),
      map(payouts => {
        const filtered = user.role === 'admin' ? payouts : payouts.filter(p => p.sellerId === user.id);
        return new HttpResponse({ status: 200, body: filtered });
      })
    );
  }

  /* ── POST /api/payouts/request ── */
  if (url === '/api/payouts/request' && method === 'POST') {
    const denied = requireRole(authService, 'seller');
    if (denied) return of(denied);
    const user = currentUser(authService);
    const { amount } = req.body as any;
    if (!amount || amount <= 0) {
      return of(new HttpResponse({ status: 400, body: { message: 'Invalid amount' } }));
    }
    const newPayout = {
      id: Date.now(),
      sellerId: user.id,
      amount,
      fee: +(amount * 0.1).toFixed(2),
      net: +(amount * 0.9).toFixed(2),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reference: `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    };
    return of(new HttpResponse({ status: 201, body: newPayout })).pipe(delay(300));
  }

  /* ── Auth: Login ── */
  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body as any;
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(300),
      switchMap(data => {
        const user = data.users.find((u: any) => u.email === email);
        if (!user || !password || password.length < 3) {
          return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: { message: 'Invalid email or password' } }));
        }
        return of(new HttpResponse({ status: 200, body: { ...sanitizeUser(user), token: `mock-token-${user.email}` } }));
      })
    );
  }

  /* ── Auth: Register ── */
  if (url === '/api/auth/register' && method === 'POST') {
    const body = req.body as any;
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(300),
      switchMap(data => {
        const exists = data.users.find((u: any) => u.email === body.email);
        if (exists) {
          return throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict', error: { message: 'Email already registered' } }));
        }
        const newUser = {
          id: data.users.length + 1, email: body.email, phone: body.phone || '',
          name: body.name, role: body.role || 'customer', password: body.password,
          address: { street: '', city: '', state: '', zipCode: '', country: '' },
          savedCards: [], walletBalance: 0, loyaltyPoints: 0, wishlist: [],
          avatar: '', pendingVerification: true, status: 'active',
          createdAt: new Date().toISOString()
        };
        return of(new HttpResponse({ status: 201, body: { ...sanitizeUser(newUser), token: `mock-token-${body.email}` } }));
      })
    );
  }

  /* ── Auth: Profile GET ── */
  if (url === '/api/auth/profile' && method === 'GET') {
    const user = currentUser(authService);
    if (!user) return of(new HttpResponse({ status: 401, body: { message: 'Unauthorized' } }));
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(200),
      map(data => {
        const full = data.users.find((u: any) => u.id === user.id);
        if (!full) return new HttpResponse({ status: 404, body: null });
        return new HttpResponse({ status: 200, body: sanitizeUser(full) });
      })
    );
  }

  /* ── Auth: Profile PUT (merge, never allow role/status change) ── */
  if (url === '/api/auth/profile' && method === 'PUT') {
    const incoming = typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const { role: _r, status: _s, password: _p, ...safeIncoming } = incoming as any;
    let existing: Record<string, unknown> = {};
    try {
      const saved = localStorage.getItem('auth_user');
      if (saved) existing = JSON.parse(saved) as Record<string, unknown>;
    } catch { /* ignore */ }
    const merged = { ...existing, ...safeIncoming };
    return of(new HttpResponse({ status: 200, body: sanitizeUser(merged) })).pipe(delay(200));
  }

  /* ── Users: GET /api/users (admin only) ── */
  if (url === '/api/users' && method === 'GET' && !url.match(/\/api\/users\/\d+/)) {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    const limit = parseInt(req.params.get('limit') || '20');
    const skip = parseInt(req.params.get('skip') || '0');
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(200),
      map(data => new HttpResponse({
        status: 200,
        body: { users: data.users.slice(skip, skip + limit).map(sanitizeUser), total: data.total, skip, limit }
      }))
    );
  }

  /* ── Users: GET /api/users/:id ── */
  const userIdMatch = url.match(/\/api\/users\/(\d+)/);
  if (userIdMatch && method === 'GET') {
    const id = parseInt(userIdMatch[1]);
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(200),
      map(data => {
        const user = data.users.find((u: any) => u.id === id);
        return new HttpResponse({ status: user ? 200 : 404, body: user ? sanitizeUser(user) : null });
      })
    );
  }

  /* ── Users: PUT /api/users/:id (admin only) ── */
  if (userIdMatch && method === 'PUT') {
    const denied = requireRole(authService, 'admin');
    if (denied) return of(denied);
    const id = parseInt(userIdMatch[1]);
    const body = req.body as any;
    return of(new HttpResponse({ status: 200, body: { id, ...body } })).pipe(delay(200));
  }

  /* ── Users: PATCH /api/users/:id ── */
  if (userIdMatch && method === 'PATCH') {
    const id = parseInt(userIdMatch[1]);
    const body = req.body as any;
    return of(new HttpResponse({ status: 200, body: { id, ...body } })).pipe(delay(200));
  }

  /* ── Orders: POST /api/orders ── */
  if (url === '/api/orders' && method === 'POST') {
    const user = currentUser(authService);
    if (user?.status === 'restricted') {
      return of(new HttpResponse({ status: 403, body: { message: 'Your account is restricted. Contact support.' } }));
    }
    const body = req.body as any;
    if (!body.items || body.items.length === 0) {
      return of(new HttpResponse({ status: 400, body: { message: 'Order must contain at least one item' } }));
    }
    if (!body.shippingAddress) {
      return of(new HttpResponse({ status: 400, body: { message: 'Shipping address required' } }));
    }
    if (!body.paymentMethod) {
      return of(new HttpResponse({ status: 400, body: { message: 'Payment method required' } }));
    }
    const now = new Date().toISOString();
    const newOrder = {
      id: Date.now(),
      userId: body.userId ?? user?.id ?? null,
      guestEmail: body.guestEmail || null,
      items: body.items,
      subtotal: body.subtotal || 0,
      discount: body.discount || 0,
      totalAmount: body.totalAmount || 0,
      status: 'placed',
      timeline: [{ status: 'placed', timestamp: now, note: 'Order placed successfully', completed: true }],
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      promoCode: body.promoCode || null,
      createdAt: now,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };
    return of(new HttpResponse({ status: 201, body: newOrder })).pipe(delay(300));
  }

  /* ── Orders: GET /api/orders/:id (single order) ── */
  const orderIdMatch = url.match(/\/api\/orders\/(\d+)/);
  if (orderIdMatch && method === 'GET') {
    const id = parseInt(orderIdMatch[1]);
    return http.get<any[]>('/assets/mock-data/orders.json').pipe(
      delay(150),
      map(orders => {
        const order = orders.find(o => o.id === id);
        if (!order) return new HttpResponse({ status: 404, body: null });
        const user = currentUser(authService);
        const canView = user?.role === 'admin' ||
          order.userId === user?.id ||
          (user?.role === 'seller' && order.items?.some((i: any) => i.product?.sellerId === user?.id));
        if (!canView) return new HttpResponse({ status: 403, body: { message: 'Forbidden' } });
        return new HttpResponse({ status: 200, body: order });
      })
    );
  }

  /* ── Orders: PUT /api/orders/:id/status (seller + admin) ── */
  if (orderIdMatch && (method === 'PUT' || method === 'PATCH') && url.includes('/status')) {
    const denied = requireRole(authService, 'seller', 'admin');
    if (denied) return of(denied);
    const id = parseInt(orderIdMatch[1]);
    const { status, note } = req.body as any;
    const user = currentUser(authService);

    // Seller can only set processing or shipped
    if (user.role === 'seller' && !['processing', 'shipped'].includes(status)) {
      return of(new HttpResponse({ status: 403, body: { message: 'Sellers can only set processing or shipped status' } }));
    }

    return http.get<any[]>('/assets/mock-data/orders.json').pipe(
      delay(200),
      map(orders => {
        const order = orders.find(o => o.id === id);
        if (!order) return new HttpResponse({ status: 404, body: null });
        const now = new Date().toISOString();
        const timeline = [
          ...(order.timeline || []),
          { status, timestamp: now, note: note || `Status updated to ${status}`, completed: true }
        ];
        const updated = { ...order, status, timeline };
        return new HttpResponse({ status: 200, body: updated });
      })
    );
  }

  /* ── Orders: PATCH /api/orders/:id (legacy status update) ── */
  if (orderIdMatch && method === 'PATCH') {
    const id = parseInt(orderIdMatch[1]);
    const { status, note } = req.body as any;
    return http.get<any[]>('/assets/mock-data/orders.json').pipe(
      delay(200),
      map(orders => {
        const order = orders.find(o => o.id === id);
        if (!order) return new HttpResponse({ status: 404, body: null });
        const now = new Date().toISOString();
        const timeline = [
          ...(order.timeline || []),
          { status, timestamp: now, note: note || `Status updated to ${status}`, completed: true }
        ];
        const updated = { ...order, status, timeline };
        return new HttpResponse({ status: 200, body: updated });
      })
    );
  }

  /* ── Orders: GET /api/orders (scoped list) ── */
  if (url.startsWith('/api/orders') && method === 'GET' && !url.match(/\/api\/orders\/\d+/)) {
    const user = currentUser(authService);
    if (!user) return of(new HttpResponse({ status: 401, body: [] }));

    return http.get<any[]>('/assets/mock-data/orders.json').pipe(
      delay(200),
      map(orders => {
        let filtered: any[];

        if (user.role === 'admin') {
          filtered = orders;
        } else if (user.role === 'seller') {
          filtered = orders.filter(o =>
            o.sellerId === user.id ||
            o.items?.some((item: any) => item.product?.sellerId === user.id)
          );
        } else {
          filtered = orders.filter(o => o.userId === user.id);
        }

        // Apply query param filters
        const params = req.params;
        const status = params.get('status');
        const search = params.get('search');

        if (status && status !== 'all') {
          filtered = filtered.filter(o => o.status === status);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(o =>
            String(o.id).includes(q) ||
            o.shippingAddress?.city?.toLowerCase().includes(q)
          );
        }

        // Sort by createdAt desc
        filtered = [...filtered].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return new HttpResponse({ status: 200, body: filtered });
      })
    );
  }

  /* ── Payment Intent ── */
  if (url === '/api/payment/create-intent' && method === 'POST') {
    const body = req.body as any;
    if (body?.simulateDecline) {
      return of(new HttpResponse({ status: 402, body: { error: { message: 'Your card was declined.' } } })).pipe(delay(400));
    }
    const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`;
    return of(new HttpResponse({
      status: 200,
      body: { clientSecret: mockClientSecret, amount: body?.amount || 0, currency: body?.currency || 'usd' }
    })).pipe(delay(350));
  }

  /* ── Seller Profile ── */
  const sellerMatch = url.match(/\/api\/sellers\/(\d+)/);
  if (sellerMatch && method === 'GET') {
    const id = parseInt(sellerMatch[1]);
    return http.get<any>('/assets/mock-data/users.json').pipe(
      delay(200),
      map(data => {
        const user = data.users.find((u: any) => u.id === id);
        if (!user) return new HttpResponse({ status: 404, body: null });
        return new HttpResponse({
          status: 200,
          body: {
            userId: user.id,
            shopName: `${user.name}'s Shop`,
            description: 'Quality products at great prices.',
            logoUrl: user.avatar || '',
            bankDetails: { accountName: user.name, accountNumber: '****1234', bank: 'Mock Bank' },
            rating: 4.5,
            totalSales: 120,
            totalEarnings: 8500,
            pendingPayout: 450,
            status: user.status || 'active',
          }
        });
      })
    );
  }

  return next(req);
};
