import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  banners: 'Banners',
  'promo-codes': 'Promo Codes',
  newsletter: 'Newsletter',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  get pageTitle(): string {
    const seg = this.router.url.split('/').pop() || 'dashboard';
    return ROUTE_TITLES[seg] || seg;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
