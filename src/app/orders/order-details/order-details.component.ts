import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, ORDER_STATUS_FLOW, ORDER_STATUS_CONFIG } from '../../core/models/order.model';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [RouterModule, CommonModule, OrderStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
})
export class OrderDetailsComponent implements OnInit {
  protected order = signal<Order | null>(null);
  protected isLoading = signal(true);
  protected cancelling = signal(false);

  protected readonly statusFlow = ORDER_STATUS_FLOW;
  protected readonly statusConfig = ORDER_STATUS_CONFIG;

  protected readonly currentStepIndex = computed(() => {
    const o = this.order();
    if (!o) return -1;
    if (o.status === 'cancelled') return -2;
    return this.statusFlow.indexOf(o.status);
  });

  protected readonly canCancel = computed(() => {
    const o = this.order();
    return o ? this.orderService.canCancel(o) : false;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly orderService = inject(OrderService);
  protected readonly toastService = inject(ToastService);

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe({
        next: (o) => { this.order.set(o ?? null); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.router.navigate(['/orders']); }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o || !this.canCancel()) return;
    this.cancelling.set(true);
    this.orderService.cancelOrder(o.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.cancelling.set(false);
        this.toastService.show('Order cancelled successfully', 'info');
      },
      error: () => {
        this.cancelling.set(false);
        this.toastService.show('Failed to cancel order', 'error');
      }
    });
  }

  getItemCount(): number {
    return this.order()?.items.reduce((s, i) => s + i.quantity, 0) || 0;
  }
}