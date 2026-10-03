import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { getRoleHomePath } from '../core/routing/app-feature.routes';
import { ProductCreationPreferencesService } from './product-creation-preferences.service';
import { CustomerDTO } from '../features/customers/customer.models';

interface LoginResponse {
  token: string;
  refreshToken: string;
  roles: string[];
}

interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly ROLES_KEY = 'roles';
  private static readonly ADMIN_TOKEN_KEY = 'adminToken';
  private static readonly ADMIN_REFRESH_TOKEN_KEY = 'adminRefreshToken';
  private static readonly ADMIN_ROLES_KEY = 'adminRoles';
  private static readonly IMPERSONATED_EMAIL_KEY = 'impersonatedEmail';

  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly productCreationPreferencesService: ProductCreationPreferencesService,
  ) {}

  register(dto: CustomerDTO): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register`, dto).pipe(
      tap((response) => localStorage.setItem(AuthService.TOKEN_KEY, response.token)),
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        localStorage.setItem(AuthService.TOKEN_KEY, response.token);
        localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(AuthService.ROLES_KEY, JSON.stringify(response.roles));
      }),
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<TokenRefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        localStorage.setItem(AuthService.TOKEN_KEY, response.token);
        localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, response.refreshToken);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({ error: () => undefined });
    }

    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AuthService.ROLES_KEY);
    this.clearImpersonation();
    this.productCreationPreferencesService.clearPreferences();
  }

  startImpersonation(token: string, email: string): void {
    const currentToken = this.getToken();
    const currentRefreshToken = this.getRefreshToken();
    const currentRoles = localStorage.getItem(AuthService.ROLES_KEY);

    if (currentToken) {
      localStorage.setItem(AuthService.ADMIN_TOKEN_KEY, currentToken);
    }
    if (currentRefreshToken) {
      localStorage.setItem(AuthService.ADMIN_REFRESH_TOKEN_KEY, currentRefreshToken);
    }
    if (currentRoles) {
      localStorage.setItem(AuthService.ADMIN_ROLES_KEY, currentRoles);
    }

    localStorage.setItem(AuthService.TOKEN_KEY, token);
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
    localStorage.setItem(AuthService.ROLES_KEY, JSON.stringify(['CUSTOMER']));
    localStorage.setItem(AuthService.IMPERSONATED_EMAIL_KEY, email);
  }

  stopImpersonation(): void {
    const adminToken = localStorage.getItem(AuthService.ADMIN_TOKEN_KEY);
    const adminRefreshToken = localStorage.getItem(AuthService.ADMIN_REFRESH_TOKEN_KEY);
    const adminRoles = localStorage.getItem(AuthService.ADMIN_ROLES_KEY);

    if (adminToken) {
      localStorage.setItem(AuthService.TOKEN_KEY, adminToken);
    } else {
      localStorage.removeItem(AuthService.TOKEN_KEY);
    }

    if (adminRefreshToken) {
      localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, adminRefreshToken);
    } else {
      localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
    }

    if (adminRoles) {
      localStorage.setItem(AuthService.ROLES_KEY, adminRoles);
    } else {
      localStorage.removeItem(AuthService.ROLES_KEY);
    }

    this.clearImpersonation();
  }

  isImpersonating(): boolean {
    return localStorage.getItem(AuthService.IMPERSONATED_EMAIL_KEY) !== null;
  }

  getImpersonatedEmail(): string | null {
    return localStorage.getItem(AuthService.IMPERSONATED_EMAIL_KEY);
  }

  private clearImpersonation(): void {
    localStorage.removeItem(AuthService.ADMIN_TOKEN_KEY);
    localStorage.removeItem(AuthService.ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AuthService.ADMIN_ROLES_KEY);
    localStorage.removeItem(AuthService.IMPERSONATED_EMAIL_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }

  getRoles(): string[] {
    const storedRoles = localStorage.getItem(AuthService.ROLES_KEY);
    return storedRoles ? JSON.parse(storedRoles) : [];
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const currentRoles = this.getRoles();
    return roles.some((role) => currentRoles.includes(role));
  }

  getRedirectPath(): string {
    return getRoleHomePath(this.getRoles());
  }
}
