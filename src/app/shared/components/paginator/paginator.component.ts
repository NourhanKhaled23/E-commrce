import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent {
  readonly total = input.required<number>();
  readonly pageSize = input<number>(12);
  readonly currentPage = input<number>(1);
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => {
    const t = this.total();
    const s = this.pageSize();
    return Math.max(1, Math.ceil(t / s));
  });

  readonly pages = computed(() => {
    const tp = this.totalPages();
    const cp = this.currentPage();
    if (tp <= 7) {
      return Array.from({ length: tp }, (_, i) => i + 1);
    }

    const pagesList: number[] = [1];
    const start = Math.max(2, cp - 1);
    const end = Math.min(tp - 1, cp + 1);

    if (start > 2) {
      pagesList.push(0); // 0 acts as ellipsis
    }

    for (let i = start; i <= end; i++) {
      pagesList.push(i);
    }

    if (end < tp - 1) {
      pagesList.push(0); // 0 acts as ellipsis
    }

    pagesList.push(tp);
    return pagesList;
  });

  onPageClick(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}
