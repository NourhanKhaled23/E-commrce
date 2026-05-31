import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (allowedRoles.includes(auth.role())) return true;
    return router.parseUrl('/unauthorized');
  };
};