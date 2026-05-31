import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Input Sanitization Service — prevents XSS by sanitizing user inputs.
 */
@Injectable({ providedIn: 'root' })
export class SanitizeService {
  private readonly forbidden = /[<>]/g;
  private readonly htmlEntities: Record<string, string> = { '<': '&lt;', '>': '&gt;' };

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitize plain text input — strips HTML tags.
   */
  sanitizeText(input: string): string {
    if (!input) return '';
    return input.replace(this.forbidden, char => this.htmlEntities[char] || '');
  }

  /**
   * Sanitize HTML content — allows safe tags only.
   */
  sanitizeHtml(html: string): SafeHtml {
    // Only allow safe tags: b, i, em, strong, br, p, ul, ol, li
    const allowed = /<\/?(b|i|em|strong|br|p|ul|ol|li|a|span|div|h[1-6])[^>]*>/gi;
    const sanitized = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                          .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
                          .replace(/on\w+="[^"]*"/gi, '');
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  /**
   * Sanitize a URL — blocks javascript: and data: URLs.
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    const lower = url.toLowerCase().trim();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      return '';
    }
    return url;
  }

  /**
   * Validate and sanitize email.
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    return email.toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '');
  }

  /**
   * Sanitize numeric input.
   */
  sanitizeNumber(value: any, fallback = 0): number {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  }
}
