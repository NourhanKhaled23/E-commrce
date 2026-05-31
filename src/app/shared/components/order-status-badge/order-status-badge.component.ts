import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, ORDER_STATUS_CONFIG } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-status-badge.component.html',
  styleUrls: ['./order-status-badge.component.scss']
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();
  protected config = () => ORDER_STATUS_CONFIG[this.status()] || ORDER_STATUS_CONFIG.placed;
}