import { Injectable, signal } from '@angular/core';

export interface DialogRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  readonly activeRequest = signal<DialogRequest | null>(null);

  open(title: string, message: string, options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.activeRequest.set({
        title,
        message,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        danger: options?.danger,
        resolve: (value: boolean) => {
          this.activeRequest.set(null);
          resolve(value);
        }
      });
    });
  }
}
