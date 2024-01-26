import {
  HttpErrorResponse,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ACCESS_TOKEN_EXCLUDED_ENDPOINTS } from './constants/access-token-excluded-endpoints.const';

@Injectable()
export class AccessTokenInterceptor implements HttpInterceptor {
  // private isRefreshing = false;
  // private refreshTokenSubject$ = new BehaviorSubject<string | undefined>(
  //   undefined
  // );

  constructor(private authService: AuthService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const url = request.url;
    if (
      !url.includes(environment.apiUrl) ||
      ACCESS_TOKEN_EXCLUDED_ENDPOINTS.includes(url)
    ) {
      return next.handle(request);
    }
    return this.authService.accessToken$.pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return next.handle(request);
        }
        if (accessToken) {
          request = this.addAccessToken(request, accessToken);
        }

        return next.handle(request).pipe(
          catchError((error) => {
            console.error('Interceptor error:', { error });
            // if (error instanceof HttpErrorResponse && error.status === 401) {
            //   if (error.url === `${environment.apiUrl}/auth/token`) {
            //     this.authService.logout();
            //   }
            //   // return this.handle401Error(request, next);
            // }
            return throwError(() => new Error(error));
          })
        );
      })
    );
  }

  private addAccessToken(request: HttpRequest<any>, accessToken: string) {
    if (accessToken && request.url.includes(environment.apiUrl)) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
    return request.clone();
  }

  // private addRefreshToken(request: HttpRequest<any>, refreshToken: string) {
  //   return request.clone({
  //     setHeaders: {
  //       'x-refresh-token': refreshToken,
  //     },
  //   });
  // }

  // private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
  //   if (!this.isRefreshing) {
  //     this.isRefreshing = true;
  //     this.refreshTokenSubject$.next(undefined);

  //     this.authService.onRefreshToken().subscribe((token) => {
  //       this.isRefreshing = false;
  //       this.refreshTokenSubject$.next(token.accessToken);
  //       return next.handle(this.addAccessToken(request, token.accessToken));
  //     });
  //     return;
  //   }
  //   return this.refreshTokenSubject$.pipe(
  //     filter((token) => token != null),
  //     take(1),
  //     switchMap((refreshToken) =>
  //       next.handle(this.addRefreshToken(request, refreshToken))
  //     )
  //   );
  // }
}
