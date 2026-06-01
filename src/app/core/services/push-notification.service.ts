import { Injectable, inject, effect, signal, isDevMode } from '@angular/core';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { SellerService } from './seller.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly sellerService = inject(SellerService);
  private readonly inAppNotif = inject(NotificationService);

  private _isPermitted = signal(false);
  readonly isPermitted = this._isPermitted.asReadonly();

  constructor() {
    this.checkPermissionStatus();

    // Send notifications on order status change
    effect(() => {
      const user = this.authService.user();
      if (!user) return;

      const orders = this.orderService.orders().filter(o => o.userId === user.id);
      if (orders.length === 0) return;

      const cacheKey = `push_order_status_cache_${user.id}`;
      let cachedStatuses: Record<number, string> = {};
      try {
        cachedStatuses = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      } catch {
        cachedStatuses = {};
      }

      let hasChanges = false;
      for (const order of orders) {
        const prevStatus = cachedStatuses[order.id];
        // If status changed and we had a previous recorded status, notify!
        if (prevStatus && prevStatus !== order.status) {
          const displayStatus = order.status.replace(/_/g, ' ');
          this.send(
            `Order #${order.id} Updated`,
            `Your order status is now: ${displayStatus}`,
            '/assets/logo.png',
            '/orders'
          );
          hasChanges = true;
        }
        cachedStatuses[order.id] = order.status;
      }

      if (hasChanges || Object.keys(cachedStatuses).length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(cachedStatuses));
      }
    });

    // Wire Low Stock alerts for sellers
    effect(() => {
      const role = this.authService.role();
      if (role !== 'seller') return;

      const products = this.sellerService.myProducts();
      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);
      
      const cacheKey = `push_low_stock_cache_${this.authService.user()?.id}`;
      let notifiedSet = new Set<number>();
      try {
        notifiedSet = new Set(JSON.parse(localStorage.getItem(cacheKey) || '[]'));
      } catch { /* empty */ }

      let hasChanges = false;
      for (const p of lowStockProducts) {
        if (!notifiedSet.has(p.id)) {
          this.send(
            `Low Stock Alert`,
            `Product "${p.name}" has only ${p.stock} units left!`,
            p.thumbnail,
            '/seller/dashboard'
          );
          notifiedSet.add(p.id);
          hasChanges = true;
        }
      }

      if (hasChanges || notifiedSet.size > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(notifiedSet)));
      }
    });
  }

  private checkPermissionStatus(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this._isPermitted.set(Notification.permission === 'granted');
    }
  }

  requestPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        this._isPermitted.set(permission === 'granted');
        if (permission === 'granted') {
          this.send('Welcome!', 'Notifications enabled successfully.');
        }
      });
    }
  }

  send(title: string, body: string, icon?: string, link?: string): void {
    // 1. Send native browser push notification
    if (this._isPermitted() && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const notif = new Notification(title, { body, icon });
        if (link) {
          notif.onclick = () => {
            window.focus();
            // In a real app we might route here, but simple window focus for mock
          };
        }
      } catch (err) {
        if (isDevMode()) console.error('Failed to create browser push notification:', err);
      }
    } else {
      if (isDevMode()) console.log(`Push Notification (fallback): [${title}] ${body}`);
    }

    // 2. Also save to in-app notification center
    this.inAppNotif.show(title + ': ' + body, 'info', { link, icon: 'bi-bell' });
  }
}
