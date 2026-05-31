import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../core/services/newsletter.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-newsletter-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter-page.component.html',
  styleUrl: './newsletter-page.component.css'
})
export class NewsletterPageComponent {
  private readonly newsletterService = inject(NewsletterService);
  private readonly notificationService = inject(NotificationService);

  readonly subscribers = this.newsletterService.subscribers;
  
  subject = signal('');
  body = signal('');
  isSending = signal(false);

  sendNewsletter(): void {
    const currentSubs = this.subscribers();
    if (currentSubs.length === 0) {
      this.notificationService.show('No subscribers to send to!', 'warning');
      return;
    }

    if (!this.subject().trim() || !this.body().trim()) {
      this.notificationService.show('Please fill in subject and body.', 'warning');
      return;
    }

    this.isSending.set(true);

    // Simulate sending delay
    setTimeout(() => {
      this.isSending.set(false);
      this.notificationService.show(`Newsletter sent to ${currentSubs.length} subscribers!`, 'success');
      this.subject.set('');
      this.body.set('');
    }, 1500);
  }
}
