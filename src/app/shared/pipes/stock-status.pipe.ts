import { Pipe, PipeTransform } from '@angular/core';

export interface StockBadgeConfig {
  text: string;
  cssClass: string;
}

@Pipe({
  name: 'stockStatus',
  standalone: true
})
export class StockStatusPipe implements PipeTransform {
  transform(stock: number | null | undefined): StockBadgeConfig {
    if (stock == null || stock <= 0) {
      return { text: 'Out of Stock', cssClass: 'bg-danger-subtle text-danger border border-danger' };
    }
    if (stock < 5) {
      return { text: 'Low Stock', cssClass: 'bg-warning-subtle text-warning border border-warning' };
    }
    return { text: 'In Stock', cssClass: 'bg-success-subtle text-success border border-success' };
  }
}
