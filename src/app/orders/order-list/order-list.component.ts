import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order, OrderStatus, ORDER_STATUS_CONFIG } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, OrderStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
})
export class OrderListComponent {
  protected readonly orderService = inject(OrderService);
  protected readonly authService = inject(AuthService);

  protected statusFilter = signal<string>('all');
  protected sortDir = signal<'newest' | 'oldest'>('newest');

  protected readonly statuses = Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => ({ key, ...cfg }));

  protected readonly filteredOrders = computed(() => {
    let list = this.orderService.userOrders();
    const f = this.statusFilter();
    if (f !== 'all') list = list.filter(o => o.status === f);
    list = [...list].sort((a, b) => {
      const d = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return this.sortDir() === 'newest' ? d : -d;
    });
    return list;
  });

  protected getItemCount(order: Order): number {
    return order.items.reduce((s, i) => s + i.quantity, 0);
  }

  protected setFilter(s: string): void { this.statusFilter.set(s); }
  protected toggleSort(): void { this.sortDir.update(d => d === 'newest' ? 'oldest' : 'newest'); }
}