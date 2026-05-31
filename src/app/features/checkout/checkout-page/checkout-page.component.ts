import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutService } from '../../../core/services/checkout.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentMethod } from '../../../core/models/order.model';
import { Address } from '../../../core/models/user.model';
import { CheckoutStepperComponent } from '../checkout-stepper/checkout-stepper.component';
import { ShippingFormComponent } from '../shipping-form/shipping-form.component';
import { PaymentPageComponent, PaymentProceedEvent } from '../payment-page/payment-page.component';
import { OrderConfirmationComponent } from '../order-confirmation/order-confirmation.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, CheckoutStepperComponent, ShippingFormComponent, PaymentPageComponent, OrderConfirmationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.css',
})
export class CheckoutPageComponent {
  protected readonly cartService = inject(CartService);
  protected readonly checkoutService = inject(CheckoutService);
  protected readonly authService = inject(AuthService);
  protected readonly orderService = inject(OrderService);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected guestEmail = signal('');
  protected guestMode = signal(false);
  protected error = signal('');

  // Snapshot of cart state captured just before clearCart() is called,
  // so the order-confirmation screen can display the correct items/totals.
  protected confirmedItems = signal<import('../../../core/models/cart.model').CartItem[]>([]);
  protected confirmedSubtotal = signal(0);
  protected confirmedDiscount = signal(0);
  protected confirmedTotal = signal(0);
  protected confirmedPromoCode = signal('');

  constructor() {
    const user = this.authService.user();
    if (!user) {
      this.guestMode.set(true);
      // Guest email is a pre-gate; step stays at 1 (Shipping) once they proceed
    } else {
      this.guestMode.set(false);
      this.checkoutService.setStep(1); // ensure clean state for logged-in users
    }
    if (this.cartService.cartItems().length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  startGuestCheckout(): void {
    if (!this.guestEmail()) { return; }
    this.checkoutService.setGuestEmail(this.guestEmail());
    this.guestMode.set(false);
    // Step stays at 1 — shipping form is step 1 for guests too
    this.checkoutService.setStep(1);
  }

  onShippingProceed(address: Address): void {
    this.checkoutService.setShippingAddress(address);
    this.checkoutService.setStep(2);
  }

  onPaymentProceed(event: PaymentProceedEvent): void {
    this.checkoutService.setPaymentMethod(event.method as PaymentMethod);
    const paymentMethodId = event.method === 'card' ? (event as any).paymentMethodId : undefined;
    this.placeOrder(paymentMethodId);
  }

  private placeOrder(stripePaymentMethodId?: string): void {
    const user = this.authService.user();
    const userId = user?.id || 0;
    const items = this.cartService.cartItems();
    const subtotal = this.cartService.cartTotal();
    const discount = this.cartService.discount();
    const total = this.cartService.finalTotal();
    const code = this.cartService.appliedCode() || undefined;

    this.checkoutService.placeOrder(userId, items, subtotal, discount, total, code, stripePaymentMethodId).subscribe({
      next: (order) => {
        // Snapshot cart state BEFORE clearing so the confirmation screen has data
        this.confirmedItems.set([...items]);
        this.confirmedSubtotal.set(subtotal);
        this.confirmedDiscount.set(discount);
        this.confirmedTotal.set(total);
        this.confirmedPromoCode.set(code ?? '');

        // Register the new order in OrderService so it appears in "My Orders"
        // and can be looked up by ID without re-fetching the mock JSON
        this.orderService.addOrder(order);

        this.cartService.clearCart();
        this.toastService.show('Order placed successfully!', 'success');
      },
      error: (err: any) => {
        this.checkoutService.clearProcessing();
        this.error.set(err?.message || 'Failed to place order. Please try again.');
        this.toastService.show(err?.message || 'Payment failed. Please try again.', 'error');
      }
    });
  }

  goBack(): void {
    const step = this.checkoutService.step();
    if (step === 1) { this.router.navigate(['/cart']); }
    else if (step === 2) { this.checkoutService.setStep(1); }
    else if (step === 3) { this.checkoutService.setStep(2); }
  }

  continueShopping(): void {
    this.checkoutService.reset();
    this.router.navigate(['/products']);
  }
}