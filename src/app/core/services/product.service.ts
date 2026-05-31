import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, FilterState, ProductResponse } from '../models/product.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const DEFAULT_FILTERS: FilterState = {
  categoryId: null, minPrice: 0, maxPrice: 9999,
  sort: 'newest', rating: null, inStock: false, search: ''
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = '/api/products';
  private _products = signal<Product[]>([]);
  private _filters = signal<FilterState>({ ...DEFAULT_FILTERS });
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentPage = signal(1);
  private _totalProducts = signal(0);
  private readonly pageSize = 12;

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly totalProducts = this._totalProducts.asReadonly();

  /** Products for the current page (already fetched from server) */
  readonly pagedProducts = this._products.asReadonly();

  /** Total pages based on server-reported total */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this._totalProducts() / this.pageSize)));

  /**
   * filtered / totalFiltered kept for backward-compat with any template that
   * reads them — they now just reflect the current page's data.
   */
  readonly filtered = this._products.asReadonly();
  readonly totalFiltered = this._totalProducts.asReadonly();

  private readonly destroyRef = inject(DestroyRef);

  constructor(private http: HttpClient) {}

  loadProducts(): void {
    this._fetchPage(this._currentPage(), this._filters());
  }

  private _fetchPage(page: number, filters: FilterState): void {
    this._loading.set(true);
    this._error.set(null);

    const skip = (page - 1) * this.pageSize;
    let url = `${this.apiUrl}?limit=${this.pageSize}&skip=${skip}`;

    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.categoryId) url += `&categoryId=${filters.categoryId}`;
    if (filters.sort) url += `&sort=${filters.sort}`;
    if (filters.minPrice > 0) url += `&minPrice=${filters.minPrice}`;
    if (filters.maxPrice < 9999) url += `&maxPrice=${filters.maxPrice}`;
    if (filters.inStock) url += `&inStock=true`;
    if (filters.rating) url += `&rating=${filters.rating}`;

    this.http.get<ProductResponse>(url).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this._products.set(res.products);
        this._totalProducts.set(res.total);
        this._loading.set(false);
      },
      error: () => { this._error.set('Failed to load products'); this._loading.set(false); }
    });
  }

  getById(id: number): Product | undefined {
    return this._products().find(p => p.id === id);
  }

  getByIdSignal(id: number) {
    return computed(() => this._products().find(p => p.id === id));
  }

  updateFilter(partial: Partial<FilterState>): void {
    this._filters.update(f => ({ ...f, ...partial }));
    this._currentPage.set(1);
    this._fetchPage(1, this._filters());
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
    this._currentPage.set(1);
    this._fetchPage(1, { ...DEFAULT_FILTERS });
  }

  setPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this._currentPage.set(clamped);
    this._fetchPage(clamped, this._filters());
  }
}