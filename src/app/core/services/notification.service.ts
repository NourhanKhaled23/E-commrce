import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isRead: boolean;
  timestamp: string;
  link?: string;     // optional route to navigate on click
  icon?: string;     // optional Bootstrap icon class
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  private nextId = 1;

  // Toast-style notifications (auto-dismiss, no persistence)
  private _toasts = signal<AppNotification[]>([]);
  readonly toasts = this._toasts.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  readonly recentNotifications = computed(() =>
    this._notifications().slice(0, 10)
  );

  constructor() {
    this.restoreHistory();
  }

  private restoreHistory(): void {
    try {
      const raw = localStorage.getItem('app_notifications');
      if (raw) {
        const parsed = JSON.parse(raw) as AppNotification[];
        this._notifications.set(parsed);
        this.nextId = parsed.reduce((max, n) => Math.max(max, n.id), 0) + 1;
      }
    } catch {
      localStorage.removeItem('app_notifications');
    }
  }

  private persist(): void {
    // Keep only last 50 notifications
    const list = this._notifications().slice(0, 50);
    localStorage.setItem('app_notifications', JSON.stringify(list));
  }

  /**
   * Show a toast notification AND persist to notification history.
   */
  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', options?: { link?: string; icon?: string; persist?: boolean }): void {
    const notif: AppNotification = {
      id: this.nextId++,
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString(),
      link: options?.link,
      icon: options?.icon
    };

    // Always show a toast
    this._toasts.update(list => [...list, notif]);

    // Persist to notification center (default: true)
    if (options?.persist !== false) {
      this._notifications.update(list => [notif, ...list]);
      this.persist();
    }
  }

  dismissToast(id: number): void {
    this._toasts.update(list => list.filter(n => n.id !== id));
  }

  markAsRead(id: number): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this.persist();
  }

  markAllAsRead(): void {
    this._notifications.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
    this.persist();
  }

  clearAll(): void {
    this._notifications.set([]);
    this.persist();
  }

  /** @deprecated Use show() instead */
  dismiss(id: number): void {
    this.dismissToast(id);
  }
}
