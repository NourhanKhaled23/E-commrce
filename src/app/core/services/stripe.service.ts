import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/** Minimal typings for the Stripe.js v3 globals loaded via <script> tag */
declare const Stripe: (key: string) => StripeInstance;

interface StripeInstance {
  elements(options?: object): StripeElements;
  createPaymentMethod(options: {
    type: 'card';
    card: StripeCardElement;
    billing_details?: { name?: string };
  }): Promise<{ paymentMethod?: { id: string }; error?: StripeError }>;
  confirmCardPayment(
    clientSecret: string,
    data: { payment_method: string | { card: StripeCardElement; billing_details?: { name?: string } } }
  ): Promise<{ paymentIntent?: { id: string; status: string }; error?: StripeError }>;
}

interface StripeElements {
  create(type: 'card', options?: object): StripeCardElement;
}

export interface StripeCardElement {
  mount(selector: string | HTMLElement): void;
  unmount(): void;
  destroy(): void;
  on(event: string, handler: (e: StripeCardElementChangeEvent) => void): void;
}

export interface StripeCardElementChangeEvent {
  error?: StripeError;
  complete: boolean;
  empty: boolean;
}

export interface StripeError {
  message: string;
  type?: string;
  code?: string;
}

export interface PaymentMethodResult {
  paymentMethodId: string;
}

export interface PaymentConfirmResult {
  paymentIntentId: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class StripeService {
  private _stripe: StripeInstance | null = null;
  private _elements: StripeElements | null = null;
  private _cardElement: StripeCardElement | null = null;
  /** True when running with a placeholder key — all API calls are simulated */
  private _mockMode = false;

  /** Whether Stripe.js has loaded and been initialized */
  readonly initialized = signal(false);
  readonly initError = signal<string | null>(null);
  readonly isMockMode = () => this._mockMode;

  /**
   * Initialize Stripe. Called once when the payment page mounts.
   * Waits for window.Stripe to be available (loaded via <script async>).
   *
   * If the key is a placeholder, we enter "mock mode" — the card element
   * is replaced with a styled mock input and all API calls are simulated.
   */
  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = environment.stripePublishableKey;

      // ── Mock mode: no real key configured ────────────────────────────
      if (!key || key.startsWith('pk_test_YOUR') || key.startsWith('pk_live_YOUR')) {
        this._mockMode = true;
        this.initialized.set(true);
        resolve();
        return;
      }

      const tryInit = (attempts = 0) => {
        if (typeof (window as any)['Stripe'] === 'function') {
          try {
            this._stripe = Stripe(key);
            this._elements = this._stripe.elements({
              fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }],
            });
            this.initialized.set(true);
            resolve();
          } catch (e: any) {
            this.initError.set(e?.message || 'Stripe init failed');
            reject(e);
          }
        } else if (attempts < 20) {
          // Stripe.js is loaded async — retry up to 2 seconds
          setTimeout(() => tryInit(attempts + 1), 100);
        } else {
          const msg = 'Stripe.js failed to load. Check your internet connection.';
          this.initError.set(msg);
          reject(new Error(msg));
        }
      };
      tryInit();
    });
  }

  /**
   * Create and mount a Stripe card Element into the given DOM selector.
   * In mock mode, returns a no-op stub element (real input is rendered in the template).
   */
  mountCardElement(selector: string, options?: object): StripeCardElement {
    // Mock mode — return a stub; the template renders its own input fields
    if (this._mockMode) {
      const stub: StripeCardElement = {
        mount: () => {},
        unmount: () => {},
        destroy: () => {},
        on: () => {},
      };
      this._cardElement = stub;
      return stub;
    }

    if (!this._elements) throw new Error('Stripe not initialized. Call init() first.');
    if (this._cardElement) {
      try { this._cardElement.unmount(); } catch { /* ignore */ }
    }
    this._cardElement = this._elements.create('card', {
      style: {
        base: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          color: '#1a1a1a',
          '::placeholder': { color: '#9ca3af' },
          iconColor: '#DD8560',
        },
        invalid: { color: '#e53e3e', iconColor: '#e53e3e' },
      },
      hidePostalCode: true,
      ...options,
    });
    this._cardElement.mount(selector);
    return this._cardElement;
  }

  /** Destroy the mounted card element (call on component destroy) */
  destroyCardElement(): void {
    if (this._cardElement) {
      try { this._cardElement.destroy(); } catch { /* ignore */ }
      this._cardElement = null;
    }
  }

  /**
   * Create a PaymentMethod from the mounted card element.
   * Returns an Observable that emits the paymentMethodId on success.
   *
   * In mock mode (placeholder key), we return a fake paymentMethodId so the
   * full checkout flow can be tested without a real Stripe account.
   */
  createPaymentMethod(cardElement: StripeCardElement, billingName?: string): Observable<PaymentMethodResult> {
    // ── Mock mode ─────────────────────────────────────────────────────────
    if (this._mockMode) {
      return new Observable(observer => {
        setTimeout(() => {
          observer.next({ paymentMethodId: `pm_mock_${Date.now()}` });
          observer.complete();
        }, 300);
      });
    }

    if (!this._stripe) return throwError(() => new Error('Stripe not initialized'));

    // ── Real Stripe createPaymentMethod ───────────────────────────────────
    return from(
      this._stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingName ? { name: billingName } : undefined,
      })
    ).pipe(
      switchMap(result => {
        if (result.error) return throwError(() => result.error);
        return [{ paymentMethodId: result.paymentMethod!.id }];
      })
    );
  }

  /**
   * Confirm a card payment using a clientSecret from the server and a paymentMethodId.
   * Returns an Observable that emits the paymentIntentId on success.
   *
   * When the clientSecret starts with "pi_mock_" (our mock backend), we simulate
   * Stripe's response locally so the flow works end-to-end without a real Stripe account.
   * The test decline card (pm_card_visa_chargeDeclined) triggers a simulated decline.
   */
  confirmPayment(clientSecret: string, paymentMethodId: string): Observable<PaymentConfirmResult> {
    // ── Mock mode or mock client secret ───────────────────────────────────
    if (this._mockMode || clientSecret.startsWith('pi_mock_')) {
      const isDecline = paymentMethodId.toLowerCase().includes('decline') ||
                        paymentMethodId === 'pm_card_visa_chargeDeclined';
      if (isDecline) {
        return throwError(() => ({ message: 'Your card was declined.' }));
      }
      return new Observable(observer => {
        setTimeout(() => {
          observer.next({ paymentIntentId: `pi_mock_${Date.now()}`, status: 'succeeded' });
          observer.complete();
        }, 400);
      });
    }

    if (!this._stripe) return throwError(() => new Error('Stripe not initialized'));

    // ── Real Stripe confirmCardPayment ────────────────────────────────────
    return from(
      this._stripe.confirmCardPayment(clientSecret, { payment_method: paymentMethodId })
    ).pipe(
      switchMap(result => {
        if (result.error) return throwError(() => result.error);
        const intent = result.paymentIntent!;
        if (intent.status !== 'succeeded') {
          return throwError(() => ({ message: `Payment status: ${intent.status}` }));
        }
        return [{ paymentIntentId: intent.id, status: intent.status }];
      })
    );
  }

  get cardElement(): StripeCardElement | null { return this._cardElement; }
  /** isReady is true in both real mode (stripe initialized) and mock mode */
  get isReady(): boolean { return this.initialized() && (!!this._stripe || this._mockMode); }
}
