import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 10;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private _items = signal<Product[]>([]);
  readonly items = this._items.asReadonly();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this._items.set(JSON.parse(saved));
    } catch { /* ignore */ }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
  }

  add(product: Product): void {
    const current = this._items().filter(p => p.id !== product.id);
    const updated = [product, ...current].slice(0, MAX_ITEMS);
    this._items.set(updated);
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
