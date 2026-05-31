import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly analyticsService = inject(AnalyticsService);

  protected promoInput = signal('');
  protected promoLoading = signal(false);
  protected promoMessage = signal('');
  protected promoError = signal(false);

  ngOnInit(): void {
    // Track cart view for abandonment analytics
    const items = this.cartService.cartItems();
    if (items.length > 0) {
      this.analyticsService.trackCartView(
        items.map(i => ({ productId: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
        '/cart'
      );
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  applyPromo(): void {
    const code = this.promoInput().trim();
    if (!code) return;
    this.promoLoading.set(true);
    this.promoMessage.set('');
    this.promoError.set(false);
    this.cartService.applyPromo(code).subscribe({
      next: (res) => {
        this.promoMessage.set(res.message);
        this.promoError.set(!res.valid);
        this.promoLoading.set(false);
      },
      error: () => {
        this.promoMessage.set('Error applying code');
        this.promoError.set(true);
        this.promoLoading.set(false);
      }
    });
  }

  removePromo(): void {
    this.cartService.removePromo();
    this.promoInput.set('');
    this.promoMessage.set('');
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}