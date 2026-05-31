import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Banner } from '../admin.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-banner-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banner-management.component.html',
  styleUrls: ['./banner-management.component.scss']
})
export class BannerManagementComponent implements OnInit {
  readonly admin = inject(AdminService);
  readonly dialog = inject(DialogService);
  readonly showModal = signal(false);
  readonly editingBanner = signal<Banner | null>(null);
  readonly form: any = { title: '', subtitle: '', image: '', link: '', sortOrder: 1, active: true };

  ngOnInit(): void { this.admin.loadAll(); }

  openCreate(): void {
    this.editingBanner.set(null);
    this.form.title = ''; this.form.subtitle = ''; this.form.image = ''; this.form.link = '';
    this.form.sortOrder = (this.admin.banners().length || 0) + 1; this.form.active = true;
    this.showModal.set(true);
  }

  openEdit(banner: Banner): void {
    this.editingBanner.set(banner);
    Object.assign(this.form, banner);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingBanner.set(null); }

  saveBanner(): void {
    const editId = this.editingBanner()?.id;
    const data = { ...this.form } as Banner;
    if (editId) data.id = editId;
    const obs = editId ? this.admin.saveBanner(data) : this.admin.addBanner(data);
    obs.subscribe({
      next: () => {
        const banners = this.admin.banners();
        if (editId) { this.admin.banners.set(banners.map(b => b.id === editId ? { ...b, ...data } : b)); }
        else { this.admin.banners.set([...banners, { ...data, id: Date.now() }]); }
        this.closeModal();
      }
    });
  }

  toggleActive(banner: Banner): void {
    const updated = { ...banner, active: !banner.active };
    this.admin.saveBanner(updated).subscribe(() => {
      this.admin.banners.update(bs => bs.map(b => b.id === banner.id ? updated : b));
    });
  }

  async deleteBanner(id: number): Promise<void> {
    const confirmed = await this.dialog.open('Delete Banner', 'Are you sure you want to delete this banner?', { confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true });
    if (!confirmed) return;
    this.admin.deleteBanner(id).subscribe(() => {
      this.admin.banners.update(bs => bs.filter(b => b.id !== id));
    });
  }
}
