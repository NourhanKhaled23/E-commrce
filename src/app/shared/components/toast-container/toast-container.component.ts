import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  protected readonly notificationService = inject(NotificationService);
  private lastCount = 0;

  constructor() {
    effect(() => {
      const list = this.notificationService.toasts();
      if (list.length > this.lastCount) {
        const newest = list[list.length - 1];
        setTimeout(() => {
          this.dismiss(newest.id);
        }, 4000);
      }
      this.lastCount = list.length;
    });
  }

  dismiss(id: number): void {
    this.notificationService.dismissToast(id);
  }
}
