import { Component, HostListener, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NewsletterSignupComponent } from './shared/components/newsletter-signup/newsletter-signup.component';
import { ErrorBoundaryComponent } from './shared/components/error-boundary/error-boundary.component';
import { NewsletterService } from './core/services/newsletter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterModule, NavbarComponent, FooterComponent, ToastContainerComponent, ConfirmDialogComponent, TranslateModule, NewsletterSignupComponent, ErrorBoundaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly newsletterService = inject(NewsletterService);
  protected newsletterEmail = signal('');
  protected isAdminRoute = signal(false);
  protected isSellerRoute = signal(false);

  constructor(private translate: TranslateService) {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const url = e.urlAfterRedirects;
        this.isAdminRoute.set(url.startsWith('/admin'));
        this.isSellerRoute.set(url.startsWith('/seller'));
      }
    });
    const saved = localStorage.getItem('lang') || 'en';
    translate.setDefaultLang('en');
    translate.use(saved);
  }

  protected showBackToTop = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.showBackToTop.set(window.scrollY > 400);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  subscribeNewsletter(): void {
    if (!this.newsletterEmail().trim()) return;
    const success = this.newsletterService.subscribe(this.newsletterEmail());
    if (success) {
      this.newsletterEmail.set('');
    }
  }
}
