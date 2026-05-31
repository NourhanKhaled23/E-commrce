import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComparisonService } from '../../core/services/comparison.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-comparison',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="comparison-page">
      <div class="page-header">
        <h1 class="page-title">Product Comparison</h1>
        <p class="page-meta">{{ comparisonService.count() }} products</p>
      </div>

      @if (comparisonService.count() === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="bi bi-bar-chart-steps"></i></div>
          <h3>No products to compare</h3>
          <p>Add products from the product list to start comparing.</p>
          <a routerLink="/products" class="btn-primary-of"><i class="bi bi-grid"></i> Browse Products</a>
        </div>
      } @else {
        <div class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="attr-col">Feature</th>
                @for (product of comparisonService.items(); track product.id) {
                  <th class="product-col">
                    <div class="product-header">
                      <button class="remove-btn" (click)="removeProduct(product.id)" title="Remove">
                        <i class="bi bi-x-lg"></i>
                      </button>
                      <img [src]="product.thumbnail" [alt]="product.name" loading="lazy" class="product-thumb">
                      <a [routerLink]="['/products', product.id]" class="product-name">{{ product.name }}</a>
                      <span class="product-price">{{ product.price | currency:'USD':'symbol':'1.2-2' }}</span>
                    </div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="attr-label">Category</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>{{ product.category }}</td>
                }
              </tr>
              <tr>
                <td class="attr-label">Brand</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>{{ product.brand || '—' }}</td>
                }
              </tr>
              <tr>
                <td class="attr-label">Rating</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>
                    <span class="rating">
                      @for (s of [1,2,3,4,5]; track s) {
                        <i class="bi" [class.bi-star-fill]="s <= product.avgRating" [class.bi-star]="s > product.avgRating"></i>
                      }
                      {{ product.avgRating.toFixed(1) }}
                    </span>
                  </td>
                }
              </tr>
              <tr>
                <td class="attr-label">Stock</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>
                    <span class="badge" [class.badge-active]="product.stock > 10" [class.badge-pending]="product.stock > 0 && product.stock <= 10" [class.badge-restricted]="product.stock === 0">
                      {{ product.stock > 0 ? product.stock + ' units' : 'Out of Stock' }}
                    </span>
                  </td>
                }
              </tr>
              <tr>
                <td class="attr-label">Reviews</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>{{ product.reviewCount }} reviews</td>
                }
              </tr>
              <tr>
                <td class="attr-label">Price</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td class="price-cell">{{ product.price | currency:'USD':'symbol':'1.2-2' }}</td>
                }
              </tr>
              <tr>
                <td class="attr-label">Actions</td>
                @for (product of comparisonService.items(); track product.id) {
                  <td>
                    <a [routerLink]="['/products', product.id]" class="btn-primary-of btn-sm">View Details</a>
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </div>

        <div class="comparison-actions">
          <button class="btn-outline-of" (click)="clearAll()"><i class="bi bi-trash"></i> Clear All</button>
          <a routerLink="/products" class="btn-primary-of"><i class="bi bi-plus"></i> Add More</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .comparison-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
    .page-meta { font-size: 13px; color: var(--color-text-muted); }
    .empty-state { text-align: center; padding: 80px 20px; }
    .empty-icon { font-size: 3rem; color: var(--color-text-hint); margin-bottom: 16px; }
    .empty-state h3 { font-family: var(--font-serif); color: var(--color-text-primary); margin: 0 0 8px; }
    .empty-state p { color: var(--color-text-muted); margin-bottom: 24px; }
    .comparison-table-wrapper { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg-card); }
    .comparison-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .comparison-table th, .comparison-table td { padding: 14px 16px; border-bottom: 1px solid var(--color-border); text-align: center; font-size: 13px; }
    .comparison-table th { background: var(--color-bg-surface); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); }
    .attr-col { text-align: left !important; width: 140px; }
    .attr-label { text-align: left !important; font-weight: 600; color: var(--color-text-body); }
    .product-col { min-width: 200px; }
    .product-header { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
    .product-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); }
    .product-name { font-size: 13px; font-weight: 600; color: var(--color-text-body); text-decoration: none; text-align: center; }
    .product-name:hover { color: var(--color-accent); }
    .product-price { font-weight: 700; color: var(--color-accent); font-size: 15px; }
    .remove-btn { position: absolute; top: -4px; right: -4px; width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-card); cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
    .remove-btn:hover { border-color: var(--color-danger); color: var(--color-danger); }
    .rating { color: var(--color-accent); font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-xs); font-size: 11px; font-weight: 600; }
    .badge-active { background: var(--color-success-bg); color: var(--color-success); }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    .badge-restricted { background: var(--color-danger-bg); color: var(--color-danger); }
    .price-cell { font-weight: 700; color: var(--color-accent); font-size: 15px; }
    .comparison-actions { display: flex; justify-content: space-between; margin-top: 20px; }
    .btn-primary-of { display: inline-flex; align-items: center; gap: 6px; background: var(--color-accent); color: var(--color-primary); padding: 10px 20px; border-radius: var(--radius-xs); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; border: none; cursor: pointer; }
    .btn-primary-of:hover { background: var(--color-accent-dark); }
    .btn-outline-of { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--color-border); color: var(--color-text-body); padding: 10px 20px; border-radius: var(--radius-xs); font-size: 12px; font-weight: 600; background: none; cursor: pointer; }
    .btn-outline-of:hover { border-color: var(--color-accent); color: var(--color-accent); }
    .btn-sm { padding: 6px 14px; font-size: 11px; }
  `]
})
export class ProductComparisonComponent {
  readonly comparisonService = inject(ComparisonService);

  removeProduct(id: number): void {
    this.comparisonService.remove(id);
  }

  clearAll(): void {
    this.comparisonService.clear();
  }
}
