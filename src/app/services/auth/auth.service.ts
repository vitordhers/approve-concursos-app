import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  ReplaySubject,
  distinctUntilChanged,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { DecodedJwt } from '../../shared/interfaces/decoded-token.interface';
import { Credentials } from '../../shared/interfaces/credentials.interface';
import { StorageService } from '../storage.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SignInDto } from './interfaces/signin-dto.interface';
import { cloneDeep } from 'lodash';
import { FormattedResponse } from '../../shared/interfaces/formatted-response.interface';

const CREDENTIALS_STORAGE_KEY = 'QuestionsAuthData';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private credentials$ = new BehaviorSubject<Credentials | undefined>(
    undefined
  );
  private activeRefreshTokenTimer?: NodeJS.Timeout;
  private endpoint = `${environment.apiUrl}/auth`;

  decodedToken$ = this.credentials$.pipe(
    map((credentials) =>
      credentials ? this.decodeAccessToken(credentials.accessToken) : undefined
    )
  );

  get accessToken$() {
    return this.credentials$.pipe(
      map((credentials) => (credentials ? credentials.accessToken : undefined))
    );
  }

  get refreshToken$() {
    return this.credentials$.pipe(
      map((credentials) => (credentials ? credentials.refreshToken : undefined))
    );
  }

  constructor(
    private storageService: StorageService,
    private http: HttpClient,
    private router: Router
  ) {
    this.autoLogin();

    this.credentials$.subscribe((credentials) => {
      if (!credentials)
        return this.storageService.removeKey(CREDENTIALS_STORAGE_KEY);

      this.storeAuthData(credentials);
    });

    this.decodedToken$.subscribe((decodedToken) => {
      if (!decodedToken) return;
      if (!decodedToken.exp || !decodedToken.iat) {
        return this.logout();
      }

      const exp = decodedToken.exp;
      const now = Math.round(Date.now() / 1000);
      const pendingDuration = exp - now;
      if (pendingDuration <= 0) {
        return this.refreshAccessToken();
      }

      this.setAccessTokenAutoRefresher(pendingDuration);
    });
  }

  private autoLogin() {
    const storedCredentials = this.storageService.getKey<Credentials>(
      CREDENTIALS_STORAGE_KEY
    );
    if (!storedCredentials) return;
    this.setCredentials(storedCredentials);
    // this.setUserData(storedCredentials, false);
  }

  private decodeAccessToken(accessToken: string) {
    try {
      return jwtDecode<DecodedJwt>(accessToken);
    } catch (e) {
      console.error('decodeAccessToken error');
      return;
    }
  }

  private setAccessTokenAutoRefresher(duration: number): void {
    if (this.activeRefreshTokenTimer) {
      clearTimeout(this.activeRefreshTokenTimer);
    }

    this.activeRefreshTokenTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, duration * 1000);
  }

  private refreshAccessToken() {
    this.refreshToken$
      ?.pipe(
        distinctUntilChanged(),
        switchMap((refreshToken) => {
          if (!refreshToken) return EMPTY;

          return this.http.patch<FormattedResponse<Credentials>>(
            `${environment.apiUrl}/auth`,
            undefined,
            {
              headers: {
                'x-refresh-token': refreshToken,
              },
            }
          );
        })
      )
      .subscribe({
        next: (response) => {
          if (!response?.success || !response?.data) return;
          this.setCredentials(response.data);
        },
        error: (e) => {
          console.warn(`autoRefreshAccessToken error: ${e}`);
          this.logout();
        },
      });
  }

  setCredentials(credentials: Credentials | undefined) {
    this.credentials$.next(credentials);
  }

  private storeAuthData(credentials: Credentials): void {
    this.storageService.setKey(CREDENTIALS_STORAGE_KEY, credentials);
  }

  logout() {
    if (this.activeRefreshTokenTimer) {
      clearTimeout(this.activeRefreshTokenTimer);
    }
    this.storageService.removeKey(CREDENTIALS_STORAGE_KEY);
    this.setCredentials(undefined);
    // this.router.navigate(['/home']);
  }

  signIn$(dto: SignInDto) {
    return this.http
      .post<FormattedResponse<Credentials>>(this.endpoint, dto)
      .pipe(
        tap((response) => {
          if (!response.success || !response.data) return;

          this.setCredentials(response.data);
        })
      );
  }
}
