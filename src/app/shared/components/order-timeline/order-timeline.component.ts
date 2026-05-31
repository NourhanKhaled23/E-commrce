import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimelineEvent {
  status: string;
  timestamp: string;
  note: string;
  completed: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ICONS: Record<string, string> = {
  placed: 'bi-bag-check',
  confirmed: 'bi-check-circle',
  processing: 'bi-gear',
  shipped: 'bi-truck',
  out_for_delivery: 'bi-geo-alt',
  delivered: 'bi-house-check',
  cancelled: 'bi-x-circle',
};

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline">
      @for (event of timeline(); track $index) {
        <div class="timeline-item" [class.completed]="event.completed" [class.active]="isLatest($index)">
          <div class="timeline-marker">
            <div class="marker-dot">
              @if (event.completed) {
                <i class="bi bi-check-lg"></i>
              } @else {
                <i class="bi" [class]="getIcon(event.status)"></i>
              }
            </div>
            @if (!isLast($index) && event.completed) {
              <div class="marker-line"></div>
            }
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-label">{{ getLabel(event.status) }}</span>
              <span class="timeline-time">{{ event.timestamp | date:'MMM d, y h:mm a' }}</span>
            </div>
            @if (event.note) {
              <p class="timeline-note">{{ event.note }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline { padding: 8px 0; }
    .timeline-item {
      display: flex; gap: 16px; position: relative;
      padding-bottom: 24px;
    }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-marker {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; width: 32px;
    }
    .marker-dot {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; border: 2px solid var(--color-border);
      background: var(--color-bg-card); color: var(--color-text-hint);
      transition: all 0.3s ease; z-index: 1;
    }
    .timeline-item.completed .marker-dot {
      background: var(--color-accent); border-color: var(--color-accent);
      color: var(--color-primary);
    }
    .timeline-item.active .marker-dot {
      border-color: var(--color-accent); color: var(--color-accent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent);
    }
    .marker-line {
      width: 2px; flex: 1; background: var(--color-accent);
      margin-top: 4px; min-height: 20px;
    }
    .timeline-content { flex: 1; padding-top: 4px; }
    .timeline-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .timeline-label { font-size: 13px; font-weight: 600; color: var(--color-text-body); }
    .timeline-item.completed .timeline-label { color: var(--color-accent-dark); }
    .timeline-time { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
    .timeline-note { font-size: 12px; color: var(--color-text-muted); margin: 4px 0 0; }
  `]
})
export class OrderTimelineComponent {
  timeline = input.required<TimelineEvent[]>();

  getLabel(status: string): string {
    return STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getIcon(status: string): string {
    return STATUS_ICONS[status] || 'bi-circle';
  }

  isLatest(index: number): boolean {
    const events = this.timeline();
    return index === events.length - 1;
  }

  isLast(index: number): boolean {
    return index === this.timeline().length - 1;
  }
}
