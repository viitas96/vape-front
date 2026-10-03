import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ImpersonationToken {
  token: string;
  email: string;
  lifetimeMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class ImpersonationService {
  private readonly API_URL = `${environment.apiBaseUrl}/impersonation`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  get enabled(): boolean {
    return environment.impersonationEnabled;
  }

  impersonate(customerUuid: string): Observable<ImpersonationToken> {
    return this.http.post<ImpersonationToken>(`${this.API_URL}/${customerUuid}`, {}).pipe(
      tap((response) => this.authService.startImpersonation(response.token, response.email)),
    );
  }
}
