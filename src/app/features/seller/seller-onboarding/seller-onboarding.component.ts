import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerService } from '../../../core/services/seller.service';
import { BankDetails } from '../../../core/models/seller.model';

@Component({
  selector: 'app-seller-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seller-onboarding.component.html',
  styleUrls: ['./seller-onboarding.component.scss']
})
export class SellerOnboardingComponent {
  private readonly sellerService = inject(SellerService);
  private readonly router = inject(Router);

  readonly steps = [
    { num: 1, label: 'Shop Info' },
    { num: 2, label: 'Bank Details' },
    { num: 3, label: 'Review' },
  ];

  currentStep = signal(1);
  submitting = signal(false);

  // Step 1 fields
  shopName = signal('');
  description = signal('');
  logoUrl = signal('');

  // Step 2 fields
  accountName = signal('');
  accountNumber = signal('');
  bank = signal('');

  nextStep(): void {
    if (this.currentStep() < 3) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  maskAccount(acc: string): string {
    if (acc.length <= 4) return acc;
    return '•'.repeat(acc.length - 4) + acc.slice(-4);
  }

  submit(): void {
    this.submitting.set(true);
    const bankDetails: BankDetails = {
      accountName: this.accountName(),
      accountNumber: this.accountNumber(),
      bank: this.bank(),
    };

    this.sellerService.submitOnboarding({
      shopName: this.shopName(),
      description: this.description(),
      logoUrl: this.logoUrl(),
      bankDetails,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/seller/dashboard']);
      },
      error: () => this.submitting.set(false),
    });
  }
}
