import { Component, OnInit, AfterViewInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { NotificationService } from '../../core/services/notification.service';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterModule, CommonModule, ProductCardComponent, SearchBarComponent, FilterPanelComponent, PaginationComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly cartService = inject(CartService);
  protected readonly wishlistService = inject(WishlistService);
  protected readonly notificationService = inject(NotificationService);
  private readonly http = inject(HttpClient);
  protected filterOpen = signal(false);
  protected addedSet = signal<Set<number>>(new Set());
  protected banners = signal<Banner[]>([]);
  protected activeBannerIndex = signal(0);
  protected viewMode = signal<'grid' | 'list'>((localStorage.getItem('productViewMode') as 'grid' | 'list') || 'grid');

  protected setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    localStorage.setItem('productViewMode', mode);
  }

  ngOnInit(): void {
    this.productService.resetFilters();
    if (this.categoryService.categories().length === 0) {
      this.categoryService.loadCategories();
    }
    this.http.get<Banner[]>('/api/banners?active=true').subscribe({
      next: (banners) => {
        this.banners.set(banners.filter(b => b.active).sort((a, b) => a.sortOrder - b.sortOrder));
      },
      error: () => {
        // Silently ignore banner loading errors in test environment
        this.banners.set([]);
      }
    });
  }

  protected prevBanner(): void {
    this.activeBannerIndex.update(i => (i > 0 ? i - 1 : this.banners().length - 1));
  }

  protected nextBanner(): void {
    this.activeBannerIndex.update(i => (i < this.banners().length - 1 ? i + 1 : 0));
  }

  protected filterByCategory(categoryId: number): void {
    this.productService.updateFilter({ categoryId });
    this.filterOpen.set(false);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleFilter(): void { this.filterOpen.update(v => !v); }

  onAddToCart(product: Product): void {
    // cartService.addToCart is handled by ProductCardComponent
    this.addedSet.update(s => { s.add(product.id); return new Set(s); });
    this.notificationService.show(`${product.name} added to cart`, 'success');
    setTimeout(() => this.addedSet.update(s => { s.delete(product.id); return new Set(s); }), 1200);
  }

  onToggleWishlist(productId: number): void {
    // wishlistService.toggle is handled by ProductCardComponent
    const msg = this.wishlistService.isInWishlist(productId) ? 'Added to wishlist' : 'Removed from wishlist';
    this.notificationService.show(msg, 'info');
  }
}