import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  readonly rating = input<number>(0);
  readonly readonly = input<boolean>(true);
  readonly ratingChange = output<number>();

  onStarClick(ratingValue: number): void {
    if (!this.readonly()) {
      this.ratingChange.emit(ratingValue);
    }
  }
}
