import { Injectable, computed } from '@angular/core';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../../shared/enums/user-role.enum';
import { HttpClient } from '@angular/common/http';
import { FormattedResponse } from '../../shared/interfaces/formatted-response.interface';
import { Credentials } from '../../shared/interfaces/credentials.interface';
import { environment } from '../../../environments/environment';
import { SignUpDto } from './interfaces/signup-dto.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { cloneDeep } from 'lodash';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { Answer } from '../../shared/interfaces/answer.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpoint = `${environment.apiUrl}/users`;

  private isUserAuthenticated$ = this.authService.accessToken$.pipe(
    map((accessToken) => !!accessToken)
  );

  isUserAdmin$ = this.authService.decodedToken$.pipe(
    map((decodedToken) =>
      decodedToken ? decodedToken.role === UserRole.ADMIN : false
    )
  );

  user$: Observable<User | undefined> = this.isUserAuthenticated$.pipe(
    distinctUntilChanged(),
    switchMap((loggedIn) => (!loggedIn ? EMPTY : this.getUserData$()))
  );

  isLoggedIn = toSignal(this.isUserAuthenticated$);
  user = toSignal(this.user$);
  isAdmin = toSignal(this.isUserAdmin$);

  private userSubject$ = new ReplaySubject<User>(1);
  constructor(private authService: AuthService, private http: HttpClient) {}

  getUserData$() {
    return this.http.get<FormattedResponse<User>>(`${this.endpoint}/data`).pipe(
      map((response) => {
        if (!response.success || !response.data) return;
        return response.data;
      })
    );
  }

  getOverallPerformance$() {
    return this.http
      .get<
        FormattedResponse<{
          count: { total: number };
          correct: { total: number };
        }>
      >(`${this.endpoint}/performance`)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) return;
          return response.data;
        })
      );
  }

  getHistory$(start: number, end: number) {
    return this.http.get<PaginatedResponse<Answer[]>>(
      `${this.endpoint}/history?start=${start}&limit=${end}`
    );
  }

  signUp$(dto: SignUpDto) {
    return this.http
      .post<FormattedResponse<Credentials>>(this.endpoint, dto)
      .pipe(
        tap((response) => {
          if (!response.success || !response.data) return;
          this.authService.setCredentials(response.data);
        })
      );
  }
}
