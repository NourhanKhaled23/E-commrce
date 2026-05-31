import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Category } from '../../../core/models/category.model';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(DialogService);
  readonly categories = signal<Category[]>([]);
  readonly showModal = signal(false);
  readonly editingCat = signal<Category | null>(null);
  readonly form: any = { name: '', slug: '', parentId: null, image: '' };

  readonly rootCategories = computed(() => this.categories().filter(c => c.parentId === null));
  getChildren = (parentId: number) => this.categories().filter(c => c.parentId === parentId);

  ngOnInit(): void {
    this.http.get<Category[]>('/assets/mock-data/categories.json').subscribe(cats => this.categories.set(cats));
  }

  openCreate(): void {
    this.editingCat.set(null);
    this.form.name = ''; this.form.slug = ''; this.form.parentId = null; this.form.image = '';
    this.showModal.set(true);
  }

  openEdit(cat: Category): void {
    this.editingCat.set(cat);
    this.form.name = cat.name; this.form.slug = cat.slug; this.form.parentId = cat.parentId; this.form.image = cat.image || '';
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingCat.set(null); }

  saveCategory(): void {
    const editId = this.editingCat()?.id;
    const data = { name: this.form.name, slug: this.form.slug, parentId: this.form.parentId, image: this.form.image || undefined };
    if (editId) {
      this.categories.update(cats => cats.map(c => c.id === editId ? { ...c, ...data } : c));
    } else {
      const newId = Math.max(0, ...this.categories().map(c => c.id)) + 1;
      this.categories.update(cats => [...cats, { id: newId, ...data } as Category]);
    }
    this.closeModal();
  }

  async deleteCat(id: number): Promise<void> {
    if (this.getChildren(id).length > 0) { alert('Cannot delete a category with subcategories. Remove children first.'); return; }
    const confirmed = await this.dialog.open('Delete Category', 'Are you sure you want to delete this category?', { confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
    if (!confirmed) return;
    this.categories.update(cats => cats.filter(c => c.id !== id));
  }

  moveUp(id: number): void {
    const roots = this.rootCategories();
    const idx = roots.findIndex(c => c.id === id);
    if (idx <= 0) return;
    const all = this.categories();
    const id1 = roots[idx].id, id2 = roots[idx - 1].id;
    this.categories.set(all.map(c => c.id === id1 ? { ...c, sortOrder: idx - 1 } : c.id === id2 ? { ...c, sortOrder: idx } : c));
  }

  moveDown(id: number): void {
    const roots = this.rootCategories();
    const idx = roots.findIndex(c => c.id === id);
    if (idx < 0 || idx >= roots.length - 1) return;
    const all = this.categories();
    const id1 = roots[idx].id, id2 = roots[idx + 1].id;
    this.categories.set(all.map(c => c.id === id1 ? { ...c, sortOrder: idx + 1 } : c.id === id2 ? { ...c, sortOrder: idx } : c));
  }

  getChildCount(parentId: number): number {
    return this.getChildren(parentId).length;
  }
}
