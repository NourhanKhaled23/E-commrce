import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private wishlistSignal = signal<number[]>([]);
  readonly wishlist = this.wishlistSignal.asReadonly();
  readonly count = computed(() => this.wishlistSignal().length);

  constructor() {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      try { this.wishlistSignal.set(JSON.parse(saved)); } catch { localStorage.removeItem('wishlist'); }
    }
  }

  private persist(): void {
    localStorage.setItem('wishlist', JSON.stringify(this.wishlistSignal()));
  }

  syncFromUser(userId: number | undefined, userWishlist: number[]): void {
    if (userWishlist?.length) {
      this.wishlistSignal.set(userWishlist);
      this.persist();
    }
  }

  add(productId: number): void {
    this.wishlistSignal.update(list => list.includes(productId) ? list : [...list, productId]);
    this.persist();
  }

  remove(productId: number): void {
    this.wishlistSignal.update(list => list.filter(id => id !== productId));
    this.persist();
  }

  toggle(productId: number): void {
    this.wishlistSignal.update(list =>
      list.includes(productId) ? list.filter(id => id !== productId) : [...list, productId]
    );
    this.persist();
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistSignal().includes(productId);
  }

  isWishlisted(productId: number): boolean {
    return this.isInWishlist(productId);
  }

  clear(): void {
    this.wishlistSignal.set([]);
    this.persist();
  }
}