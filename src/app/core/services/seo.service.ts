import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const ROUTE_META: Record<string, MetaConfig> = {
  '/': {
    title: 'Open Fashion — Premium Fashion Store',
    description: 'Discover handpicked luxury fashion from the world\'s most coveted designers. Shop clothing, accessories, and more.',
    keywords: 'fashion, luxury, clothing, accessories, premium, designer',
    type: 'website',
  },
  '/products': {
    title: 'Products — Open Fashion',
    description: 'Browse our curated collection of premium fashion products.',
    keywords: 'products, fashion, shopping, store',
  },
  '/cart': {
    title: 'Shopping Cart — Open Fashion',
    description: 'Review your selected items before checkout.',
  },
  '/wishlist': {
    title: 'Wishlist — Open Fashion',
    description: 'Your saved items and favorites.',
  },
  '/orders': {
    title: 'My Orders — Open Fashion',
    description: 'Track and manage your orders.',
  },
  '/auth/login': {
    title: 'Login — Open Fashion',
    description: 'Sign in to your Open Fashion account.',
  },
  '/auth/register': {
    title: 'Register — Open Fashion',
    description: 'Create your Open Fashion account.',
  },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      this.updateMeta(event.urlAfterRedirects);
    });
  }

  updateMeta(url: string, overrides?: MetaConfig): void {
    const base = this.getMetaForUrl(url);
    const config = { ...base, ...overrides };

    if (config.title) {
      this.title.setTitle(config.title);
    }

    this.meta.updateTag({ name: 'description', content: config.description || '' });
    this.meta.updateTag({ name: 'keywords', content: config.keywords || '' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: config.title || '' });
    this.meta.updateTag({ property: 'og:description', content: config.description || '' });
    this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
    if (config.image) this.meta.updateTag({ property: 'og:image', content: config.image });
    if (config.url) this.meta.updateTag({ property: 'og:url', content: config.url });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: config.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title || '' });
    this.meta.updateTag({ name: 'twitter:description', content: config.description || '' });
  }

  private getMetaForUrl(url: string): MetaConfig {
    // Check exact match first
    if (ROUTE_META[url]) return ROUTE_META[url];

    // Check pattern matches
    if (url.startsWith('/products/')) {
      return { title: 'Product Details — Open Fashion', type: 'product' };
    }
    if (url.startsWith('/orders/')) {
      return { title: 'Order Details — Open Fashion' };
    }

    return { title: 'Open Fashion — Premium Fashion Store' };
  }
}
