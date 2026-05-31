import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { PromoCode } from '../models/order.model';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private _items = signal<CartItem[]>([]);
  private _promo = signal<PromoCode | null>(null);
  private _appliedCode = signal<string>('');
  private _loyaltyDiscount = signal(0);
  private _currentUserId: number | string = 'guest';

  readonly cartItems = this._items.asReadonly();
  readonly cartCount = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly count = this.cartCount;
  readonly cartTotal = computed(() => this._items().reduce((s, i) => s + i.product.price * i.quantity, 0));
  readonly discount = computed(() => {
    const p = this._promo();
    if (!p) return 0;
    const t = this.cartTotal();
    if (p.minAmount > 0 && t < p.minAmount) return 0;
    return p.type === 'percentage' ? t * p.value / 100 : Math.min(p.value, t);
  });
  readonly loyaltyDiscount = this._loyaltyDiscount.asReadonly();
  readonly finalTotal = computed(() => Math.max(0, this.cartTotal() - this.discount() - this._loyaltyDiscount()));
  readonly appliedCode = this._appliedCode.asReadonly();
  readonly promo = this._promo.asReadonly();

  private get cartKey(): string {
    return `cart_user_${this._currentUserId}`;
  }

  constructor() {
    // Subscribe to auth events instead of injecting AuthService in a circular way
    const destroyRef = inject(DestroyRef);
    const sub = this.authService.events$.subscribe(event => {
      switch (event.type) {
        case 'login':
        case 'session_restore':
          this._currentUserId = event.user?.id ?? 'guest';
          this.reloadCart();
          break;
        case 'logout':
          this.clearCartView();
          this._currentUserId = 'guest';
          break;
      }
    });
    destroyRef.onDestroy(() => sub.unsubscribe());

    // Initial load
    this._currentUserId = this.authService.user()?.id ?? 'guest';
    this.loadCart();
  }

  private loadCart(): void {
    const saved = localStorage.getItem(this.cartKey);
    if (saved) {
      try {
        this._items.set(JSON.parse(saved));
      } catch {
        this._items.set([]);
      }
    } else {
      this._items.set([]);
    }
  }

  private persistCart(): void {
    localStorage.setItem(this.cartKey, JSON.stringify(this._items()));
  }

  reloadCart(): void {
    this._items.set([]);
    this.loadCart();
  }

  clearCartView(): void {
    this._items.set([]);
  }

  addToCart(product: Product, quantity = 1): void {
    this._items.update(items => {
      const idx = items.findIndex(i => i.product.id === product.id);
      if (idx > -1) {
        const copy = [...items];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [...items, { product, quantity }];
    });
    this.persistCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) { this.removeFromCart(productId); return; }
    this._items.update(items =>
      items.map(item => {
        if (item.product.id !== productId) return item;
        const maxQty = item.product.stock ?? 99;
        const clamped = Math.min(quantity, maxQty);
        return { ...item, quantity: clamped };
      })
    );
    this.persistCart();
  }

  removeFromCart(productId: number): void {
    this._items.update(items => items.filter(i => i.product.id !== productId));
    this.persistCart();
  }

  clearCart(): void {
    this._items.set([]);
    this._promo.set(null);
    this._appliedCode.set('');
    this._loyaltyDiscount.set(0);
    this.persistCart();
  }

  applyPromo(code: string): Observable<{ valid: boolean; message: string }> {
    return this.http.get<PromoCode[]>(`/api/promos?code=${code}`).pipe(
      map(promos => {
        if (promos.length === 0) {
          this._promo.set(null);
          this._appliedCode.set('');
          return { valid: false, message: 'Invalid promo code' };
        }
        const p = promos[0];
        if (p.minAmount > 0 && this.cartTotal() < p.minAmount) {
          this._promo.set(null);
          this._appliedCode.set('');
          return { valid: false, message: `Minimum order of $${p.minAmount} required` };
        }
        this._promo.set(p);
        this._appliedCode.set(code);
        const saved = p.type === 'percentage' ? `${p.value}%` : `$${p.value}`;
        return { valid: true, message: `${saved} discount applied!` };
      })
    );
  }

  removePromo(): void {
    this._promo.set(null);
    this._appliedCode.set('');
  }

  applyLoyaltyDiscount(amount: number): void {
    this._loyaltyDiscount.set(amount);
  }

  clearLoyaltyDiscount(): void {
    this._loyaltyDiscount.set(0);
  }
}
