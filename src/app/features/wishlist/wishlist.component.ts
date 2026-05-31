import { Component, OnInit, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent {
  products = signal<Product[]>([]);
  isLoading = signal(true);
  readonly wishlistService = inject(WishlistService);
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);

  constructor() {
    // effect() re-runs whenever wishlistService.wishlist() signal changes,
    // so the product list stays in sync even if items are added/removed elsewhere.
    effect(() => {
      const ids = this.wishlistService.wishlist();
      if (ids.length === 0) {
        this.products.set([]);
        this.isLoading.set(false);
        return;
      }
      this.isLoading.set(true);
      this.http.get<any>('/api/products?limit=50&skip=0').subscribe({
        next: (data) => {
          const filtered = data.products.filter((p: Product) => ids.includes(p.id));
          this.products.set(filtered);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    });
  }

  removeFromWishlist(productId: number): void {
    this.wishlistService.remove(productId);
    // products list updates automatically via the effect above
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.toastService.show(`${product.name} added to cart`, 'success');
  }

  shareWishlist(): void {
    const productNames = this.products().map(p => p.name).join(', ');
    const shareText = `Check out my wishlist on Open Fashion: ${productNames}`;
    const shareUrl = window.location.origin + '/wishlist';

    if (navigator.share) {
      navigator.share({
        title: 'My Open Fashion Wishlist',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
        this.toastService.show('Wishlist link copied to clipboard!', 'success');
      }).catch(() => {
        this.toastService.show('Unable to share', 'error');
      });
    }
  }

  shareProduct(product: Product): void {
    const shareText = `${product.name} - $${product.price.toFixed(2)}`;
    const shareUrl = window.location.origin + '/products/' + product.id;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.toastService.show('Product link copied!', 'success');
      }).catch(() => {});
    }
  }
}