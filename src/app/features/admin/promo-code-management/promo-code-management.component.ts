import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PromoCode } from '../../../core/models/order.model';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SanitizeService } from '../../../core/services/sanitize.service';

@Component({
  selector: 'app-promo-code-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './promo-code-management.component.html',
  styleUrl: './promo-code-management.component.scss',
})
export class PromoCodeManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  private readonly sanitizeService = inject(SanitizeService);

  protected promoCodes = signal<PromoCode[]>([]);
  protected loading = signal(true);
  protected showModal = signal(false);
  protected editingCode = signal<PromoCode | null>(null);
  protected saving = signal(false);

  protected promoForm!: FormGroup;
  protected sortField = signal('id');
  protected sortDir = signal<'asc'|'desc'>('asc');
  protected page = signal(1);
  protected pageSize = 10;

  ngOnInit(): void {
    this.promoForm = this.fb.group({
      code:        ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{2,20}$/)]],
      type:        ['percentage', Validators.required],
      value:       [null, [Validators.required, Validators.min(0.01)]],
      minAmount:   [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      active:      [true],
      expiry:      [''],
    });
    this.loadCodes();
  }

  private loadCodes(): void {
    this.loading.set(true);
    this.http.get<PromoCode[]>('/api/promo-codes').subscribe({
      next: (codes) => { this.promoCodes.set(codes); this.loading.set(false); },
      error: () => { this.toast.show('Failed to load promo codes', 'error'); this.loading.set(false); }
    });
  }

  get paginatedCodes(): PromoCode[] {
    const codes = [...this.promoCodes()];
    const key = this.sortField();
    codes.sort((a, b) => {
      const va = (a as any)[key] ?? '';
      const vb = (b as any)[key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return this.sortDir() === 'asc' ? cmp : -cmp;
    });
    const start = (this.page() - 1) * this.pageSize;
    return codes.slice(start, start + this.pageSize);
  }

  sort(field: string): void {
    if (this.sortField() === field) { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }

  openAdd(): void {
    this.editingCode.set(null);
    this.promoForm.reset({ type: 'percentage', value: null, minAmount: 0, active: true, expiry: '' });
    this.promoForm.get('code')?.enable();
    this.showModal.set(true);
  }

  openEdit(code: PromoCode): void {
    this.editingCode.set(code);
    this.promoForm.patchValue({
      code: code.code, type: code.type, value: code.value,
      minAmount: code.minAmount, description: code.description,
      active: code.active ?? true, expiry: code.expiry ?? '',
    });
    this.promoForm.get('code')?.disable();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCode.set(null);
    this.promoForm.get('code')?.enable();
  }

  savePromo(): void {
    if (this.promoForm.invalid) { this.promoForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const editing = this.editingCode();
    const payload = { ...this.promoForm.getRawValue() };
    payload.code = this.sanitizeService.sanitizeText(payload.code?.toUpperCase() || '');
    payload.description = this.sanitizeService.sanitizeText(payload.description || '');
    payload.value = this.sanitizeService.sanitizeNumber(payload.value);
    payload.minAmount = this.sanitizeService.sanitizeNumber(payload.minAmount);

    if (editing?.id) {
      this.http.put<PromoCode>(`/api/promo-codes/${editing.id}`, payload).subscribe({
        next: (updated) => {
          this.promoCodes.update(list => list.map(p => p.id === editing.id ? { ...p, ...updated } : p));
          this.saving.set(false); this.closeModal();
          this.toast.show('Promo code updated', 'success');
        },
        error: () => { this.saving.set(false); this.toast.show('Failed to update', 'error'); }
      });
    } else {
      this.http.post<PromoCode>('/api/promo-codes', payload).subscribe({
        next: (created) => {
          this.promoCodes.update(list => [created, ...list]);
          this.saving.set(false); this.closeModal();
          this.toast.show('Promo code created', 'success');
        },
        error: () => { this.saving.set(false); this.toast.show('Failed to create', 'error'); }
      });
    }
  }

  toggleActive(code: PromoCode): void {
    const updated = { ...code, active: !code.active };
    this.http.put<PromoCode>(`/api/promo-codes/${code.id}`, updated).subscribe({
      next: () => {
        this.promoCodes.update(list => list.map(p => p.id === code.id ? updated : p));
        this.toast.show(`"${code.code}" ${updated.active ? 'activated' : 'deactivated'}`, 'info');
      },
      error: () => this.toast.show('Failed to update status', 'error')
    });
  }

  async confirmDelete(code: PromoCode): Promise<void> {
    const confirmed = await this.dialog.open('Delete Promo Code', `Are you sure you want to delete "${code.code}"? This action cannot be undone.`, { confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
    if (!confirmed) return;
    this.http.delete(`/api/promo-codes/${code.id}`).subscribe({
      next: () => {
        this.promoCodes.update(list => list.filter(p => p.id !== code.id));
        this.toast.show(`"${code.code}" deleted`, 'success');
      },
      error: () => this.toast.show('Failed to delete', 'error')
    });
  }

  get f() { return this.promoForm.controls; }
}
