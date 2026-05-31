import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, OrderStatus } from '../models/order.model';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Observable } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = '/api/orders';
  private _orders = signal<Order[]>([]);
  private _loading = signal(false);

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly userOrders = computed(() => {
    const user = this.authService.user();
    if (!user) return [];
    return this._orders().filter(o => o.userId === user.id);
  });

  constructor() {
    const user = this.authService.user();
    if (user) {
      this.loadOrders();
    }
  }

  loadOrders(): void {
    const user = this.authService.user();
    if (!user) return;

    this._loading.set(true);
    let url = this.apiUrl;
    if (user.role === 'seller') {
      url = `${this.apiUrl}?sellerId=${user.id}`;
    } else if (user.role === 'customer') {
      url = `${this.apiUrl}?userId=${user.id}`;
    }
    // admin gets all orders (no query params)

    this.http.get<Order[]>(url).subscribe({
      next: (ords) => { this._orders.set(ords); this._loading.set(false); },
      error: () => this._loading.set(false)
    });
  }

  getById(id: number): Order | undefined {
    return this._orders().find(o => o.id === id);
  }

  getByIdSignal(id: number) {
    return computed(() => this._orders().find(o => o.id === id));
  }

  getOrderById(id: number): Observable<Order | undefined> {
    // Check in-memory signal first (covers freshly placed orders that aren't
    // in the mock JSON file yet)
    const cached = this._orders().find(o => o.id === id);
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }
    return this.http.get<Order[]>(this.apiUrl).pipe(
      map(orders => orders.find(o => o.id === id))
    );
  }

  /** Prepend a newly placed order to the in-memory signal. */
  addOrder(order: Order): void {
    this._orders.update(list => {
      // Avoid duplicates if called more than once
      if (list.some(o => o.id === order.id)) return list;
      return [order, ...list];
    });
    const user = this.authService.user();
    if (user) {
      this.toastService.sendEmail(
        user.email,
        `Order #${order.id} Confirmed`,
        `Your order #${order.id} for $${order.totalAmount.toFixed(2)} has been placed successfully.`
      );
    }
  }

  updateStatus(orderId: number, newStatus: OrderStatus, note?: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}`, { status: newStatus, note }).pipe(
      delay(300),
      tap(updated => {
        this._orders.update(list => list.map(o => o.id === orderId ? updated : o));
        const user = this.authService.user();
        if (user) {
          this.toastService.sendEmail(user.email, `Order #${orderId} Updated`,
            `Your order #${orderId} status has been updated to: ${newStatus}.`);
        }
      })
    );
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.updateStatus(orderId, 'cancelled', 'Order cancelled by customer');
  }

  canCancel(order: Order): boolean {
    return order.status === 'placed' || order.status === 'confirmed';
  }
}