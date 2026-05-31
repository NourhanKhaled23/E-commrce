import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="error-boundary-page">
        <div class="error-content">
          <div class="error-icon"><i class="bi bi-exclamation-octagon"></i></div>
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-message">{{ error() }}</p>
          <div class="error-actions">
            <button class="btn-primary-of" (click)="retry()"><i class="bi bi-arrow-clockwise"></i> Try Again</button>
            <a routerLink="/" class="btn-outline-of"><i class="bi bi-house"></i> Go Home</a>
          </div>
        </div>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    .error-boundary-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 40vh; padding: 60px 20px; text-align: center;
    }
    .error-content { max-width: 480px; }
    .error-icon { font-size: 3rem; color: var(--color-danger); margin-bottom: 16px; }
    .error-title { font-family: var(--font-serif); font-size: 24px; color: var(--color-text-primary); margin: 0 0 8px; }
    .error-message { color: var(--color-text-muted); font-size: 14px; margin-bottom: 24px; }
    .error-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-primary-of {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--color-accent); color: var(--color-primary);
      padding: 10px 20px; border-radius: var(--radius-xs); font-size: 13px;
      font-weight: 700; cursor: pointer; border: none; text-decoration: none;
    }
    .btn-outline-of {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1px solid var(--color-border); color: var(--color-text-body);
      padding: 10px 20px; border-radius: var(--radius-xs); font-size: 13px;
      font-weight: 600; cursor: pointer; background: none; text-decoration: none;
    }
  `]
})
export class ErrorBoundaryComponent {
  private readonly router = inject(Router);
  error = signal<string | null>(null);

  retry(): void {
    this.error.set(null);
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      window.location.reload();
    });
  }
}
