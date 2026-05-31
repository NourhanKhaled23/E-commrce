import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { Product } from '../../../core/models/product.model';
import { DialogService } from '../../../core/services/dialog.service';
import { SanitizeService } from '../../../core/services/sanitize.service';

@Component({
  selector: 'app-product-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-crud.component.html',
  styleUrls: ['./product-crud.component.scss']
})
export class ProductCrudComponent implements OnInit {
  readonly admin = inject(AdminService);
  readonly dialog = inject(DialogService);
  private readonly sanitizeService = inject(SanitizeService);
  readonly products = this.admin.products;
  readonly search = signal('');
  readonly showModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly sortField = signal('id');
  readonly sortDir = signal<'asc'|'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly form: any = { name: '', description: '', price: 0, comparePrice: 0, category: '', stock: 0, brand: '', imageUrl: '', sellerId: 1, active: true };

  readonly filteredProducts = computed(() => {
    const q = this.search().toLowerCase();
    let list = q ? this.products().filter(p => p.name.toLowerCase().includes(q)) : this.products();
    const key = this.sortField();
    return list.sort((a, b) => {
      const va = (a as any)[key] ?? '';
      const vb = (b as any)[key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
  });

  readonly paginatedProducts = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  readonly totalProducts = computed(() => this.filteredProducts().length);
  readonly paginationStart = computed(() => (this.page() - 1) * this.pageSize + 1);
  readonly paginationEnd = computed(() => Math.min(this.page() * this.pageSize, this.totalProducts()));

  readonly pageNumbers = computed(() => {
    const tp = Math.max(1, Math.ceil(this.totalProducts() / this.pageSize));
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

  ngOnInit(): void { this.admin.loadAll(); }

  sort(field: string): void {
    if (this.sortField() === field) { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }

  openCreate(): void {
    this.editingProduct.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.form.name = product.name;
    this.form.description = product.description;
    this.form.price = product.price;
    this.form.comparePrice = product.comparePrice || 0;
    this.form.category = product.category;
    this.form.stock = product.stock;
    this.form.brand = product.brand || '';
    this.form.imageUrl = product.images?.[0] || product.thumbnail || '';
    this.form.sellerId = product.sellerId;
    this.form.active = product.active !== false;
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingProduct.set(null); }

  resetForm(): void {
    this.form.name = ''; this.form.description = ''; this.form.price = 0;
    this.form.comparePrice = 0; this.form.category = ''; this.form.stock = 0;
    this.form.brand = ''; this.form.imageUrl = ''; this.form.sellerId = 1; this.form.active = true;
  }

  saveProduct(): void {
    const cat = this.admin.categories().find(c => c.slug === this.form.category);
    const catId = cat?.id || 1;
    const productData = {
      title: this.sanitizeService.sanitizeText(this.form.name),
      name: this.sanitizeService.sanitizeText(this.form.name),
      description: this.sanitizeService.sanitizeText(this.form.description),
      price: this.sanitizeService.sanitizeNumber(this.form.price),
      comparePrice: this.form.comparePrice ? this.sanitizeService.sanitizeNumber(this.form.comparePrice) : undefined,
      category: this.sanitizeService.sanitizeText(this.form.category),
      stock: this.sanitizeService.sanitizeNumber(this.form.stock),
      brand: this.sanitizeService.sanitizeText(this.form.brand),
      sellerId: this.sanitizeService.sanitizeNumber(this.form.sellerId) || 1,
      active: this.form.active,
      images: [this.sanitizeService.sanitizeUrl(this.form.imageUrl) || `https://picsum.photos/seed/${Date.now()}/600/600`],
      thumbnail: this.sanitizeService.sanitizeUrl(this.form.imageUrl) || `https://picsum.photos/seed/${Date.now()}/600/600`,
    };
    const editId = this.editingProduct()?.id;
    const obs = editId ? this.admin.updateProduct(editId, productData) : this.admin.createProduct(productData);
    obs.subscribe({
      next: (saved: any) => {
        if (editId) {
          this.admin.products.update(ps => ps.map(p => p.id === editId ? { ...p, ...productData, categoryId: catId } : p));
        } else {
          this.admin.products.update(ps => [...ps, { ...productData, id: saved.id || Date.now(), categoryId: catId, avgRating: 0, reviewCount: 0, createdAt: new Date().toISOString(), tags: [], sellerName: 'Admin' }]);
        }
        this.closeModal();
      }
    });
  }

  async deleteProduct(): Promise<void> {
    const product = this.editingProduct();
    if (!product?.id) return;
    const confirmed = await this.dialog.open('Delete Product', `Are you sure you want to delete "${product.name}"? This will hide it from the storefront.`, { confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
    if (!confirmed) return;
    this.admin.toggleProductActive(product.id, false).subscribe(() => {
      this.admin.products.update(ps => ps.map(p => p.id === product.id ? { ...p, active: false } : p));
      this.closeModal();
    });
  }

  toggleProductActive(product: Product): void {
    const newActive = product.active === false;
    this.admin.toggleProductActive(product.id, newActive).subscribe(() => {
      this.admin.products.update(ps => ps.map(p => p.id === product.id ? { ...p, active: newActive } : p));
    });
  }
}
