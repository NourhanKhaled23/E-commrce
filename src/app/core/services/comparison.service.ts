import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'product_comparison';
const MAX_COMPARE = 4;

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private _items = signal<Product[]>([]);
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isFull = computed(() => this._items().length >= MAX_COMPARE);

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

  add(product: Product): boolean {
    if (this._items().some(p => p.id === product.id)) return false;
    if (this._items().length >= MAX_COMPARE) return false;
    this._items.update(items => [...items, product]);
    this.persist();
    return true;
  }

  remove(productId: number): void {
    this._items.update(items => items.filter(p => p.id !== productId));
    this.persist();
  }

  isInComparison(productId: number): boolean {
    return this._items().some(p => p.id === productId);
  }

  toggle(product: Product): boolean {
    if (this.isInComparison(product.id)) {
      this.remove(product.id);
      return false;
    }
    return this.add(product);
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
