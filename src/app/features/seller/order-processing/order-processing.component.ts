import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../core/services/seller.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="order-processing">
      <div class="page-header">
        <div>
          <h1><i class="bi bi-receipt"></i> Order Processing</h1>
          <p class="page-subtitle">Manage and fulfill customer orders</p>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs">
        @for (tab of statusTabs; track tab.value) {
          <button class="tab" [class.active]="activeTab() === tab.value"
                  (click)="activeTab.set(tab.value)">
            {{ tab.label }}
            <span class="tab-count">{{ getStatusCount(tab.value) }}</span>
          </button>
        }
      </div>

      <!-- Orders Table -->
      @if (displayedOrders().length === 0) {
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No orders in this category</p>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of displayedOrders(); track order.id) {
            <div class="order-card">
              <div class="order-card-header">
                <div class="order-meta">
                  <span class="order-id">#{{ order.id }}</span>
                  <span class="order-date">{{ order.createdAt | date:'medium' }}</span>
                </div>
                <span class="status-badge" [attr.data-status]="order.status">
                  {{ formatStatus(order.status) }}
                </span>
              </div>

              <div class="order-items">
                @for (item of getSellerItems(order); track item.product.id) {
                  <div class="order-item">
                    <img [src]="item.product.thumbnail" [alt]="item.product.name"
                         class="item-thumb" />
                    <div class="item-details">
                      <span class="item-name">{{ item.product.name }}</span>
                      <span class="item-qty">Qty: {{ item.quantity }}</span>
                    </div>
                    <span class="item-price">{{ item.product.price * item.quantity | currency }}</span>
                  </div>
                }
              </div>

              <div class="order-card-footer">
                <div class="order-total">
                  <span class="total-label">Seller Total:</span>
                  <span class="total-value">{{ getSellerTotal(order) | currency }}</span>
                </div>

                <div class="order-actions">
                  @if (order.status === 'confirmed') {
                    <button class="btn-action processing-btn"
                            (click)="updateStatus(order.id, 'processing')">
                      <i class="bi bi-gear"></i> Mark Processing
                    </button>
                  }
                  @if (order.status === 'processing') {
                    <button class="btn-action shipped-btn"
                            (click)="updateStatus(order.id, 'shipped')">
                      <i class="bi bi-truck"></i> Mark Shipped
                    </button>
                  }
                  @if (order.status === 'shipped' || order.status === 'delivered') {
                    <span class="fulfillment-done">
                      <i class="bi bi-check-circle-fill"></i>
                      {{ order.status === 'delivered' ? 'Delivered' : 'Shipped — awaiting delivery' }}
                    </span>
                  }
                  @if (order.status === 'placed') {
                    <span class="awaiting-note">
                      <i class="bi bi-hourglass-split"></i> Awaiting confirmation
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .order-processing { max-width: 1000px; }

    .page-header { margin-bottom: 24px; }
    .page-header h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 26px; font-weight: 700; color: #0D0D0D; margin-bottom: 4px;
    }
    .page-header h1 i { color: #C8A96E; margin-right: 10px; }
    .page-subtitle { color: #6B5C3E; font-size: 13px; margin: 0; }

    .status-tabs {
      display: flex; gap: 6px; margin-bottom: 24px;
      padding: 6px; background: #FFFFFF; border: 0.5px solid #E8E0D4; border-radius: 2px;
      overflow-x: auto;
    }
    .tab {
      padding: 9px 18px; border: none; background: transparent;
      border-radius: 2px; font-size: 13px; font-weight: 500;
      color: #6B5C3E; cursor: pointer; transition: all 200ms ease;
      white-space: nowrap; display: flex; align-items: center; gap: 8px;
    }
    .tab:hover { background: #F0EBE3; color: #1A1512; }
    .tab.active {
      background: #C8A96E;
      color: #0D0D0D; font-weight: 700;
    }
    .tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; border-radius: 2px;
      font-size: 11px; font-weight: 700;
      background: rgba(0,0,0,0.06);
    }
    .tab.active .tab-count { background: rgba(0,0,0,0.15); }

    .orders-list { display: flex; flex-direction: column; gap: 12px; }

    .order-card {
      background: #FFFFFF; border: 0.5px solid #E8E0D4; border-radius: 2px;
      overflow: hidden; transition: box-shadow 200ms ease;
    }
    .order-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

    .order-card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 0.5px solid #E8E0D4;
    }
    .order-meta { display: flex; align-items: center; gap: 16px; }
    .order-id { font-weight: 700; color: #0D0D0D; font-size: 14px; }
    .order-date { font-size: 13px; color: #6B5C3E; }

    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 2px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    }
    [data-status="placed"] { background: #E6F1FB; color: #0C447C; }
    [data-status="confirmed"] { background: #FAEEDA; color: #633806; }
    [data-status="processing"] { background: #FAEEDA; color: #633806; }
    [data-status="shipped"] { background: #EEEDFE; color: #3C3489; }
    [data-status="out_for_delivery"] { background: #FFF3E0; color: #E65100; }
    [data-status="delivered"] { background: #EAF3DE; color: #27500A; }
    [data-status="cancelled"] { background: #FCEBEB; color: #791F1F; }

    .order-items { padding: 14px 20px; }
    .order-item {
      display: flex; align-items: center; gap: 14px; padding: 10px 0;
    }
    .order-item:not(:last-child) { border-bottom: 0.5px solid #F0EBE3; }
    .item-thumb {
      width: 44px; height: 44px; object-fit: cover;
      border-radius: 4px; border: 0.5px solid #E8E0D4;
    }
    .item-details { flex: 1; display: flex; flex-direction: column; }
    .item-name { font-weight: 600; font-size: 13px; color: #0D0D0D; }
    .item-qty { font-size: 12px; color: #6B5C3E; }
    .item-price { font-weight: 600; color: #C8A96E; font-size: 13px; }

    .order-card-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 20px; background: #FAFAF8;
      border-top: 0.5px solid #E8E0D4;
    }
    .total-label { font-size: 13px; color: #6B5C3E; margin-right: 8px; }
    .total-value { font-size: 14px; font-weight: 700; color: #0D0D0D; }

    .order-actions { display: flex; align-items: center; gap: 10px; }

    .btn-action {
      padding: 7px 16px; border: none; border-radius: 2px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: all 200ms ease; display: flex; align-items: center; gap: 6px;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .processing-btn { background: #FAEEDA; color: #633806; }
    .processing-btn:hover { background: #F5DFC0; }
    .shipped-btn { background: #EAF3DE; color: #27500A; }
    .shipped-btn:hover { background: #D8EAC5; }

    .fulfillment-done {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500; color: #27500A;
    }
    .awaiting-note {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #6B5C3E; font-style: italic;
    }

    .empty-state {
      text-align: center; padding: 60px 20px; color: #6B5C3E;
      background: #FFFFFF; border: 0.5px solid #E8E0D4; border-radius: 2px;
    }
    .empty-state i { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 12px; }

    @media (max-width: 768px) {
      .status-tabs { gap: 4px; }
      .tab { padding: 8px 12px; font-size: 12px; }
      .order-card-footer { flex-direction: column; gap: 12px; align-items: flex-start; }
    }
  `]
})
export class OrderProcessingComponent implements OnInit {
  readonly seller = inject(SellerService);

  readonly statusTabs = [
    { label: 'All', value: 'all' },
    { label: 'Placed', value: 'placed' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  activeTab = signal<string>('all');

  readonly displayedOrders = computed(() => {
    const tab = this.activeTab();
    const orders = this.seller.myOrders();
    if (tab === 'all') return orders;
    return orders.filter(o => o.status === tab);
  });

  ngOnInit(): void {
    this.seller.loadMyOrders();
  }

  getStatusCount(status: string): number {
    if (status === 'all') return this.seller.myOrders().length;
    return this.seller.myOrders().filter(o => o.status === status).length;
  }

  getSellerItems(order: Order) {
    return order.items.filter(i => i.product.sellerId === this.seller.sellerId());
  }

  getSellerTotal(order: Order): number {
    return this.getSellerItems(order)
      .reduce((s, i) => s + i.product.price * i.quantity, 0);
  }

  formatStatus(status: OrderStatus): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  updateStatus(orderId: number, status: 'processing' | 'shipped'): void {
    this.seller.updateOrderStatus(orderId, status);
  }
}
