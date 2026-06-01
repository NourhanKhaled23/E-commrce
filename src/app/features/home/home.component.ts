import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AdminService, Banner } from '../../features/admin/admin.service';
import { NewsletterService } from '../../core/services/newsletter.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, TranslateModule, ProductCardComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly adminService = inject(AdminService);
  private readonly newsletterService = inject(NewsletterService);

  readonly loading = this.productService.loading;
  readonly featuredProducts = computed(() => this.productService.products().slice(0, 8));
  readonly bestSellers = computed(() =>
    [...this.productService.products()]
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 8)
  );
  readonly activeBanner = computed(() => {
    const banners = this.adminService.banners();
    return banners.find(b => b.active) || null;
  });

  readonly newsletterEmail = signal('');
  readonly subscribed = signal(false);

  ngOnInit(): void {
    this.productService.loadProducts();
    this.categoryService.loadCategories();
    this.adminService.loadAll();
  }

  subscribeNewsletter(): void {
    if (!this.newsletterEmail().trim()) return;
    const success = this.newsletterService.subscribe(this.newsletterEmail());
    if (success) {
      this.subscribed.set(true);
      this.newsletterEmail.set('');
    }
  }



  readonly trustSignals = [
    { icon: 'bi-arrow-return-left', title: 'Free Returns', desc: '30-day return policy, no questions asked' },
    { icon: 'bi-shield-check', title: 'Secure Payment', desc: '256-bit SSL encrypted checkout' },
    { icon: 'bi-patch-check', title: 'Authentic Products', desc: '100% verified genuine merchandise' },
    { icon: 'bi-headset', title: '24/7 Support', desc: 'Dedicated concierge service' },
  ];
}
