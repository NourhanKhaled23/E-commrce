import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent implements OnInit {
  protected readonly productService = inject(ProductService);
  protected readonly categoryService = inject(CategoryService);
  protected minPrice = signal(0);
  protected maxPrice = signal(9999);

  ngOnInit(): void {
    if (this.categoryService.categories().length === 0) {
      this.categoryService.loadCategories();
    }
  }

  setCategory(id: number | null): void {
    this.productService.updateFilter({ categoryId: this.productService.filters().categoryId === id ? null : id });
  }

  setRating(rating: number | null): void {
    this.productService.updateFilter({ rating: this.productService.filters().rating === rating ? null : rating });
  }

  toggleInStock(): void {
    this.productService.updateFilter({ inStock: !this.productService.filters().inStock });
  }

  onPriceChange(): void {
    this.productService.updateFilter({ minPrice: this.minPrice(), maxPrice: this.maxPrice() });
  }

  setSort(sort: string): void {
    this.productService.updateFilter({ sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'rating' });
  }

  resetAll(): void {
    this.minPrice.set(0); this.maxPrice.set(9999);
    this.productService.resetFilters();
  }

  trackById(_i: number, c: Category) { return c.id; }
}