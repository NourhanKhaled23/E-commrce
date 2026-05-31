import { Injectable, isDevMode, signal } from '@angular/core';
import { Toast } from '../models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this._toasts.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  sendEmail(to: string, subject: string, body: string): void {
    if (isDevMode()) {
      console.log('📧 Email Notification');
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body: ${body}`);
    }
    this.show(`Email sent to ${to}`, 'info');
  }
}