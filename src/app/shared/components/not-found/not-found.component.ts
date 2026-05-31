import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="nf-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h1 class="nf-code">404</h1>
        <h2 class="nf-title">Page Not Found</h2>
        <p class="nf-desc">The page you're looking for doesn't exist or has been moved.</p>
        <div class="nf-actions">
          <a routerLink="/" class="btn-primary-of"><i class="bi bi-house"></i> Back to Home</a>
          <a routerLink="/products" class="btn-outline-of"><i class="bi bi-grid"></i> Browse Products</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      display: flex; align-items: center; justify-content: center;
      min-height: 60vh; padding: 60px 20px; text-align: center;
    }
    .not-found-content { max-width: 480px; }
    .nf-icon { font-size: 3rem; color: var(--color-accent); margin-bottom: 24px; }
    .nf-code { font-family: var(--font-serif); font-size: 72px; font-weight: 700; color: var(--color-text-primary); margin: 0; line-height: 1; }
    .nf-title { font-family: var(--font-serif); font-size: 24px; color: var(--color-text-primary); margin: 16px 0 8px; }
    .nf-desc { color: var(--color-text-muted); font-size: 15px; margin-bottom: 32px; }
    .nf-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary-of {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--color-accent); color: var(--color-primary);
      padding: 12px 24px; border-radius: var(--radius-xs); font-size: 13px;
      font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      text-decoration: none; transition: background var(--transition-fast);
    }
    .btn-primary-of:hover { background: var(--color-accent-dark); }
    .btn-outline-of {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1px solid var(--color-border); color: var(--color-text-body);
      padding: 12px 24px; border-radius: var(--radius-xs); font-size: 13px;
      font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
      text-decoration: none; transition: all var(--transition-fast);
    }
    .btn-outline-of:hover { border-color: var(--color-accent); color: var(--color-accent); }
  `]
})
export class NotFoundComponent {}
