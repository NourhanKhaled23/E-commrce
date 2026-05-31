import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../core/models/user.model';
import { Order } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { map } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  activeUsers: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lowStockCount: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  readonly orders = signal<Order[]>([]);
  readonly products = signal<Product[]>([]);
  readonly users = signal<User[]>([]);
  readonly banners = signal<Banner[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  readonly stats = computed<DashboardStats>(() => {
    const allOrders = this.orders();
    const allProducts = this.products();
    const allUsers = this.users();
    const revenueByMonth = new Map<string, number>();

    for (const o of allOrders) {
      if (o.status === 'delivered' || o.status === 'shipped') {
        const m = o.createdAt ? o.createdAt.substring(0, 7) : 'unknown';
        revenueByMonth.set(m, (revenueByMonth.get(m) || 0) + o.totalAmount);
      }
    }

    const monthlyRevenue = Array.from(revenueByMonth.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue: allOrders.reduce((s, o) => s + o.totalAmount, 0),
      totalOrders: allOrders.length,
      totalProducts: allProducts.length,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.status !== 'restricted').length,
      pendingOrders: allOrders.filter(o => o.status === 'placed' || o.status === 'confirmed' || o.status === 'processing').length,
      shippedOrders: allOrders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
      deliveredOrders: allOrders.filter(o => o.status === 'delivered').length,
      cancelledOrders: allOrders.filter(o => o.status === 'cancelled').length,
      lowStockCount: allProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
      monthlyRevenue,
    };
  });

  readonly lowStockProducts = computed(() =>
    this.products().filter(p => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock)
  );

  readonly recentOrders = computed(() =>
    this.orders().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10)
  );

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      orders: this.http.get<Order[]>('/api/orders'),
      products: this.http.get<any>('/api/products').pipe(map(d => d.products)),
      users: this.http.get<any>('/api/users').pipe(map(d => d.users as User[])),
      banners: this.http.get<Banner[]>('/assets/mock-data/banners.json'),
      categories: this.http.get<Category[]>('/assets/mock-data/categories.json'),
    }).subscribe({
      next: ({ orders, products, users, banners, categories }) => {
        this.orders.set(orders ?? []);
        this.products.set(products ?? []);
        this.users.set((users ?? []).map(us => ({ ...us, status: (us as any).status || 'active' })));
        this.banners.set(banners ?? []);
        this.categories.set(categories ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleProductActive(id: number, active: boolean): Observable<Product> {
    return this.http.patch<Product>(`/api/products/${id}`, { active });
  }

  getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name || 'Unknown';
  }

  getSellerName(id: number): string {
    return this.users().find(u => u.id === id)?.name || 'Unknown';
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>('/api/products', product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${id}`);
  }

  updateUserStatus(id: number, status: string): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}`, { status });
  }

  updateUserRole(id: number, role: string): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}`, { role });
  }

  updateOrderStatus(id: number, status: string, note?: string): Observable<Order> {
    return this.http.patch<Order>(`/api/orders/${id}`, { status, note: note || `Status updated to ${status} by admin` });
  }

  saveBanner(banner: Banner): Observable<Banner> {
    return this.http.put<Banner>(`/api/banners/${banner.id}`, banner);
  }

  addBanner(banner: Partial<Banner>): Observable<Banner> {
    return this.http.post<Banner>('/api/banners', banner);
  }

  deleteBanner(id: number): Observable<void> {
    return this.http.delete<void>(`/api/banners/${id}`);
  }
}
