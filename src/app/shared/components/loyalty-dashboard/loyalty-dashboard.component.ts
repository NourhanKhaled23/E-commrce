import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoyaltyService, LoyaltyTier } from '../../../core/services/loyalty.service';
import { CartService } from '../../../core/services/cart.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-loyalty-dashboard',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loyalty-dashboard.component.html',
  styleUrl: './loyalty-dashboard.component.css'
})
export class LoyaltyDashboardComponent {
  private readonly loyaltyService = inject(LoyaltyService);
  private readonly cartService = inject(CartService);

  readonly points = this.loyaltyService.points;
  readonly tier = this.loyaltyService.tier;
  readonly nextTier = this.loyaltyService.nextTier;
  readonly pointsToNextTier = this.loyaltyService.pointsToNextTier;
  readonly tierProgress = this.loyaltyService.tierProgress;
  readonly history = this.loyaltyService.history;
  readonly loyaltyDiscount = this.loyaltyService.loyaltyDiscount;

  redeemAmount = signal(100);

  readonly canRedeem = computed(() => this.points() >= this.loyaltyService.POINTS_PER_DOLLAR);
  readonly maxRedeemable = computed(() =>
    Math.floor(this.points() / this.loyaltyService.POINTS_PER_DOLLAR) * this.loyaltyService.POINTS_PER_DOLLAR
  );
  readonly dollarValue = computed(() => this.redeemAmount() / this.loyaltyService.POINTS_PER_DOLLAR);

  tierIcon(tier: LoyaltyTier): string {
    switch (tier) {
      case 'Gold': return 'bi-trophy-fill';
      case 'Silver': return 'bi-award-fill';
      default: return 'bi-star-fill';
    }
  }

  tierColor(tier: LoyaltyTier): string {
    switch (tier) {
      case 'Gold': return '#d4af37';
      case 'Silver': return '#9ca3af';
      default: return '#cd7f32';
    }
  }

  onRedeem(): void {
    const amount = this.redeemAmount();
    const discount = this.loyaltyService.redeemPoints(amount);
    if (discount > 0) {
      this.cartService.applyLoyaltyDiscount(discount);
    }
  }

  updateRedeemAmount(value: string): void {
    const num = Math.max(100, Math.min(Number(value) || 100, this.maxRedeemable()));
    this.redeemAmount.set(num);
  }
}
