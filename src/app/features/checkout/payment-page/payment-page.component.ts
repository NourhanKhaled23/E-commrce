import {
  Component, output, OnInit, OnDestroy,
  ChangeDetectionStrategy, signal, inject, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { StripeService, StripeCardElement, StripeCardElementChangeEvent } from '../../../core/services/stripe.service';
import { PaymentMethod } from '../../../core/models/order.model';

export type PaymentProceedEvent =
  | { method: 'card'; paymentMethodId: string }
  | { method: 'paypal' | 'cod' | 'wallet' };

/** Simple card fields used in mock mode (no real Stripe key configured) */
interface MockCardFields {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-page.component.html',
  styleUrl: './payment-page.component.css',
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  protected readonly stripeService = inject(StripeService);
  private readonly zone = inject(NgZone);

  readonly proceed = output<PaymentProceedEvent>();
  readonly goBack = output<void>();

  protected activeTab = signal<PaymentMethod>('card');
  protected paypalLoading = signal(false);
  protected walletInsufficient = signal(false);

  // Stripe state
  protected stripeLoading = signal(true);
  protected stripeError = signal<string | null>(null);
  protected cardComplete = signal(false);
  protected cardProcessing = signal(false);
  protected cardErrorMessage = signal<string | null>(null);

  // Mock-mode card fields (shown when no real Stripe key is set)
  protected mockCard = signal<MockCardFields>({ number: '', expiry: '', cvc: '', name: '' });
  protected mockSubmitted = signal(false);

  private _cardElement: StripeCardElement | null = null;

  ngOnInit(): void {
    this.stripeService.init().then(() => {
      this.zone.run(() => {
        this.stripeLoading.set(false);
        if (!this.stripeService.isMockMode()) {
          setTimeout(() => this.mountCard(), 0);
        } else {
          // In mock mode the card is always "complete" once fields are filled
          this.cardComplete.set(false);
        }
      });
    }).catch((err) => {
      this.zone.run(() => {
        this.stripeLoading.set(false);
        this.stripeError.set(err?.message || 'Failed to load Stripe');
      });
    });
  }

  ngOnDestroy(): void {
    this.stripeService.destroyCardElement();
  }

  private mountCard(): void {
    const el = document.getElementById('card-element');
    if (!el || !this.stripeService.isReady || this.stripeService.isMockMode()) return;
    try {
      this._cardElement = this.stripeService.mountCardElement('#card-element');
      this._cardElement.on('change', (event: StripeCardElementChangeEvent) => {
        this.zone.run(() => {
          this.cardComplete.set(event.complete);
          this.cardErrorMessage.set(event.error?.message ?? null);
        });
      });
    } catch (e: any) {
      this.zone.run(() => this.stripeError.set(e?.message || 'Failed to mount card element'));
    }
  }

  switchToCard(): void {
    this.activeTab.set('card');
    if (this.stripeService.isReady && !this.stripeService.isMockMode()) {
      setTimeout(() => this.mountCard(), 0);
    }
  }

  // ── Mock card field helpers ──────────────────────────────────────────────
  onMockCardInput(): void {
    const c = this.mockCard();
    const numOk = c.number.replace(/\s/g, '').length >= 13;
    const expOk = c.expiry.length === 5;
    const cvcOk = c.cvc.length >= 3;
    const nameOk = c.name.trim().length > 0;
    this.cardComplete.set(numOk && expOk && cvcOk && nameOk);
    this.cardErrorMessage.set(null);
  }

  formatMockNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    this.mockCard.update(c => ({ ...c, number: v }));
    input.value = v;
    this.onMockCardInput();
  }

  formatMockExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    this.mockCard.update(c => ({ ...c, expiry: v }));
    input.value = v;
    this.onMockCardInput();
  }

  formatMockCvc(event: Event): void {
    const input = event.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').slice(0, 4);
    this.mockCard.update(c => ({ ...c, cvc: v }));
    input.value = v;
    this.onMockCardInput();
  }

  // ── Payment handlers ─────────────────────────────────────────────────────
  onPayPal(): void {
    this.paypalLoading.set(true);
    setTimeout(() => { this.paypalLoading.set(false); this.proceed.emit({ method: 'paypal' }); }, 2000);
  }

  onCod(): void { this.proceed.emit({ method: 'cod' }); }

  onWallet(): void {
    const u = this.authService.user();
    if (!u) return;
    if (u.walletBalance < this.cartService.finalTotal()) {
      this.walletInsufficient.set(true);
      return;
    }
    this.walletInsufficient.set(false);
    this.proceed.emit({ method: 'wallet' });
  }

  onCardProceed(): void {
    this.cardErrorMessage.set(null);

    // ── Mock mode: validate fields manually ──────────────────────────────
    if (this.stripeService.isMockMode()) {
      this.mockSubmitted.set(true);
      const c = this.mockCard();
      if (!this.cardComplete()) {
        this.cardErrorMessage.set('Please complete all card fields.');
        return;
      }
      // Simulate decline for the test decline card number
      const rawNum = c.number.replace(/\s/g, '');
      if (rawNum === '4000000000000002') {
        this.cardErrorMessage.set('Your card was declined.');
        return;
      }
      this.cardProcessing.set(true);
      this.stripeService.createPaymentMethod(this._cardElement!, c.name).subscribe({
        next: ({ paymentMethodId }) => {
          this.zone.run(() => {
            this.cardProcessing.set(false);
            this.proceed.emit({ method: 'card', paymentMethodId });
          });
        },
        error: (err: any) => {
          this.zone.run(() => {
            this.cardProcessing.set(false);
            this.cardErrorMessage.set(err?.message || 'Payment failed.');
          });
        }
      });
      return;
    }

    // ── Real Stripe mode ─────────────────────────────────────────────────
    if (!this._cardElement || !this.stripeService.isReady) return;
    if (!this.cardComplete()) {
      this.cardErrorMessage.set('Please complete your card details.');
      return;
    }
    this.cardProcessing.set(true);
    this.stripeService.createPaymentMethod(this._cardElement).subscribe({
      next: ({ paymentMethodId }) => {
        this.zone.run(() => {
          this.cardProcessing.set(false);
          this.proceed.emit({ method: 'card', paymentMethodId });
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.cardProcessing.set(false);
          this.cardErrorMessage.set(err?.message || 'Card validation failed. Please try again.');
        });
      }
    });
  }
}
