import { Component, ChangeDetectionStrategy, signal, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RateLimitService } from '../../core/services/rate-limit.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  googleLoading = signal(false);

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rateLimit = inject(RateLimitService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnDestroy(): void {
  }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }

    const { email } = this.loginForm.value;
    if (!this.rateLimit.isAllowed(`login_${email}`)) {
      const resetTime = this.rateLimit.getResetTime(`login_${email}`);
      this.errorMessage.set(`Too many login attempts. Please try again in ${Math.ceil(resetTime / 60)} minutes.`);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email: emailAddr, password } = this.loginForm.value;
    this.authService.login(emailAddr, password).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.rateLimit.reset(`login_${emailAddr}`);
        if (user.pendingVerification) {
          this.router.navigate(['/verify-email']);
        } else {
          this.router.navigate(['/products']);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || err?.message || 'Invalid email or password');
      }
    });
  }

  mockGoogleSignIn(): void {
    this.googleLoading.set(true);
    this.errorMessage.set('');
    const mockEmail = 'customer@openfashion.com';
    this.authService.login(mockEmail, 'customer123').subscribe({
      next: () => { this.googleLoading.set(false); this.router.navigate(['/products']); },
      error: () => {
        this.googleLoading.set(false);
        this.errorMessage.set('Google sign-in unavailable. Use email login instead.');
      }
    });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  get f() { return this.loginForm.controls; }
}
