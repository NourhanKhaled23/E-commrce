import { Component, input, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Review } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { SanitizeService } from '../../../core/services/sanitize.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css',
})
export class ReviewsComponent implements OnInit {
  readonly productId = input.required<number>();
  protected reviews = signal<Review[]>([]);
  protected isLoading = signal(true);
  protected page = signal(1);
  protected readonly pageSize = 4;
  protected readonly paged = computed(() => this.reviews().slice(0, this.page() * this.pageSize));
  protected readonly hasMore = computed(() => this.paged().length < this.reviews().length);

  protected reviewForm!: FormGroup;
  protected submitting = signal(false);
  protected hoverRating = signal(0);
  protected selectedRating = signal(0);

  private readonly http = inject(HttpClient);
  protected readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastService);
  private readonly sanitizeService = inject(SanitizeService);
  private readonly fb = inject(FormBuilder);

  /** True if the logged-in user has a delivered order containing this product */
  protected readonly hasPurchased = computed(() => {
    const user = this.authService.user();
    if (!user) return false;
    return this.orderService.orders().some(
      o => o.userId === user.id &&
           o.status === 'delivered' &&
           o.items.some((i: any) => (i.product?.id ?? i.productId) === this.productId())
    );
  });

  /** True if the user already submitted a review for this product */
  protected readonly alreadyReviewed = computed(() => {
    const user = this.authService.user();
    if (!user) return false;
    return this.reviews().some(r => r.userId === user.id);
  });

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(80)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });
    this.loadReviews();
  }

  private loadReviews(): void {
    this.isLoading.set(true);
    this.http.get<any>(`/api/reviews?productId=${this.productId()}`).subscribe({
      next: (res) => { this.reviews.set(res.reviews); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadMore(): void { this.page.update(p => p + 1); }

  setRating(r: number): void { this.selectedRating.set(r); }
  setHover(r: number): void { this.hoverRating.set(r); }
  clearHover(): void { this.hoverRating.set(0); }

  submitReview(): void {
    if (this.reviewForm.invalid || this.selectedRating() === 0) {
      this.reviewForm.markAllAsTouched();
      if (this.selectedRating() === 0) {
        this.toastService.show('Please select a star rating', 'warning');
      }
      return;
    }
    const user = this.authService.user();
    if (!user) return;

    this.submitting.set(true);
    const body = {
      productId: this.productId(),
      userId: user.id,
      userName: user.name,
      rating: this.selectedRating(),
      comment: this.sanitizeService.sanitizeText(this.reviewForm.value.comment),
      title: this.sanitizeService.sanitizeText(this.reviewForm.value.title),
      date: new Date().toISOString(),
    };

    this.http.post<Review>('/api/reviews', body).subscribe({
      next: (newReview) => {
        this.reviews.update(list => [newReview, ...list]);
        this.reviewForm.reset();
        this.selectedRating.set(0);
        this.submitting.set(false);
        this.toastService.show('Review submitted successfully!', 'success');
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Failed to submit review. Please try again.', 'error');
      }
    });
  }

  get f() { return this.reviewForm.controls; }
}