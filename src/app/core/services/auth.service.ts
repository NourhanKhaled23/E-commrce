import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { WishlistService } from './wishlist.service';

export interface AuthEvent {
  type: 'login' | 'logout' | 'session_restore';
  user?: User | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? 'guest');

  /** Observable events for other services that depend on auth state changes.
   *  CartService subscribes to this instead of injecting AuthService directly. */
  readonly events$ = new Subject<AuthEvent>();

  private readonly wishlistService = inject(WishlistService);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        this._user.set(u);
        this.wishlistService.syncFromUser(u.id, u.wishlist);
        this.events$.next({ type: 'session_restore', user: u });
      } catch { localStorage.removeItem('auth_user'); }
    }
  }

  private onLogin(user: User): void {
    const { password, ...safeUser } = user as User & { password?: string };
    localStorage.setItem('auth_user', JSON.stringify(safeUser));
    this._user.set(safeUser as User);
    this.wishlistService.syncFromUser(safeUser.id, safeUser.wishlist);
    this.events$.next({ type: 'login', user: safeUser as User });
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(user => this.onLogin(user))
    );
  }

  register(data: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, data).pipe(
      tap(user => this.onLogin(user))
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, data).pipe(
      tap(updated => {
        localStorage.setItem('auth_user', JSON.stringify(updated));
        this._user.set(updated);
      })
    );
  }

  logout(): void {
    this.events$.next({ type: 'logout', user: null });
    localStorage.removeItem('auth_user');
    this._user.set(null);
  }

  getToken(): string | null {
    return this._user()?.token ?? null;
  }
}
