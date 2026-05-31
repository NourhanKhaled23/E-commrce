import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from '../services/csrf.service';

/**
 * CSRF interceptor — attaches CSRF token to state-changing requests.
 */
export const csrfInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const csrf = inject(CsrfService);

  // Only attach CSRF to state-changing requests (not GET/HEAD/OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next(req);
  }

  // Skip CSRF for auth endpoints (login/register don't need it)
  if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
    return next(req);
  }

  const token = csrf.getToken();
  if (!token) return next(req);

  const csrfReq = req.clone({
    setHeaders: { 'X-CSRF-Token': token }
  });

  return next(csrfReq);
};
