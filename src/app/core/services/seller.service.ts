import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { SellerProfile, Payout, MonthlyEarning } from '../models/seller.model';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /* ── State signals ── */
  readonly sellerProfile = signal<SellerProfile | null>(null);
  readonly myProducts = signal<Product[]>([]);
  readonly myOrders = signal<Order[]>([]);
  readonly payouts = signal<Payout[]>([]);
  readonly loading = signal(false);

  /* ── Computed ── */
  readonly sellerId = computed(() => this.auth.user()?.id ?? 0);

  readonly earnings = computed(() =>
    this.myOrders()
      .filter(o => o.status === 'delivered' || o.status === 'shipped')
      .reduce((sum, o) => {
        const sellerItems = o.items.filter(i => i.product.sellerId === this.sellerId());
        return sum + sellerItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
      }, 0)
  );

  readonly pendingOrdersCount = computed(() =>
    this.myOrders().filter(o =>
      o.status === 'placed' || o.status === 'confirmed' || o.status === 'processing'
    ).length
  );

  readonly monthlyRating = computed(() => {
    const profile = this.sellerProfile();
    return profile?.rating ?? 0;
  });

  readonly lowStockProducts = computed(() =>
    this.myProducts().filter(p => (p.active !== false) && p.stock > 0 && p.stock < 5)
      .sort((a, b) => a.stock - b.stock)
  );

  readonly recentOrders = computed(() =>
    this.myOrders()
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10)
  );

  readonly monthlyEarnings = computed<MonthlyEarning[]>(() => {
    const monthMap = new Map<string, { orders: number; revenue: number }>();
    const sid = this.sellerId();

    for (const order of this.myOrders()) {
      if (order.status === 'cancelled') continue;
      const m = order.createdAt ? order.createdAt.substring(0, 7) : 'unknown';
      const sellerTotal = order.items
        .filter(i => i.product.sellerId === sid)
        .reduce((s, i) => s + i.product.price * i.quantity, 0);

      const existing = monthMap.get(m) || { orders: 0, revenue: 0 };
      monthMap.set(m, {
        orders: existing.orders + 1,
        revenue: existing.revenue + sellerTotal,
      });
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue,
        platformFee: +(data.revenue * 0.10).toFixed(2),
        netPayout: +(data.revenue * 0.90).toFixed(2),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  });

  /* ── Data loading ── */
  loadMyProducts(): void {
    const id = this.sellerId();
    if (!id) return;
    this.loading.set(true);
    this.http.get<any>(`/api/products?sellerId=${id}`).pipe(
      map(res => (res.products ?? res) as Product[]),
      map(products => products.filter(p => p.sellerId === id)),
    ).subscribe({
      next: products => { this.myProducts.set(products); this.loading.set(false); },
      error: () => { this.toast.show('Failed to load products', 'error'); this.loading.set(false); },
    });
  }

  loadMyOrders(): void {
    const id = this.sellerId();
    if (!id) return;
    this.http.get<Order[]>(`/api/orders?sellerId=${id}`).subscribe({
      next: orders => {
        // filter to orders containing this seller's products
        const filtered = orders.filter(o =>
          o.items.some(i => i.product.sellerId === id)
        );
        this.myOrders.set(filtered);
      },
      error: () => this.toast.show('Failed to load orders', 'error'),
    });
  }

  loadAll(): void {
    this.loading.set(true);
    const id = this.sellerId();
    if (!id) { this.loading.set(false); return; }

    forkJoin({
      products: this.http.get<any>(`/api/products?sellerId=${id}`).pipe(
        map(res => (res.products ?? res) as Product[]),
        map(products => products.filter(p => p.sellerId === id)),
      ),
      orders: this.http.get<Order[]>(`/api/orders?sellerId=${id}`).pipe(
        map(orders => orders.filter(o => o.items.some(i => i.product.sellerId === id))),
      ),
    }).subscribe({
      next: ({ products, orders }) => {
        this.myProducts.set(products);
        this.myOrders.set(orders);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.toast.show('Failed to load data', 'error'); },
    });
  }

  loadSellerProfile(): void {
    const id = this.sellerId();
    if (!id) return;
    this.http.get<SellerProfile>(`/api/sellers/${id}`).subscribe({
      next: profile => this.sellerProfile.set(profile),
      error: () => {
        // No profile found — seller needs to onboard
        this.sellerProfile.set(null);
      },
    });
  }

  loadPayouts(): void {
    this.http.get<Payout[]>('/assets/mock-data/payouts.json').subscribe({
      next: payouts => {
        const mine = payouts.filter(p => p.sellerId === this.sellerId());
        this.payouts.set(mine.length ? mine : payouts.slice(0, 5));
      },
      error: () => this.payouts.set([]),
    });
  }

  /* ── Product CRUD ── */
  createProduct(product: Partial<Product>): Observable<Product> {
    const payload = { ...product, sellerId: this.sellerId(), active: true };
    return this.http.post<Product>('/api/products', payload).pipe(
      tap(created => {
        this.myProducts.update(list => [created, ...list]);
        this.toast.show('Product created successfully!', 'success');
      })
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, product).pipe(
      tap(updated => {
        this.myProducts.update(list => list.map(p => p.id === id ? updated : p));
        this.toast.show('Product updated successfully!', 'success');
      })
    );
  }

  deleteProduct(id: number): void {
    // Soft delete: set active = false
    this.http.patch<Product>(`/api/products/${id}`, { active: false }).subscribe({
      next: () => {
        this.myProducts.update(list => list.map(p => p.id === id ? { ...p, active: false } : p));
        this.toast.show('Product deactivated', 'info');
      },
      error: () => this.toast.show('Failed to delete product', 'error'),
    });
  }

  updateStock(id: number, stock: number): void {
    this.http.patch<Product>(`/api/products/${id}`, { stock }).subscribe({
      next: () => {
        this.myProducts.update(list => list.map(p => p.id === id ? { ...p, stock } : p));
        this.toast.show('Stock updated', 'success');
      },
      error: () => this.toast.show('Failed to update stock', 'error'),
    });
  }

  /* ── Order status ── */
  updateOrderStatus(orderId: number, status: 'processing' | 'shipped'): void {
    this.http.patch<Order>(`/api/orders/${orderId}`, {
      status,
      note: `Status updated to ${status} by seller`,
    }).subscribe({
      next: updated => {
        this.myOrders.update(list => list.map(o => o.id === orderId ? { ...o, status } : o));
        this.toast.show(`Order #${orderId} → ${status}`, 'success');
      },
      error: () => this.toast.show('Failed to update order', 'error'),
    });
  }

  /* ── Onboarding ── */
  submitOnboarding(profile: Partial<SellerProfile>): Observable<SellerProfile> {
    const payload: SellerProfile = {
      userId: this.sellerId(),
      shopName: profile.shopName || '',
      description: profile.description || '',
      logoUrl: profile.logoUrl || '',
      bankDetails: profile.bankDetails || { accountName: '', accountNumber: '', bank: '' },
      rating: 0,
      totalSales: 0,
      totalEarnings: 0,
      pendingPayout: 0,
      status: 'pending',
    };

    // Mock POST — returns the created profile
    return of(payload).pipe(
      delay(800),
      tap(created => {
        this.sellerProfile.set(created);
        this.toast.show('Seller profile submitted! Awaiting approval.', 'success');
      })
    );
  }

  /* ── Payout ── */
  requestPayout(): void {
    this.toast.show('Payout request submitted successfully! You will receive funds within 3-5 business days.', 'success');
  }
}
