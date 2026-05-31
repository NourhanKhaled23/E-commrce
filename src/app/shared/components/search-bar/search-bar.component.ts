import { Component, inject, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../../core/services/product.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.component.html',
  styles: [`
    .search-bar-wrapper { position: relative; }
    .search-bar { display: flex; align-items: center; gap: 10px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0 14px; transition: border-color 0.2s; }
    .search-bar:focus-within { border-color: var(--color-accent); }
    .search-icon { color: var(--color-text-muted); font-size: 16px; }
    .search-input { border: none; outline: none; flex: 1; padding: 10px 0; font-size: 14px; background: transparent; color: var(--color-text-body); }
    .search-input::placeholder { color: var(--color-text-hint); }
    .search-clear { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 16px; padding: 4px; }
    .search-clear:hover { color: var(--color-text-body); }
    .search-dropdown { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-sm); box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 100; max-height: 240px; overflow-y: auto; }
    .search-dropdown-header { padding: 10px 14px 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-muted); }
    .search-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; font-size: 13px; color: var(--color-text-body); transition: background 0.15s; }
    .search-dropdown-item:hover { background: var(--color-bg-surface); }
    .search-dropdown-item i { color: var(--color-text-muted); font-size: 14px; }
    .search-dropdown-count { margin-left: auto; font-size: 11px; color: var(--color-text-hint); }
  `],
})
export class SearchBarComponent {
  private readonly productService = inject(ProductService);
  private readonly analyticsService = inject(AnalyticsService);
  protected query = signal('');
  protected showDropdown = signal(false);
  protected recentSearches = signal<string[]>([]);
  private searchSubject = new Subject<string>();

  constructor() {
    this.loadRecentSearches();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(q => this.productService.updateFilter({ search: q }));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-bar-wrapper')) {
      this.showDropdown.set(false);
    }
  }

  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem('recent_searches');
      if (saved) this.recentSearches.set(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  private saveRecentSearch(query: string): void {
    if (!query.trim()) return;
    const current = this.recentSearches().filter(s => s !== query);
    const updated = [query, ...current].slice(0, 8);
    this.recentSearches.set(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }

  onInput(value: string): void {
    this.query.set(value);
    this.searchSubject.next(value);
    if (value.trim().length > 2) {
      setTimeout(() => {
        if (this.query() === value) {
          this.analyticsService.trackSearch(value, 0);
        }
      }, 500);
    }
  }

  onFocus(): void {
    if (!this.query() && this.recentSearches().length > 0) {
      this.showDropdown.set(true);
    }
  }

  selectRecent(search: string): void {
    this.query.set(search);
    this.searchSubject.next(search);
    this.saveRecentSearch(search);
    this.showDropdown.set(false);
    this.analyticsService.trackSearch(search, 0);
  }

  clearSearch(): void {
    this.query.set('');
    this.productService.updateFilter({ search: '' });
  }

  clearRecent(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recent_searches');
    this.showDropdown.set(false);
  }

  get topSearches(): { query: string; count: number }[] {
    return this.analyticsService.getTopSearches(5);
  }
}
