import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <h1>Reset Password</h1>
          <p class="auth-subtitle">Enter your email and we'll send you a reset link</p>
        </div>

        @if (submitted()) {
          <div class="auth-success">
            <i class="bi bi-check-circle"></i>
            If an account exists with that email, you'll receive a password reset link shortly.
          </div>
        } @else {
          @if (errorMessage()) {
            <div class="auth-error">
              <i class="bi bi-exclamation-circle"></i> {{ errorMessage() }}
            </div>
          }

          <form class="auth-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" type="email" class="form-control" [(ngModel)]="email" name="email"
                     placeholder="you@example.com" required autocomplete="email">
            </div>
            <button type="submit" class="auth-submit btn-primary-of" [disabled]="loading() || !email">
              @if (loading()) {
                <span class="btn-spinner"></span> Sending...
              } @else {
                <i class="bi bi-envelope"></i> Send Reset Link
              }
            </button>
          </form>
        }

        <div class="divider-decorated"><span class="diamond"></span></div>
        <p class="auth-switch">Remember your password? <a routerLink="/auth/login">Back to Login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 200px); padding: 40px 16px; }
    .auth-card { width: 100%; max-width: 420px; padding: 40px 32px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
    .auth-brand { text-align: center; margin-bottom: 32px; }
    .auth-brand h1 { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 400; letter-spacing: 0.04em; margin-bottom: 8px; }
    .auth-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 0; }
    .auth-error { background: var(--color-danger-bg); border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent); color: var(--color-danger); padding: 12px 16px; font-size: 13px; margin-bottom: 24px; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
    .auth-success { background: var(--color-success-bg); border: 1px solid color-mix(in srgb, var(--color-success) 20%, transparent); color: var(--color-success); padding: 12px 16px; font-size: 13px; margin-bottom: 24px; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
    .auth-form { margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: var(--color-text-body); margin-bottom: 6px; text-transform: uppercase; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 14px; background: var(--color-bg-surface); transition: border-color 0.2s; }
    .form-control:focus { outline: none; border-color: var(--color-accent); }
    .auth-submit { width: 100%; margin-top: 8px; }
    .btn-primary-of { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--color-accent); color: var(--color-primary); padding: 12px 24px; border-radius: var(--radius-xs); font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; width: 100%; }
    .btn-primary-of:hover { background: var(--color-accent-dark); }
    .btn-primary-of:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider-decorated { display: flex; align-items: center; gap: 16px; margin: 20px 0; }
    .divider-decorated::before, .divider-decorated::after { content: ''; flex: 1; height: 1px; background: var(--color-border); }
    .diamond { width: 6px; height: 6px; background: var(--color-accent); transform: rotate(45deg); flex-shrink: 0; }
    .auth-switch { text-align: center; font-size: 13px; color: var(--color-text-muted); margin: 0; }
    .auth-switch a { color: var(--color-accent); font-weight: 500; text-decoration: none; }
    .auth-switch a:hover { text-decoration: underline; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  email = '';
  loading = signal(false);
  submitted = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {}

  onSubmit(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.errorMessage.set('');

    // Mock: simulate sending reset email
    setTimeout(() => {
      this.loading.set(false);
      this.submitted.set(true);
      this.toast.show('Password reset link sent!', 'success');
    }, 1500);
  }
}
