import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categoriesSignal = signal<Category[]>([]);
  readonly categories = this.categoriesSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadCategories(): void {
    this.http.get<Category[]>('/api/categories').subscribe({
      next: (cats) => this.categoriesSignal.set(this.buildTree(cats)),
      error: () => console.error('Failed to load categories')
    });
  }

  private buildTree(flat: Category[]): Category[] {
    const map = new Map<number, Category>();
    flat.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: Category[] = [];
    flat.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  getCategoryName(id: number | null): string {
    if (!id) return '';
    const flat = this.flatten(this.categoriesSignal());
    return flat.find(c => c.id === id)?.name || '';
  }

  private flatten(tree: Category[]): Category[] {
    return tree.reduce((acc, c) => [...acc, c, ...(c.children ? this.flatten(c.children) : [])], [] as Category[]);
  }
}