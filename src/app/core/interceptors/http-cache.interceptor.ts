import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const cache = new Map<string, { response: HttpResponse<any>; expiry: number }>();
const DEFAULT_TTL = 30 * 1000; // 30 seconds — prevents stale data after admin edits

/**
 * HTTP Cache Interceptor — caches GET requests for static/mock data.
 */
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const skipCache = ['/api/auth', '/api/users', '/api/orders', '/api/payouts'];
  if (skipCache.some(u => req.url.includes(u))) return next(req);

  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    return of(cached.response.clone());
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.body) {
        cache.set(cacheKey, {
          response: event.clone(),
          expiry: Date.now() + DEFAULT_TTL,
        });
      }
    })
  );
};

export function clearHttpCache(): void {
  cache.clear();
}

export function clearCacheFor(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}
