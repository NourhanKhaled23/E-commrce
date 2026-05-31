import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { NotificationService } from '../../core/services/notification.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { RecentlyViewedService } from '../../core/services/recently-viewed.service';
import { ComparisonService } from '../../core/services/comparison.service';
import { ReviewsComponent } from '../../shared/components/reviews/reviews.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterModule, CommonModule, ReviewsComponent, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  protected product = signal<Product | null>(null);
  protected relatedProducts = signal<Product[]>([]);
  protected isLoading = signal(true);
  protected quantity = signal(1);
  protected selectedImage = signal(0);
  protected imageLoaded = signal(false);
  protected imageError = signal(false);
  protected addedToCart = signal(false);
  protected activeTab = signal<'description' | 'reviews'>('description');
  protected lightboxOpen = signal(false);
  protected lightboxIndex = signal(0);
  protected seller = signal<any>(null);
  protected sellerRating = signal('4.8');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  protected readonly cartService = inject(CartService);
  protected readonly wishlistService = inject(WishlistService);
  protected readonly notificationService = inject(NotificationService);
  private readonly analyticsService = inject(AnalyticsService);
  protected readonly recentlyViewedService = inject(RecentlyViewedService);
  protected readonly comparisonService = inject(ComparisonService);

  protected readonly inWishlist = computed(() => this.product() ? this.wishlistService.isInWishlist(this.product()!.id) : false);
  protected readonly stockUrgency = computed(() => {
    const s = this.product()?.stock ?? 0;
    if (s === 0) return { label: 'Out of Stock', level: 'empty', pct: 0 };
    if (s <= 3) return { label: `Only ${s} left — almost gone!`, level: 'critical', pct: 20 };
    if (s <= 10) return { label: `Only ${s} in stock`, level: 'low', pct: 40 };
    if (s <= 50) return { label: `${s} in stock`, level: 'medium', pct: 70 };
    return { label: 'In Stock', level: 'high', pct: 100 };
  });

  ngOnInit(): void {
    document.body.classList.add('has-floating-cart');
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadProduct(id);
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('has-floating-cart');
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);
    this.selectedImage.set(0);
    this.imageLoaded.set(false);
    this.imageError.set(false);
    this.quantity.set(1);
    this.lightboxOpen.set(false);
    this.http.get<Product>(`/api/products/${id}`).subscribe({
      next: (p) => {
        this.product.set(p);
        this.isLoading.set(false);
        this.analyticsService.trackProductView(p.id);
        this.recentlyViewedService.add(p);
        if (p.sellerId) this.loadSeller(p.sellerId);
        this.loadRelated(p.categoryId, p.id);
      },
      error: () => { this.isLoading.set(false); this.router.navigate(['/products']); }
    });
  }

  private loadRelated(categoryId: number, excludeId: number): void {
    this.http.get<any>('/api/products?limit=50&skip=0').subscribe({
      next: (res) => {
        const related = res.products
          .filter((p: Product) => p.categoryId === categoryId && p.id !== excludeId)
          .slice(0, 4);
        this.relatedProducts.set(related);
      }
    });
  }

  private loadSeller(id: number): void {
    this.http.get<any>(`/api/users/${id}`).subscribe({
      next: (u) => this.seller.set(u),
      error: () => {}
    });
  }

  selectImage(index: number): void { this.selectedImage.set(index); this.imageLoaded.set(false); this.imageError.set(false); }
  onMainLoad(): void { this.imageLoaded.set(true); }
  onImageError(): void { this.imageError.set(true); }
  onThumbError($index: number): void {}

  openLightbox(index: number): void { this.lightboxIndex.set(index); this.lightboxOpen.set(true); }
  closeLightbox(): void { this.lightboxOpen.set(false); }
  prevLightbox(): void { this.lightboxIndex.update(i => i > 0 ? i - 1 : (this.product()?.images.length ?? 1) - 1); }
  nextLightbox(): void { this.lightboxIndex.update(i => i < (this.product()?.images.length ?? 1) - 1 ? i + 1 : 0); }

  changeQuantity(delta: number): void {
    const p = this.product();
    if (!p) return;
    const next = this.quantity() + delta;
    if (next >= 1 && next <= (p.stock || 99)) this.quantity.set(next);
  }

  addToCart(): void {
    const p = this.product();
    if (p) {
      this.cartService.addToCart(p, this.quantity());
      this.addedToCart.set(true);
      this.notificationService.show(`${p.name} added to cart`, 'success');
      setTimeout(() => this.addedToCart.set(false), 2000);
    }
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishlistService.toggle(p.id);
    this.notificationService.show(this.inWishlist() ? 'Added to wishlist' : 'Removed from wishlist', 'info');
  }

  setTab(tab: 'description' | 'reviews'): void { this.activeTab.set(tab); }

  onCardAddToCart(product: Product): void {
    // cartService.addToCart is handled by ProductCardComponent
    this.notificationService.show(`${product.name} added to cart`, 'success');
  }

  onCardToggleWishlist(productId: number): void {
    // wishlistService.toggle is handled by ProductCardComponent
    this.notificationService.show(this.wishlistService.isInWishlist(productId) ? 'Added to wishlist' : 'Removed from wishlist', 'info');
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  toggleComparison(): void {
    const p = this.product();
    if (!p) return;
    const added = this.comparisonService.toggle(p);
    this.notificationService.show(added ? 'Added to comparison' : 'Removed from comparison', 'info');
  }

  isInComparison(): boolean {
    const p = this.product();
    return p ? this.comparisonService.isInComparison(p.id) : false;
  }
}