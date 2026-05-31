import { Component, OnInit, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../admin.service';
import { FeatureFlagService } from '../../../core/services/feature-flag.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  protected readonly featureFlags = inject(FeatureFlagService);
  readonly loading = this.admin.loading;
  readonly stats = this.admin.stats;
  readonly recentOrders = this.admin.recentOrders;
  readonly lowStockProducts = this.admin.lowStockProducts;
  readonly maxRevenue = computed(() => {
    const revs = this.stats().monthlyRevenue;
    return revs.length ? Math.max(...revs.map(r => r.revenue)) : 1;
  });

  readonly revenueByCategory = computed(() => {
    const orders = this.admin.orders();
    const catMap = new Map<string, number>();
    for (const o of orders) {
      if (o.status === 'delivered' || o.status === 'shipped') {
        for (const item of o.items || []) {
          const cat = item.product?.category || 'Unknown';
          catMap.set(cat, (catMap.get(cat) || 0) + (item.product?.price || 0) * item.quantity);
        }
      }
    }
    return Array.from(catMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  });

  readonly maxCatRevenue = computed(() => {
    const items = this.revenueByCategory();
    return items.length ? Math.max(...items.map(i => i.revenue)) : 1;
  });

  ngOnInit(): void {
    this.admin.loadAll();
  }
}
