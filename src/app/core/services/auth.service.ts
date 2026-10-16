import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, map, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, UserRole, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = this.normalizeUser(JSON.parse(savedUser));
        if (parsed.is_active === false) {
          this.clearSession();
        } else {
          this.currentUserSubject.next(parsed);
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    if (this.getToken()) {
      this.fetchCurrentUser().subscribe();
    }
  }

  getAvatarUrl(avatar?: string | null): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('data:image')) return avatar;

    const backendOrigin = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

    // Replace dead trycloudflare tunnel URLs or other obsolete tunnel hosts
    if (avatar.includes('trycloudflare.com') || avatar.includes('ngrok') || avatar.includes('loca.lt')) {
      avatar = avatar.replace(/^https?:\/\/[^\/]+/, backendOrigin);
    }

    // Relative storage paths
    if (avatar.startsWith('/storage')) {
      return `${backendOrigin}${avatar}`;
    }
    if (avatar.startsWith('storage/')) {
      return `${backendOrigin}/${avatar}`;
    }

    // If host is localhost or 127.0.0.1 on port 8000, ensure it matches environment.apiUrl
    if (avatar.startsWith('http://localhost:8000') || avatar.startsWith('http://127.0.0.1:8000')) {
      return avatar.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, backendOrigin);
    }

    return avatar;
  }

  private normalizeUser(user: User): User {
    if (!user) return user;
    if (user.avatar) {
      user.avatar = this.getAvatarUrl(user.avatar) || undefined;
    }
    return user;
  }

  get currentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUserValue(): User | null {
    if (!this.currentUserSubject.value) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = this.normalizeUser(JSON.parse(savedUser));
          this.currentUserSubject.next(parsed);
          return parsed;
        } catch {
          return null;
        }
      }
    }
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): UserRole | null {
    return this.currentUserValue?.role ?? null;
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    const currentRole = this.getUserRole();
    if (!currentRole) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(currentRole);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    // Super admin a tous les droits
    if (user.role === 'admin') {
      return true;
    }
    // Si c'est explicitement un collaborateur invité non titulaire
    if (user.owner && user.owner.is_primary === false) {
      const perms = user.owner.permissions;
      return Array.isArray(perms) ? perms.includes(permission) : false;
    }
    // Tout propriétaire loueur (owner) ou compte titulaire a tous les droits par défaut
    if (user.role === 'owner' || user.owner?.is_primary === true) {
      return true;
    }
    const perms = user.owner?.permissions;
    if (Array.isArray(perms)) {
      return perms.includes(permission);
    }
    return false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => this.hasPermission(p));
  }

  isBlocked(): boolean {
    return this.currentUserValue?.is_active === false;
  }

  fetchCurrentUser(): Observable<User | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      map(res => this.normalizeUser(res.user)),
      tap(user => {
        if (user) {
          if (user.is_active === false) {
            this.clearSession();
            return;
          }
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      }),
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          this.clearSession();
        }
        return of(this.currentUserSubject.value);
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    }).pipe(
      tap(response => {
        if (response && response.token) {
          const user = this.normalizeUser(response.user);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  saveSession(token: string, user: User) {
    const normalized = this.normalizeUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    this.currentUserSubject.next(normalized);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data).pipe(
      tap(response => {
        if (response && response.user) {
          const user = this.normalizeUser(response.user);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  getAdminContact(): Observable<{ name: string; email: string; phone: string }> {
    return this.http.get<{ name: string; email: string; phone: string }>(`${this.apiUrl}/admin-contact`).pipe(
      catchError(() => of({
        name: 'Super Administrateur myTerrain',
        email: 'admin@myterrain.sn',
        phone: '+221770000000'
      }))
    );
  }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}
