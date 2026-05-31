import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Global HTTP error interceptor.
 * Catches all HTTP errors and shows a user-friendly toast notification.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred.';

      if (error.status === 0) {
        message = 'Network error. Please check your connection.';
      } else if (error.status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (error.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        message = 'The requested resource was not found.';
      } else if (error.status === 409) {
        message = error.error?.message || 'A conflict occurred. This resource may already exist.';
      } else if (error.status === 422) {
        message = error.error?.message || 'Please check your input and try again.';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (error.error?.message) {
        message = error.error.message;
      }

      // Don't show toast for certain endpoints that handle errors themselves
      const silentUrls = ['/api/auth/login', '/api/promo-codes/validate'];
      const isSilent = silentUrls.some(u => req.url.includes(u));

      if (!isSilent) {
        toast.show(message, 'error');
      }

      return throwError(() => error);
    })
  );
};
