import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div class="admin-modal-backdrop" (click)="onCancel()"></div>
      <div class="admin-confirm-dialog" role="dialog">
        <div class="admin-confirm-content">
          <div class="admin-confirm-icon-row">
            <div class="admin-confirm-icon-circle" [class.danger]="type() === 'danger'" [class.warning]="type() === 'warning'">
              <i class="bi" [class.bi-exclamation-triangle]="type() === 'danger'" [class.bi-question-circle]="type() !== 'danger'"></i>
            </div>
          </div>
          <h3 class="admin-confirm-title">{{ title() }}</h3>
          <p class="admin-confirm-message">{{ message() }}</p>
          <div class="admin-confirm-actions">
            <button class="admin-confirm-btn admin-confirm-btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="admin-confirm-btn" [class.admin-confirm-btn-danger]="type() === 'danger'" (click)="onConfirm()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1040;
    }
    .admin-confirm-dialog {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      z-index: 1050; width: 90%; max-width: 400px;
    }
    .admin-confirm-content {
      background: #FFFFFF; border-radius: 8px; padding: 32px 24px 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15); text-align: center;
    }
    .admin-confirm-icon-row { margin-bottom: 16px; }
    .admin-confirm-icon-circle {
      width: 56px; height: 56px; border-radius: 50%;
      background: #FAEEDA; display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
      i { font-size: 1.5rem; color: #633806; }
      &.danger { background: #FCEBEB; i { color: #791F1F; } }
      &.warning { background: #FAEEDA; i { color: #633806; } }
    }
    .admin-confirm-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.125rem; font-weight: 700; margin: 0 0 8px; color: #0D0D0D;
    }
    .admin-confirm-message {
      font-size: 13px; color: #6B5C3E; margin: 0 0 24px; line-height: 1.5;
    }
    .admin-confirm-actions { display: flex; gap: 8px; justify-content: center; }
    .admin-confirm-btn {
      padding: 9px 24px; border-radius: 4px; font-size: 12px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
      border: none; background: #C8A96E; color: #0D0D0D;
      transition: background 200ms ease;
      &:hover { background: #8B6914; }
    }
    .admin-confirm-btn-cancel {
      background: #FAFAF8; color: #1A1512; border: 0.5px solid #E8E0D4;
      &:hover { background: #F0EBE3; }
    }
    .admin-confirm-btn-danger {
      background: #791F1F; color: #FFFFFF;
      &:hover { background: #5A1515; }
    }
  `]
})
export class AdminConfirmDialogComponent {
  readonly show = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly confirmLabel = signal('Confirm');
  readonly type = signal<'danger' | 'warning' | 'info'>('warning');
  readonly confirm = output<void>();
  readonly cancel = output<void>();

  open(opts: { title: string; message: string; confirmLabel?: string; type?: 'danger' | 'warning' | 'info' }): void {
    this.title.set(opts.title);
    this.message.set(opts.message);
    this.confirmLabel.set(opts.confirmLabel || 'Confirm');
    this.type.set(opts.type || 'warning');
    this.show.set(true);
  }

  close(): void {
    this.show.set(false);
  }

  onConfirm(): void {
    this.confirm.emit();
    this.show.set(false);
  }

  onCancel(): void {
    this.cancel.emit();
    this.show.set(false);
  }
}
