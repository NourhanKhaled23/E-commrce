import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent {
  private readonly translate = inject(TranslateService);

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.translate.use(nextLang);
    this.updateLayoutDirection(nextLang);
  }

  private updateLayoutDirection(lang: string): void {
    const htmlTag = document.documentElement;
    if (lang === 'ar') {
      htmlTag.setAttribute('dir', 'rtl');
      htmlTag.setAttribute('lang', 'ar');
    } else {
      htmlTag.setAttribute('dir', 'ltr');
      htmlTag.setAttribute('lang', 'en');
    }
  }
}
