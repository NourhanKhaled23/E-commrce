import { Injectable, signal, computed, inject, isDevMode } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private _subscribers = signal<string[]>([]);
  readonly subscribers = this._subscribers.asReadonly();
  
  private notification = inject(NotificationService);

  constructor() {
    this.restoreState();
  }

  private restoreState(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('newsletter_subscribers');
        if (stored) {
          this._subscribers.set(JSON.parse(stored));
        }
      } catch (e) {
        if (isDevMode()) console.error('Failed to parse newsletter subscribers', e);
      }
    }
  }

  private saveState(subs: string[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('newsletter_subscribers', JSON.stringify(subs));
    }
  }

  subscribe(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.notification.show('Please enter a valid email address.', 'error');
      return false;
    }

    const current = this._subscribers();
    if (current.includes(email)) {
      this.notification.show('This email is already subscribed!', 'info');
      return true;
    }

    const updated = [...current, email];
    this._subscribers.set(updated);
    this.saveState(updated);
    this.notification.show('Thank you for subscribing to our newsletter!', 'success');
    return true;
  }

  unsubscribe(email: string): void {
    const current = this._subscribers();
    const updated = current.filter(e => e !== email);
    this._subscribers.set(updated);
    this.saveState(updated);
    this.notification.show('You have been unsubscribed from our newsletter.', 'info');
  }
}
