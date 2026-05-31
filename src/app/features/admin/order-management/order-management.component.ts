import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { DialogService } from '../../../core/services/dialog.service';

const STATUS_ORDER = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(DialogService);
  readonly orders = this.admin.orders;
  readonly statusFilter = signal('');
  readonly searchQuery = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly expandedOrder = signal<number | null>(null);
  readonly STATUSES = STATUS_ORDER;
  readonly sortField = signal('id');
  readonly sortDir = signal<'asc'|'desc'>('desc');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filteredOrders = computed(() => {
    return this.orders().filter(o => {
      if (this.statusFilter() && o.status !== this.statusFilter()) return false;
      if (this.dateFrom() && o.createdAt && o.createdAt < this.dateFrom()) return false;
      if (this.dateTo() && o.createdAt) {
        const endDate = this.dateTo() + 'T23:59:59Z';
        if (o.createdAt > endDate) return false;
      }
      if (this.searchQuery()) {
        if (!String(o.id).includes(this.searchQuery())) return false;
      }
      return true;
    }).sort((a, b) => {
      const key = this.sortField();
      const va = (a as any)[key] ?? '';
      const vb = (b as any)[key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalOrders = computed(() => this.filteredOrders().length);
  readonly paginatedOrders = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });
  readonly paginationStart = computed(() => (this.page() - 1) * this.pageSize + 1);
  readonly paginationEnd = computed(() => Math.min(this.page() * this.pageSize, this.totalOrders()));

  readonly pageNumbers = computed(() => {
    const tp = Math.max(1, Math.ceil(this.totalOrders() / this.pageSize));
    const p = this.page();
    const pages: number[] = [];
    const start = Math.max(1, p - 2);
    const end = Math.min(tp, p + 2);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push(0);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < tp - 1) pages.push(0);
    if (end < tp) pages.push(tp);
    return pages;
  });

  ngOnInit(): void { this.admin.loadAll(); }

  sort(field: string): void {
    if (this.sortField() === field) { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }

  getAvailableStatuses(current: string): string[] {
    const idx = STATUS_ORDER.indexOf(current);
    if (idx === -1 || current === 'delivered' || current === 'cancelled') return [current];
    return STATUS_ORDER.slice(idx, idx + 2);
  }

  toggleExpand(id: number): void {
    this.expandedOrder.update(v => v === id ? null : id);
  }

  async updateStatus(id: number, status: string): Promise<void> {
    if (status === 'cancelled') {
      const order = this.orders().find(o => o.id === id);
      const confirmed = await this.dialog.open('Cancel Order', `Are you sure you want to cancel order #${id}${order ? ' (' + order.id + ')' : ''}? This action cannot be undone.`, { confirmLabel: 'Cancel Order', cancelLabel: 'Go Back', danger: true });
      if (!confirmed) return;
    }
    const note = 'Status changed to ' + status + ' by admin';
    this.admin.updateOrderStatus(id, status, note).subscribe(() => {
      this.admin.orders.update(orders => orders.map(o => o.id === id ? { ...o, status: status as any } : o));
    });
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  exportCsv(): void {
    const orders = this.filteredOrders();
    const headers = ['Order ID', 'Date', 'Status', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment', 'City', 'Country', 'Promo Code', 'User ID'];
    const rows = orders.map(o => [
      o.id,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
      o.status,
      (o.items || []).map(i => `${i.product.name} x${i.quantity}`).join('; '),
      o.subtotal.toFixed(2),
      o.discount.toFixed(2),
      o.totalAmount.toFixed(2),
      o.paymentMethod,
      o.shippingAddress?.city || '',
      o.shippingAddress?.country || '',
      o.promoCode || '',
      o.userId || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
