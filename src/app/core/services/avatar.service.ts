import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly MAX_SIZE_MB = 2;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly STORAGE_KEY = 'user_avatar_';

  getAvatar(userId: number): string | null {
    return localStorage.getItem(`${this.STORAGE_KEY}${userId}`);
  }

  saveAvatar(userId: number, base64: string): void {
    localStorage.setItem(`${this.STORAGE_KEY}${userId}`, base64);
  }

  removeAvatar(userId: number): void {
    localStorage.removeItem(`${this.STORAGE_KEY}${userId}`);
  }

  processFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        reject(new Error('Only JPG, PNG, and WebP images are allowed'));
        return;
      }
      if (file.size > this.MAX_SIZE_MB * 1024 * 1024) {
        reject(new Error(`Image must be smaller than ${this.MAX_SIZE_MB}MB`));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const SIZE = 256;
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d')!;
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
