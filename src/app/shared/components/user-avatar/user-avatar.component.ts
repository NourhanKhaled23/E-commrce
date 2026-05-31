import { Component, input, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarService } from '../../../core/services/avatar.service';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-wrapper"
         [class.clickable]="clickable()"
         [style.width.px]="size()"
         [style.height.px]="size()">
      @if (src()) {
        <img class="avatar-img" [src]="src()!" [alt]="name()" (error)="onImgError()" />
      } @else {
        <div class="avatar-initials" [style.font-size.px]="size() * 0.36">
          {{ initials() }}
        </div>
      }
      @if (showBadge()) {
        <span class="avatar-badge" [class]="'badge-' + role()"></span>
      }
    </div>
  `,
  styles: [`
    .avatar-wrapper {
      border-radius: 50%;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      border: 1.5px solid var(--color-accent, #C8A96E);
      background: #2A1F14;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-initials {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: #C8A96E;
      font-family: var(--font-serif, Georgia, serif);
    }
    .avatar-badge {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; border-radius: 50%;
      border: 1.5px solid #fff;
    }
    .badge-admin { background: #C8A96E; }
    .badge-seller { background: #2C3E6B; }
    .badge-customer { background: #1A4A2E; }
    .clickable { cursor: pointer; transition: opacity 150ms ease; }
    .clickable:hover { opacity: 0.85; }
  `]
})
export class UserAvatarComponent {
  readonly size = input<number>(36);
  readonly name = input<string>('User');
  readonly role = input<string>('customer');
  readonly userId = input<number>(0);
  readonly clickable = input<boolean>(false);
  readonly showBadge = input<boolean>(false);

  private readonly avatarService = inject(AvatarService);
  protected src = signal<string | null>(null);
  protected initials = computed(() => this.avatarService.getInitials(this.name()));

  constructor() {
    effect(() => {
      const id = this.userId();
      if (id) {
        this.src.set(this.avatarService.getAvatar(id));
      }
    });
  }

  protected onImgError(): void {
    this.src.set(null);
  }
}
