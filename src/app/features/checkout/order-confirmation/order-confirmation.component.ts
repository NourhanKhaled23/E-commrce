import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css',
})
export class OrderConfirmationComponent {
  readonly orderId = input.required<number>();
  readonly items = input.required<CartItem[]>();
  readonly total = input.required<number>();
  readonly subtotal = input(0);
  readonly discount = input(0);
  readonly promoCode = input('');
}