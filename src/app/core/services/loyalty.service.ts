import { Injectable, inject, effect, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { OrderService } from './order.service';
import { NotificationService } from './notification.service';
import { CartService } from './cart.service';

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold';

export interface LoyaltyHistoryEntry {
  date: string;
  orderId: number;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly cartService = inject(CartService);

  readonly points = computed(() => this.authService.user()?.loyaltyPoints || 0);

  readonly tier = computed<LoyaltyTier>(() => {
    const p = this.points();
    if (p >= 5000) return 'Gold';
    if (p >= 2000) return 'Silver';
    return 'Bronze';
  });

  readonly nextTier = computed(() => {
    const t = this.tier();
    if (t === 'Bronze') return 2000;
    if (t === 'Silver') return 5000;
    return Infinity;
  });

  readonly pointsToNextTier = computed(() => {
    const next = this.nextTier();
    if (next === Infinity) return 0;
    return Math.max(0, next - this.points());
  });

  readonly tierProgress = computed(() => {
    const t = this.tier();
    const p = this.points();
    if (t === 'Gold') return 100;
    const floor = t === 'Silver' ? 2000 : 0;
    const ceiling = t === 'Silver' ? 5000 : 2000;
    return Math.round(((p - floor) / (ceiling - floor)) * 100);
  });

  readonly history = computed<LoyaltyHistoryEntry[]>(() => {
    const user = this.authService.user();
    if (!user) return [];
    try {
      const key = `loyalty_history_${user.id}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  /** How much $1 discount per 100 points */
  readonly POINTS_PER_DOLLAR = 100;

  // Signal to hold the loyalty discount amount applied to cart
  private _loyaltyDiscount = signal(0);
  readonly loyaltyDiscount = this._loyaltyDiscount.asReadonly();

  // Tracks which order IDs have already been awarded points — avoids re-running
  // the award logic on every unrelated signal change (e.g. profile updates).
  private _awardedOrderIds = signal<number[]>([]);

  constructor() {
    // Restore previously awarded order IDs from localStorage on startup
    const user = this.authService.user();
    if (user) {
      try {
        const stored = localStorage.getItem(`loyalty_awarded_orders_${user.id}`);
        if (stored) this._awardedOrderIds.set(JSON.parse(stored));
      } catch { /* ignore */ }
    }

    // effect() only reacts to orderService.orders() — NOT to authService.user().
    // This prevents re-triggering on every profile update (address, name, etc.).
    effect(() => {
      const orders = this.orderService.orders();
      const currentUser = this.authService.user();
      if (!currentUser) return;

      const deliveredOrders = orders.filter(
        o => o.userId === currentUser.id && o.status === 'delivered'
      );
      if (deliveredOrders.length === 0) return;

      const alreadyAwarded = this._awardedOrderIds();
      const newOrders = deliveredOrders.filter(o => !alreadyAwarded.includes(o.id));
      if (newOrders.length === 0) return;

      let pointsToAdd = 0;
      const newAwardedIds = [...alreadyAwarded];
      const newHistory: LoyaltyHistoryEntry[] = [];

      for (const order of newOrders) {
        const earned = Math.floor(order.totalAmount) * 10;
        pointsToAdd += earned;
        newAwardedIds.push(order.id);
        newHistory.push({
          date: new Date().toISOString(),
          orderId: order.id,
          type: 'earned',
          points: earned,
          description: `Earned from Order #${order.id}`,
        });
      }

      if (pointsToAdd > 0) {
        // Update the signal first — this does NOT trigger this effect again
        // because this effect only reads orderService.orders(), not _awardedOrderIds.
        this._awardedOrderIds.set(newAwardedIds);
        localStorage.setItem(
          `loyalty_awarded_orders_${currentUser.id}`,
          JSON.stringify(newAwardedIds)
        );
        this.addHistoryEntries(currentUser.id, newHistory);

        // updateProfile() updates authService._user signal, but since this effect
        // does NOT read authService.user(), it will NOT re-trigger.
        this.authService.updateProfile({
          loyaltyPoints: (currentUser.loyaltyPoints || 0) + pointsToAdd,
        }).subscribe({
          next: () => {
            this.notificationService.show(
              `You earned ${pointsToAdd} loyalty points!`,
              'success'
            );
          },
          error: (err) => console.error('Failed to update loyalty points:', err),
        });
      }
    }, { allowSignalWrites: true });
  }

  awardPoints(orderId: number, amount: number): void {
    const user = this.authService.user();
    if (!user) return;

    const earned = Math.floor(amount * 10);
    const entry: LoyaltyHistoryEntry = {
      date: new Date().toISOString(),
      orderId,
      type: 'earned',
      points: earned,
      description: `Earned from Order #${orderId}`
    };

    this.addHistoryEntries(user.id, [entry]);
    this.authService.updateProfile({
      loyaltyPoints: (user.loyaltyPoints || 0) + earned
    }).subscribe();
  }

  redeemPoints(points: number): number {
    const user = this.authService.user();
    if (!user || points <= 0 || points > this.points()) return 0;

    // Round down to nearest multiple of POINTS_PER_DOLLAR
    const redeemable = Math.floor(points / this.POINTS_PER_DOLLAR) * this.POINTS_PER_DOLLAR;
    if (redeemable <= 0) return 0;

    const discount = redeemable / this.POINTS_PER_DOLLAR;

    const entry: LoyaltyHistoryEntry = {
      date: new Date().toISOString(),
      orderId: 0,
      type: 'redeemed',
      points: redeemable,
      description: `Redeemed ${redeemable} pts for $${discount} discount`
    };

    this.addHistoryEntries(user.id, [entry]);
    this._loyaltyDiscount.set(discount);
    // Sync the discount into CartService so finalTotal() reflects it immediately
    this.cartService.applyLoyaltyDiscount(discount);

    this.authService.updateProfile({
      loyaltyPoints: (user.loyaltyPoints || 0) - redeemable
    }).subscribe({
      next: () => {
        this.notificationService.show(
          `Redeemed ${redeemable} points for $${discount.toFixed(2)} off!`,
          'success'
        );
      }
    });

    return discount;
  }

  clearLoyaltyDiscount(): void {
    this._loyaltyDiscount.set(0);
  }

  private addHistoryEntries(userId: number, entries: LoyaltyHistoryEntry[]): void {
    const key = `loyalty_history_${userId}`;
    let existing: LoyaltyHistoryEntry[] = [];
    try {
      existing = JSON.parse(localStorage.getItem(key) || '[]');
    } catch { /* empty */ }
    const updated = [...entries, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(key, JSON.stringify(updated));
  }
}
