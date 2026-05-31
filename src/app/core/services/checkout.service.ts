import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaymentMethod, OrderRequest, Order } from '../models/order.model';
import { CartItem } from '../models/cart.model';
import { Address } from '../models/user.model';
import { Observable, throwError } from 'rxjs';
import { map, delay, switchMap, catchError } from 'rxjs/operators';
import { StripeService } from './stripe.service';

export type CheckoutStep = 1 | 2 | 3;

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly stripeService = inject(StripeService);

  private _step = signal<CheckoutStep>(1);
  private _shippingAddress = signal<Address | null>(null);
  private _paymentMethod = signal<PaymentMethod | null>(null);
  private _orderId = signal<number | null>(null);
  private _placedOrder = signal<Order | null>(null);
  private _guestEmail = signal<string>('');
  private _processing = signal(false);

  readonly step = this._step.asReadonly();
  readonly shippingAddress = this._shippingAddress.asReadonly();
  readonly paymentMethod = this._paymentMethod.asReadonly();
  readonly orderId = this._orderId.asReadonly();
  readonly placedOrder = this._placedOrder.asReadonly();
  readonly guestEmail = this._guestEmail.asReadonly();
  readonly processing = this._processing.asReadonly();
  readonly isLastStep = computed(() => this._step() === 3);

  setStep(s: CheckoutStep): void { this._step.set(s); }
  setShippingAddress(a: Address): void { this._shippingAddress.set(a); }
  setPaymentMethod(m: PaymentMethod): void { this._paymentMethod.set(m); }
  setGuestEmail(email: string): void { this._guestEmail.set(email); }

  /**
   * Full checkout flow for card payments:
   * 1. POST /api/payment/create-intent → get clientSecret
   * 2. stripe.confirmCardPayment(clientSecret, paymentMethodId)
   * 3. On success → POST /api/orders
   *
   * For non-card methods (paypal, cod, wallet) skip the Stripe step.
   */
  placeOrder(
    userId: number,
    items: CartItem[],
    subtotal: number,
    discount: number,
    totalAmount: number,
    promoCode?: string,
    stripePaymentMethodId?: string,
  ): Observable<Order> {
    if (!this._shippingAddress() || !this._paymentMethod()) {
      return throwError(() => new Error('Checkout incomplete: shipping address and payment method are required'));
    }

    this._processing.set(true);

    const paymentMethod = this._paymentMethod()!;
    const amountInCents = Math.round(totalAmount * 100);

    // ── Card payment: go through Stripe ──────────────────────────────────
    if (paymentMethod === 'card' && stripePaymentMethodId) {
      return this.http.post<{ clientSecret: string }>(
        '/api/payment/create-intent',
        { amount: amountInCents, currency: 'usd' }
      ).pipe(
        switchMap(({ clientSecret }) =>
          this.stripeService.confirmPayment(clientSecret, stripePaymentMethodId)
        ),
        catchError(err => {
          this._processing.set(false);
          return throwError(() => err);
        }),
        switchMap(() => this._createOrder(userId, items, subtotal, discount, totalAmount, promoCode)),
      );
    }

    // ── Non-card methods: skip Stripe, place order directly ───────────────
    return this._createOrder(userId, items, subtotal, discount, totalAmount, promoCode);
  }

  private _createOrder(
    userId: number,
    items: CartItem[],
    subtotal: number,
    discount: number,
    totalAmount: number,
    promoCode?: string,
  ): Observable<Order> {
    const body: OrderRequest = {
      userId, items, subtotal, discount, totalAmount,
      shippingAddress: this._shippingAddress()!,
      paymentMethod: this._paymentMethod()!,
      promoCode,
    };
    return this.http.post<Order>('/api/orders', body).pipe(
      delay(400),
      map(order => {
        this._orderId.set(order.id);
        this._placedOrder.set(order);
        this._step.set(3);
        this._processing.set(false);
        return order;
      })
    );
  }

  /** Reset only the processing flag (called on payment error) */
  clearProcessing(): void { this._processing.set(false); }

  reset(): void {
    this._step.set(1);
    this._shippingAddress.set(null);
    this._paymentMethod.set(null);
    this._orderId.set(null);
    this._placedOrder.set(null);
    this._guestEmail.set('');
    this._processing.set(false);
  }
}
