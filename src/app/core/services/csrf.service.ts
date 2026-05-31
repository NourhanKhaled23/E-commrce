import { Injectable, signal } from '@angular/core';

/**
 * CSRF Token Service — generates and manages CSRF tokens.
 * In production, the token would come from the server via a cookie or meta tag.
 */
@Injectable({ providedIn: 'root' })
export class CsrfService {
  private _token = signal('');

  constructor() {
    this.generateToken();
  }

  private generateToken(): void {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    this._token.set(token);
    // Also store in cookie for server-side verification
    document.cookie = `csrf_token=${token}; SameSite=Strict; Path=/`;
  }

  getToken(): string {
    return this._token();
  }

  validateToken(token: string): boolean {
    return this._token() === token;
  }

  refresh(): void {
    this.generateToken();
  }
}
