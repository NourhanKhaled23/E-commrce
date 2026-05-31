import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  protected readonly productService = inject(ProductService);
  protected readonly pages = computed(() => {
    const tp = this.productService.totalPages();
    const cp = this.productService.currentPage();
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cp > 3) pages.push('...');
    for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) pages.push(i);
    if (cp < tp - 2) pages.push('...');
    pages.push(tp);
    return pages;
  });
}