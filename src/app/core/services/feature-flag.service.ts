import { Injectable, signal, computed } from '@angular/core';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  percentage?: number;
}

/**
 * Feature Flag Service — simple A/B testing and feature toggle infrastructure.
 * Flags are stored in localStorage and can be toggled via the admin panel or console.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private _flags = signal<Map<string, FeatureFlag>>(new Map());
  readonly flags = this._flags.asReadonly();

  private readonly STORAGE_KEY = 'feature_flags';

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FeatureFlag[];
        const map = new Map(parsed.map(f => [f.key, f]));
        this._flags.set(map);
      }
    } catch { /* ignore */ }
  }

  private persist(): void {
    const arr = Array.from(this._flags().values());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(arr));
  }

  /**
   * Check if a feature flag is enabled.
   */
  isEnabled(key: string): boolean {
    const flag = this._flags().get(key);
    return flag?.enabled ?? false;
  }

  /**
   * Get the variant for a flag (e.g. 'A', 'B', 'control').
   */
  getVariant(key: string): string | null {
    return this._flags().get(key)?.variant ?? null;
  }

  /**
   * Get a flag by key.
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this._flags().get(key);
  }

  /**
   * Set a feature flag.
   */
  setFlag(key: string, enabled: boolean, variant?: string, percentage?: number): void {
    const flags = new Map(this._flags());
    flags.set(key, { key, enabled, variant, percentage });
    this._flags.set(flags);
    this.persist();
  }

  /**
   * Toggle a flag on/off.
   */
  toggleFlag(key: string): void {
    const flags = new Map(this._flags());
    const existing = flags.get(key);
    flags.set(key, { key, enabled: !(existing?.enabled ?? false), variant: existing?.variant, percentage: existing?.percentage });
    this._flags.set(flags);
    this.persist();
  }

  /**
   * Remove a flag.
   */
  removeFlag(key: string): void {
    const flags = new Map(this._flags());
    flags.delete(key);
    this._flags.set(flags);
    this.persist();
  }

  /**
   * Assign a user to a variant based on a hash of their user ID.
   * Returns the variant name.
   */
  assignVariant(key: string, variants: string[], userId?: number): string {
    const hash = userId !== undefined ? userId : Math.floor(Math.random() * 1000);
    const index = hash % variants.length;
    const variant = variants[index];
    this.setFlag(key, true, variant);
    return variant;
  }

  /**
   * Get all flags as an array (useful for admin display).
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this._flags().values());
  }

  /**
   * Reset all flags.
   */
  resetAll(): void {
    this._flags.set(new Map());
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
