import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  earnings: 'Earnings',
  setup: 'Shop Settings',
};

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seller-layout.component.html',
  styleUrls: ['./seller-layout.component.scss']
})
export class SellerLayoutComponent {
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
