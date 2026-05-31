import { Injectable, signal } from '@angular/core';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate Limiting Service — client-side rate limiting for sensitive endpoints.
 * Prevents brute-force attacks on login/register.
 */
@Injectable({ providedIn: 'root' })
export class RateLimitService {
  private _limits = signal<Map<string, RateLimitEntry>>(new Map());

  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if an action is allowed for the given key.
   * Returns true if allowed, false if rate limited.
   */
  isAllowed(key: string): boolean {
    const limits = new Map(this._limits());
    const now = Date.now();
    const entry = limits.get(key);

    if (!entry || now > entry.resetAt) {
      // Window expired or first attempt — allow and reset
      limits.set(key, { count: 1, resetAt: now + this.WINDOW_MS });
      this._limits.set(limits);
      return true;
    }

    if (entry.count >= this.MAX_ATTEMPTS) {
      return false; // Rate limited
    }

    entry.count++;
    limits.set(key, entry);
    this._limits.set(limits);
    return true;
  }

  /**
   * Get remaining attempts for a key.
   */
  getRemainingAttempts(key: string): number {
    const limits = this._limits();
    const entry = limits.get(key);
    if (!entry || Date.now() > entry.resetAt) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - entry.count);
  }

  /**
   * Get time until reset (in seconds) for a key.
   */
  getResetTime(key: string): number {
    const limits = this._limits();
    const entry = limits.get(key);
    if (!entry) return 0;
    const remaining = entry.resetAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Reset rate limit for a key (e.g., after successful login).
   */
  reset(key: string): void {
    const limits = new Map(this._limits());
    limits.delete(key);
    this._limits.set(limits);
  }
}
