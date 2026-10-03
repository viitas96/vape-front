import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (req.url.includes('/api/auth/')) {
        auth.logout();
        router.navigate(['/authentication/login']);
        return throwError(() => error);
      }

      // An impersonation token has no refresh token, so a 401 means it expired:
      // drop back to the admin session instead of logging everything out.
      if (auth.isImpersonating()) {
        auth.stopImpersonation();
        window.location.assign(auth.getRedirectPath());
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((token) => next(addToken(req, token!)))
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return auth.refreshToken().pipe(
        switchMap((res) => {
          isRefreshing = false;
          refreshTokenSubject.next(res.token);
          return next(addToken(req, res.token));
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          auth.logout();
          router.navigate(['/authentication/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
