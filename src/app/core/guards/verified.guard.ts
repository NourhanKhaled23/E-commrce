import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const verifiedGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    return router.parseUrl('/auth/login');
  }
  if (user.pendingVerification) {
    return router.parseUrl('/verify-email');
  }
  return true;
};
