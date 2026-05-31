import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User, SavedCard } from '../../core/models/user.model';
import { LoyaltyDashboardComponent } from '../../shared/components/loyalty-dashboard/loyalty-dashboard.component';
import { ToastService } from '../../core/services/toast.service';
import { AvatarService } from '../../core/services/avatar.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule, LoyaltyDashboardComponent, UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly avatarService = inject(AvatarService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  profileForm!: FormGroup;
  cardForm!: FormGroup;
  isSaving = signal(false);
  saveMessage = signal('');
  showAddCard = signal(false);
  savingCard = signal(false);
  uploadError = signal<string | null>(null);
  avatarPreview = signal<string | null>(null);

  readonly user = this.authService.user;
  readonly wishlistCount = computed(() => this.authService.user()?.wishlist.length ?? 0);

  ngOnInit(): void {
    const u = this.authService.user();
    if (u) {
      this.avatarPreview.set(this.avatarService.getAvatar(u.id));
    }

    this.profileForm = this.fb.group({
      name: [u?.name || '', Validators.required],
      email: [{ value: u?.email || '', disabled: true }],
      phone: [u?.phone || '', Validators.pattern('^[+]?[0-9\\s-]{7,20}$')],
      street: [u?.address?.street || ''],
      city: [u?.address?.city || ''],
      state: [u?.address?.state || ''],
      zipCode: [u?.address?.zipCode || ''],
      country: [u?.address?.country || '']
    });

    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      nameOnCard: ['', Validators.required],
      expMonth:   [null, [Validators.required, Validators.min(1), Validators.max(12)]],
      expYear:    [null, [Validators.required, Validators.min(new Date().getFullYear())]],
      brand:      ['Visa'],
    });
  }

  triggerUpload(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    try {
      const base64 = await this.avatarService.processFile(file);
      const userId = this.authService.user()!.id;
      this.avatarService.saveAvatar(userId, base64);
      this.avatarPreview.set(base64);
      this.toast.show('Profile photo updated!', 'success');
    } catch (err: any) {
      this.uploadError.set(err.message);
    }
  }

  removeAvatar(): void {
    const userId = this.authService.user()!.id;
    this.avatarService.removeAvatar(userId);
    this.avatarPreview.set(null);
    this.toast.show('Profile photo removed', 'info');
  }

  onSubmit(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.saveMessage.set('');

    const v = this.profileForm.value;
    this.authService.updateProfile({
      name: v.name,
      phone: v.phone,
      address: { street: v.street, city: v.city, state: v.state, zipCode: v.zipCode, country: v.country }
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveMessage.set('Profile updated successfully');
        setTimeout(() => this.saveMessage.set(''), 3000);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveMessage.set('Failed to update profile');
      }
    });
  }

  openAddCard(): void {
    this.cardForm.reset({ brand: 'Visa' });
    this.showAddCard.set(true);
  }

  cancelAddCard(): void { this.showAddCard.set(false); }

  addCard(): void {
    if (this.cardForm.invalid) { this.cardForm.markAllAsTouched(); return; }
    const v = this.cardForm.value;
    const newCard: SavedCard = {
      id: `card_${Date.now()}`,
      last4: v.cardNumber.slice(-4),
      brand: v.brand,
      expMonth: +v.expMonth,
      expYear: +v.expYear,
      isDefault: (this.user()?.savedCards?.length ?? 0) === 0,
    };
    const currentCards = this.user()?.savedCards ?? [];
    this.savingCard.set(true);
    this.authService.updateProfile({ savedCards: [...currentCards, newCard] }).subscribe({
      next: () => {
        this.savingCard.set(false);
        this.showAddCard.set(false);
        this.toast.show('Card added successfully', 'success');
      },
      error: () => { this.savingCard.set(false); this.toast.show('Failed to add card', 'error'); }
    });
  }

  removeCard(cardId: string): void {
    const updated = (this.user()?.savedCards ?? []).filter(c => c.id !== cardId);
    this.authService.updateProfile({ savedCards: updated }).subscribe({
      next: () => this.toast.show('Card removed', 'info'),
      error: () => this.toast.show('Failed to remove card', 'error')
    });
  }

  setDefaultCard(cardId: string): void {
    const updated = (this.user()?.savedCards ?? []).map(c => ({ ...c, isDefault: c.id === cardId }));
    this.authService.updateProfile({ savedCards: updated }).subscribe({
      next: () => this.toast.show('Default card updated', 'success'),
      error: () => this.toast.show('Failed to update default card', 'error')
    });
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }

  get f() { return this.profileForm.controls; }
  get cf() { return this.cardForm.controls; }
}
