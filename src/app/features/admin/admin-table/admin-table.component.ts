import { Component, input, output, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'start' | 'center' | 'end';
  template?: 'text' | 'status' | 'image' | 'price' | 'date' | 'actions';
}

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="at-wrapper">
      <table class="at-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [style.width]="col.width" [style.text-align]="col.align || 'start'"
                  (click)="col.sortable && toggleSort(col.key)"
                  [class.at-sortable]="col.sortable">
                <span class="at-th-content">
                  {{ col.label }}
                  @if (col.sortable) {
                    <span class="at-sort-icon">
                      @if (sortKey() === col.key) {
                        <i class="bi" [class.bi-caret-up-fill]="sortDir() === 'asc'" [class.bi-caret-down-fill]="sortDir() === 'desc'"></i>
                      } @else {
                        <i class="bi bi-caret-down"></i>
                      }
                    </span>
                  }
                </span>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of pagedData(); track row[trackBy()]) {
            <tr (click)="rowClick.emit(row)" class="at-row-clickable">
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align || 'start'" [class.at-cell-actions]="col.template === 'actions'">
                  @switch (col.template) {
                    @case ('status') {
                      <span class="badge" [class]="'badge-' + (row[col.key] || '').toLowerCase().replace(/ /g, '-')">{{ row[col.key] }}</span>
                    }
                    @case ('price') {
                      \${{ row[col.key] | number:'1.2-2' }}
                    }
                    @case ('date') {
                      {{ row[col.key] | date:'mediumDate' }}
                    }
                    @case ('image') {
                      <img [src]="row[col.key]" class="at-thumb" alt="" loading="lazy">
                    }
                    @default {
                      {{ row[col.key] }}
                    }
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr><td [attr.colspan]="columns().length" class="at-empty">{{ emptyMessage() }}</td></tr>
          }
        </tbody>
      </table>
      @if (totalPages() > 1) {
        <div class="at-pagination">
          <button class="page-btn" [disabled]="page() <= 1" (click)="prevPage()"><i class="bi bi-chevron-left"></i></button>
          @for (p of pageNumbers(); track $index) {
            <button class="page-btn" [class.active]="p === page()" (click)="page.set(p)" [class.at-ellipsis]="p === 0">
              {{ p === 0 ? '...' : p }}
            </button>
          }
          <button class="page-btn" [disabled]="page() >= totalPages()" (click)="nextPage()"><i class="bi bi-chevron-right"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .at-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; background: #FFFFFF; border: 0.5px solid #E8E0D4; border-top: none; border-radius: 0 0 4px 4px; }
    .at-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
    .at-table thead tr { background: #F8F5EF; border-bottom: 0.5px solid #E8E0D4; }
    .at-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6B5C3E; white-space: nowrap; user-select: none; }
    .at-sortable { cursor: pointer; }
    .at-sortable:hover { color: #1A1512; }
    .at-th-content { display: inline-flex; align-items: center; gap: 4px; }
    .at-sort-icon i { font-size: 13px; color: #A8967A; }
    .at-sortable:hover .at-sort-icon i { color: #C8A96E; }
    .at-table td { padding: 14px 16px; border-bottom: 0.5px solid #F0EBE3; color: #1A1512; vertical-align: middle; white-space: nowrap; }
    .at-table tbody tr { transition: background 150ms ease; }
    .at-table tbody tr:last-child td { border-bottom: none; }
    .at-table tbody tr:hover { background: #FDFAF5; }
    .at-cell-actions { white-space: nowrap; }
    .at-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
    .at-row-clickable { cursor: pointer; }
    .at-empty { text-align: center; padding: 48px 16px !important; color: #6B5C3E; }
    .at-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 16px 0; }
    .page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 0.5px solid #E8E0D4; background: #FFFFFF; color: #1A1512; font-size: 13px; cursor: pointer; border-radius: 2px; transition: all 150ms ease; }
    .page-btn:hover:not(:disabled) { border-color: #C8A96E; color: #8B6914; }
    .page-btn.active { background: #C8A96E; color: #0D0D0D; border-color: #C8A96E; font-weight: 700; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .at-ellipsis { pointer-events: none; border-color: transparent; color: #6B5C3E; }
  `]
})
export class AdminTableComponent {
  readonly columns = input.required<ColumnConfig[]>();
  readonly data = input.required<any[]>();
  readonly trackBy = input<string>('id');
  readonly pageSize = input(10);
  readonly emptyMessage = input('No data found');
  readonly page = model(1);
  readonly sortKey = model<string>('');
  readonly sortDir = model<'asc' | 'desc'>('asc');
  readonly rowClick = output<any>();

  readonly sorted = computed(() => {
    const items = [...this.data()];
    const key = this.sortKey();
    if (!key) return items;
    return items.sort((a, b) => {
      const va = a[key] ?? '';
      const vb = b[key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())));

  readonly pagedData = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly pageNumbers = computed(() => {
    const tp = this.totalPages();
    const p = this.page();
    const pages: number[] = [];
    const start = Math.max(1, p - 2);
    const end = Math.min(tp, p + 2);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push(0);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < tp - 1) pages.push(0);
    if (end < tp) pages.push(tp);
    return pages;
  });

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  nextPage(): void {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }
}
