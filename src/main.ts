import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app.component';
import { routes } from './app/app.routes';
import { mockApiInterceptor } from './app/core/interceptors/mock-api.interceptor';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { csrfInterceptor } from './app/core/interceptors/csrf.interceptor';
import { httpCacheInterceptor } from './app/core/interceptors/http-cache.interceptor';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { Title } from '@angular/platform-browser';

function initializeTranslate(translate: TranslateService): () => Promise<void> {
  return () => {
    const saved = localStorage.getItem('lang') || 'en';
    translate.setDefaultLang('en');
    translate.use(saved);
    const htmlTag = document.documentElement;
    htmlTag.setAttribute('lang', saved);
    if (saved === 'ar') htmlTag.setAttribute('dir', 'rtl');
    return Promise.resolve();
  };
}

function initializeTitle(title: Title): () => Promise<void> {
  return () => {
    title.setTitle('Open Fashion — Premium Fashion Store');
    return Promise.resolve();
  };
}

bootstrapApplication(App, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor, csrfInterceptor, httpCacheInterceptor, mockApiInterceptor, errorInterceptor])),
    provideTranslateService({ fallbackLang: 'en' }),
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslate,
      deps: [TranslateService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTitle,
      deps: [Title],
      multi: true,
    },
  ],
}).catch((err: unknown) => {
  console.error('Application bootstrap failed:', err);
  document.body.innerHTML = `<div style="font-family:monospace;padding:2rem;color:#c00"><h2>Bootstrap Error</h2><pre>${err instanceof Error ? err.stack || err.message : String(err)}</pre></div>`;
});
