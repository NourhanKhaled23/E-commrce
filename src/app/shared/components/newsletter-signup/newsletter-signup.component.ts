import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NewsletterService } from '../../../core/services/newsletter.service';

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './newsletter-signup.component.html',
  styleUrl: './newsletter-signup.component.css'
})
export class NewsletterSignupComponent implements OnInit {
  isVisible = signal(false);
  email = signal('');
  
  private newsletterService = inject(NewsletterService);

  ngOnInit(): void {
    if (typeof sessionStorage !== 'undefined') {
      const dismissed = sessionStorage.getItem('newsletter_dismissed');
      if (!dismissed) {
        // Delay showing the banner for better UX
        setTimeout(() => this.isVisible.set(true), 3000);
      }
    }
  }

  dismiss(): void {
    this.isVisible.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('newsletter_dismissed', 'true');
    }
  }

  subscribe(): void {
    const success = this.newsletterService.subscribe(this.email());
    if (success) {
      this.dismiss();
    }
  }
}
