import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-share.component.html',
  styleUrls: ['./social-share.component.scss']
})
export class SocialShareComponent {
  readonly shareTitle = input<string>('Check out this product!');
  readonly shareUrl = input<string>('');

  private readonly notificationService = inject(NotificationService);

  share(): void {
    const url = this.shareUrl() || (typeof window !== 'undefined' ? window.location.href : '');
    const title = this.shareTitle();

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: title,
        url: url
      }).then(() => {
        // Share succeeded
      }).catch(() => {
        // Share cancelled or failed
      });
    } else {
      // Fallback: Copy to clipboard
      this.copyToClipboard(url);
    }
  }

  private copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.notificationService.show('Link copied to clipboard!', 'success');
      }).catch((err) => {
        console.error('Failed to copy text:', err);
        this.notificationService.show('Failed to copy link', 'error');
      });
    } else {
      // Fallback fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.notificationService.show('Link copied to clipboard!', 'success');
      } catch {
        this.notificationService.show('Failed to copy link', 'error');
      }
      document.body.removeChild(textArea);
    }
  }
}
