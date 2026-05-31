import { Component, ChangeDetectionStrategy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <button class="back-to-top" (click)="scrollToTop()" aria-label="Back to top">
        <i class="bi bi-chevron-up"></i>
      </button>
    }
  `,
  styles: [`
    .back-to-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      z-index: 1000;
      transition: all 0.3s ease;
      animation: fadeInUp 0.3s ease;
    }
    .back-to-top:hover {
      background: var(--color-accent);
      color: var(--color-primary);
      border-color: var(--color-accent);
      transform: translateY(-3px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackToTopComponent {
  protected visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible.set(window.scrollY > 400);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
