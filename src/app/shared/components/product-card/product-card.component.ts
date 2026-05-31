import { Component, input, output, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ComparisonService } from '../../../core/services/comparison.service';
import { TranslateModule } from '@ngx-translate/core';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly cartAdded = output<Product>();
  readonly wishlistToggled = output<number>();

  protected readonly wishlistService = inject(WishlistService);
  protected readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  protected readonly comparisonService = inject(ComparisonService);

  protected imageLoadedState = signal(false);
  protected imageErrorState = signal(false);
  protected justAdded = signal(false);
  protected heartAnimating = signal(false);

  onImgLoad(): void {
    this.imageLoadedState.set(true);
  }

  onImgError(): void {
    this.imageErrorState.set(true);
    this.imageLoadedState.set(true);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.product().stock <= 0) return;
    this.cartService.addToCart(this.product());
    this.cartAdded.emit(this.product());
    this.justAdded.set(true);
    this.toastService.show(`${this.product().name} added to cart`, 'success');
    setTimeout(() => this.justAdded.set(false), 1200);
  }

  onToggleWishlist(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.wishlistService.toggle(this.product().id);
    this.wishlistToggled.emit(this.product().id);
    this.heartAnimating.set(true);
    setTimeout(() => this.heartAnimating.set(false), 400);
  }

  onToggleComparison(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const added = this.comparisonService.toggle(this.product());
    this.toastService.show(added ? 'Added to comparison' : 'Removed from comparison', 'info');
  }

  isInComparison(): boolean {
    return this.comparisonService.isInComparison(this.product().id);
  }

  get comparisonCount(): number {
    return this.comparisonService.count();
  }
}