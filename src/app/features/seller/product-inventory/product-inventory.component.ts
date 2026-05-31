import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../core/services/seller.service';
import { ToastService } from '../../../core/services/toast.service';
import { SanitizeService } from '../../../core/services/sanitize.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-inventory.component.html',
  styleUrls: ['./product-inventory.component.scss']
})
export class ProductInventoryComponent implements OnInit {
  readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  private readonly sanitizeService = inject(SanitizeService);

  // Filter state as signals so computed() tracks them reactively
  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');

  // Stock editing
  readonly editingStockId = signal<number | null>(null);
  editStockValue = 0;

  // Modal
  readonly showModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);

  // Form fields
  formName = '';
  formDescription = '';
  formCategory = '';
  formPrice = 0;
  formStock = 0;
  formThumbnail = '';
  formTags = '';

  // ── Reactive computed signals — no setTimeout, no race condition ──
  readonly activeProducts = computed(() =>
    this.seller.myProducts().filter(p => p.active !== false)
  );

  readonly inactiveProducts = computed(() =>
    this.seller.myProducts().filter(p => p.active === false)
  );

  readonly filteredProducts = computed(() => {
    let products = this.seller.myProducts();

    const status = this.statusFilter();
    if (status === 'active') {
      products = products.filter(p => p.active !== false);
    } else if (status === 'inactive') {
      products = products.filter(p => p.active === false);
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return products;
  });

  ngOnInit(): void {
    this.seller.loadMyProducts();
    // No setTimeout needed — filteredProducts is a computed() that
    // automatically re-evaluates when seller.myProducts() changes.
  }

  // Stock editing
  startStockEdit(product: Product): void {
    this.editingStockId.set(product.id);
    this.editStockValue = product.stock;
  }

  saveStock(productId: number): void {
    this.seller.updateStock(productId, this.editStockValue);
    this.editingStockId.set(null);
  }

  cancelStockEdit(): void {
    this.editingStockId.set(null);
  }

  // Modal
  openAddModal(): void {
    this.editingProduct.set(null);
    this.resetForm();
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.formName = product.name;
    this.formDescription = product.description;
    this.formCategory = product.category;
    this.formPrice = product.price;
    this.formStock = product.stock;
    this.formThumbnail = product.thumbnail;
    this.formTags = product.tags.join(', ');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  saveProduct(): void {
    const productData: Partial<Product> = {
      name: this.sanitizeService.sanitizeText(this.formName),
      description: this.sanitizeService.sanitizeText(this.formDescription),
      category: this.sanitizeService.sanitizeText(this.formCategory),
      price: this.sanitizeService.sanitizeNumber(this.formPrice),
      stock: this.sanitizeService.sanitizeNumber(this.formStock),
      thumbnail: this.sanitizeService.sanitizeUrl(this.formThumbnail) || 'https://via.placeholder.com/100',
      images: this.formThumbnail ? [this.sanitizeService.sanitizeUrl(this.formThumbnail)] : [],
      tags: this.formTags.split(',').map(t => this.sanitizeService.sanitizeText(t.trim())).filter(Boolean),
      active: true,
    };

    const editing = this.editingProduct();
    if (editing) {
      this.seller.updateProduct(editing.id, productData).subscribe({
        next: () => this.closeModal(),
      });
    } else {
      this.seller.createProduct(productData).subscribe({
        next: () => this.closeModal(),
      });
    }
  }

  deactivateProduct(id: number): void {
    this.seller.deleteProduct(id);
    // seller.myProducts signal is updated inside deleteProduct() via tap(),
    // so filteredProducts computed() re-evaluates automatically.
  }

  private resetForm(): void {
    this.formName = '';
    this.formDescription = '';
    this.formCategory = '';
    this.formPrice = 0;
    this.formStock = 0;
    this.formThumbnail = '';
    this.formTags = '';
  }
}
