import { Component, ChangeDetectionStrategy, inject, signal, HostListener, DestroyRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductService } from '../../../core/services/product.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

interface NavCategory {
  name: string;
  slug: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule, UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly wishlistService = inject(WishlistService);
  protected readonly productService = inject(ProductService);
  protected readonly themeService = inject(ThemeService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly categoryService = inject(CategoryService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  protected currentLang = signal(this.translate.currentLang || 'en');
  protected userMenuOpen = signal(false);
  protected mobileMenuOpen = signal(false);
  protected searchOpen = signal(false);
  protected scrolled = signal(false);
  protected categoriesOpen = signal(false);
  protected readonly unreadCount = this.notificationService.unreadCount;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  protected categories: NavCategory[] = [
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Footwear', slug: 'footwear' },
    { name: 'Bags', slug: 'bags' },
    { name: 'Jewelry', slug: 'jewelry' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      this.userMenuOpen.set(false);
    }
    if (!target.closest('.mobile-menu-toggle') && !target.closest('.navbar-mobile')) {
      this.mobileMenuOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
    this.userMenuOpen.set(false);
  }

  toggleLanguage(): void {
    const next = this.currentLang() === 'en' ? 'ar' : 'en';
    this.translate.use(next);
    this.currentLang.set(next);
    const htmlTag = document.documentElement;
    htmlTag.setAttribute('lang', next);
    if (next === 'ar') {
      htmlTag.setAttribute('dir', 'rtl');
    } else {
      htmlTag.setAttribute('dir', 'ltr');
    }
    localStorage.setItem('lang', next);
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (this.searchTimeout) { clearTimeout(this.searchTimeout); }
    this.searchTimeout = setTimeout(() => {
      this.productService.updateFilter({ search: val });
    }, 300);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
  }

  closeSearch(): void {
    setTimeout(() => this.searchOpen.set(false), 200);
  }

  toggleCategories(): void {
    this.categoriesOpen.update(v => !v);
  }

  closeCategories(): void {
    this.categoriesOpen.set(false);
  }

  trackById(index: number): number {
    return index;
  }
}
