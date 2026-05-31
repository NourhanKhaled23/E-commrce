import { Component, output, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Address } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shipping-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping-form.component.html',
  styleUrl: './shipping-form.component.css',
})
export class ShippingFormComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly proceed = output<Address>();
  protected readonly goBack = output<void>();

  protected form = signal<Address>({ street: '', city: '', state: '', zipCode: '', country: 'United States' });
  protected useSaved = signal(false);
  protected submitted = signal(false);

  ngOnInit(): void {
    const u = this.authService.user();
    if (u?.address?.street) {
      this.form.set({ ...u.address });
      this.useSaved.set(true);
    }
  }

  useSavedAddress(): void {
    const u = this.authService.user();
    if (u?.address) {
      this.form.set({ ...u.address });
      this.useSaved.set(true);
    }
  }

  onProceed(): void {
    this.submitted.set(true);
    const f = this.form();
    if (f.street && f.city && f.zipCode && f.country) {
      this.proceed.emit(f);
    }
  }
}