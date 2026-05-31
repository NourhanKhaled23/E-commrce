import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ve-page">
      <div class="ve-card">
        <div class="ve-icon"><i class="bi bi-envelope-check"></i></div>
        <h1 class="ve-title">Verify Your Email</h1>
        <p class="ve-body">
          We sent a verification link to <strong>{{ authService.user()?.email }}</strong>.
          Please check your inbox and click the link to activate your account before continuing.
        </p>
        <p class="ve-note">Didn't receive it? Check your spam folder or resend below.</p>
        <button class="ve-resend-btn" (click)="resend()" [disabled]="resent() || cooldown() > 0">
          @if (cooldown() > 0) {
            Resend in {{ cooldown() }}s
          } @else if (resent()) {
            <i class="bi bi-check-circle"></i> Email Sent!
          } @else {
            <i class="bi bi-arrow-clockwise"></i> Resend Verification Email
          }
        </button>
        <div class="ve-links">
          <a routerLink="/products" class="ve-link-secondary">Browse Store</a>
          <button class="ve-link-secondary" (click)="logout()">Sign Out</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ve-page { min-height:80vh;display:flex;align-items:center;justify-content:center;padding:2rem; }
    .ve-card { max-width:480px;width:100%;text-align:center;padding:2.5rem;border:1px solid var(--color-border);border-radius:1rem;background:var(--color-bg); }
    .ve-icon { font-size:3.5rem;color:var(--color-accent);margin-bottom:1rem; }
    .ve-title { font-family:var(--font-heading);font-size:1.5rem;margin:0 0 1rem; }
    .ve-body { font-size:0.95rem;color:var(--color-text-secondary);line-height:1.6;margin-bottom:0.75rem; }
    .ve-note { font-size:0.85rem;color:var(--color-text-muted);margin-bottom:1.5rem; }
    .ve-resend-btn { display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.75rem;background:var(--color-accent);color:#fff;border:none;border-radius:0.5rem;font-size:0.9rem;font-weight:600;cursor:pointer;transition:opacity 0.2s;margin-bottom:1.5rem; }
    .ve-resend-btn:disabled { opacity:0.6;cursor:not-allowed; }
    .ve-resend-btn:not(:disabled):hover { opacity:0.88; }
    .ve-links { display:flex;justify-content:center;gap:1.5rem; }
    .ve-link-secondary { font-size:0.85rem;color:var(--color-text-muted);text-decoration:none;background:none;border:none;cursor:pointer;padding:0; }
    .ve-link-secondary:hover { color:var(--color-accent);text-decoration:underline; }
  `]
})
export class VerifyEmailComponent {
  protected readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected resent = signal(false);
  protected cooldown = signal(0);
  private cooldownTimer: any;

  resend(): void {
    // Simulate sending the email
    this.toast.show('Verification email sent!', 'success');
    this.resent.set(true);
    this.cooldown.set(60);
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update(c => {
        if (c <= 1) { clearInterval(this.cooldownTimer); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
  }
}
