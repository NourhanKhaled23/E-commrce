import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this._isDark.set(saved === 'dark');
    } else {
      this._isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    this.applyTheme();
  }

  toggle(): void {
    this._isDark.update(v => !v);
    localStorage.setItem('theme', this._isDark() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this._isDark());
  }
}
