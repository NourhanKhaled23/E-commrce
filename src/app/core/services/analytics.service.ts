import { Injectable, signal } from '@angular/core';

export interface SearchAnalytic {
  query: string;
  timestamp: number;
  resultCount: number;
}

export interface CartAbandonment {
  sessionId: string;
  items: { productId: number; name: string; price: number; quantity: number }[];
  timestamp: number;
  lastPage: string;
}

const SEARCH_KEY = 'search_analytics';
const ABANDON_KEY = 'cart_abandonment';
const VIEW_KEY = 'product_views';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private _searchLog = signal<SearchAnalytic[]>([]);
  readonly searchLog = this._searchLog.asReadonly();

  private _cartAbandonments = signal<CartAbandonment[]>([]);
  readonly cartAbandonments = this._cartAbandonments.asReadonly();

  constructor() {
    this.loadSearchLog();
    this.loadCartAbandonments();
  }

  // ── Search Analytics ──
  private loadSearchLog(): void {
    try {
      const saved = localStorage.getItem(SEARCH_KEY);
      if (saved) this._searchLog.set(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  trackSearch(query: string, resultCount: number): void {
    if (!query.trim()) return;
    const entry: SearchAnalytic = { query: query.trim(), timestamp: Date.now(), resultCount };
    const updated = [entry, ...this._searchLog()].slice(0, 100);
    this._searchLog.set(updated);
    localStorage.setItem(SEARCH_KEY, JSON.stringify(updated));
  }

  getTopSearches(limit = 10): { query: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const entry of this._searchLog()) {
      counts.set(entry.query, (counts.get(entry.query) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ── Cart Abandonment ──
  private loadCartAbandonments(): void {
    try {
      const saved = localStorage.getItem(ABANDON_KEY);
      if (saved) this._cartAbandonments.set(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  trackCartView(items: { productId: number; name: string; price: number; quantity: number }[], currentPage: string): void {
    const sessionId = `session_${Date.now()}`;
    const entry: CartAbandonment = { sessionId, items, timestamp: Date.now(), lastPage: currentPage };
    const updated = [entry, ...this._cartAbandonments()].slice(0, 50);
    this._cartAbandonments.set(updated);
    localStorage.setItem(ABANDON_KEY, JSON.stringify(updated));
  }

  clearCartAbandonment(): void {
    this._cartAbandonments.set([]);
    localStorage.removeItem(ABANDON_KEY);
  }

  // ── Product Views ──
  trackProductView(productId: number): void {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      const views: { id: number; count: number; lastViewed: number }[] = saved ? JSON.parse(saved) : [];
      const existing = views.find(v => v.id === productId);
      if (existing) {
        existing.count++;
        existing.lastViewed = Date.now();
      } else {
        views.push({ id: productId, count: 1, lastViewed: Date.now() });
      }
      // Keep only last 200 products
      const trimmed = views.sort((a, b) => b.lastViewed - a.lastViewed).slice(0, 200);
      localStorage.setItem(VIEW_KEY, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }

  getMostViewedProducts(limit = 10): number[] {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (!saved) return [];
      const views: { id: number; count: number }[] = JSON.parse(saved);
      return views.sort((a, b) => b.count - a.count).slice(0, limit).map(v => v.id);
    } catch { return []; }
  }
}
