import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckoutStep } from '../../../core/services/checkout.service';

const STEPS = ['Shipping', 'Payment', 'Confirmation'] as const;

@Component({
  selector: 'app-checkout-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-stepper.component.html',
  styleUrl: './checkout-stepper.component.scss'
})
export class CheckoutStepperComponent {
  readonly currentStep = input<CheckoutStep>(1);
  protected readonly labels = STEPS;
}