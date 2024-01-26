import {
  Injectable,
  NgZone,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  distinctUntilChanged,
  first,
  firstValueFrom,
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
import { toSignal } from '@angular/core/rxjs-interop';
import { cloneDeep } from 'lodash';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import {
  Answer,
  AnswerPayload,
} from '../../shared/interfaces/answer.interface';
import { SignUpDto } from '../auth/interfaces/signup-dto.interface';
import { VerifyEmailDto } from '../auth/interfaces/verify-email-dto.interface';
import { RecoverPasswordDto } from '../auth/interfaces/recover-password-dto.interface';
import { ResendConfirmationEmailDto } from '../auth/interfaces/resend-confirmation-email-dto.interface';
import { RedefinePasswordDto } from './interfaces/redefine-password-dto.interface';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SseMessageEvent } from '../../shared/interfaces/sse-message-event.interface';
import { generateHash } from '../../shared/functions/generate-hash.function';
import { QuestionsService } from '../questions.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpoint = `${environment.apiUrl}/users`;
  private abortCtrl?: AbortController;
  listenToPayments$ = new Subject<SseMessageEvent>();

  totalAnsweredQuestions: WritableSignal<number | undefined> =
    signal(undefined);

  private isUserAuthenticated$ = this.authService.accessToken$.pipe(
    map((accessToken) => !!accessToken)
  );

  isUserAdmin$ = this.authService.decodedToken$.pipe(
    map((decodedToken) =>
      decodedToken ? decodedToken.role === UserRole.ADMIN : false
    )
  );

  user$: Observable<User | undefined> = this.authService.decodedToken$.pipe(
    distinctUntilChanged((prev, curr) =>
      !curr
        ? true
        : generateHash({ id: prev?.id, role: prev?.role }) ===
          generateHash({ id: curr?.id, role: curr?.role })
    ),
    switchMap((decodedToken) => {
      const timestamp = Date.now();
      return !decodedToken ? EMPTY : this.getUserData$(timestamp);
    })
  );

  isLoggedIn = toSignal(this.isUserAuthenticated$);
  user = toSignal(this.user$);
  isAdmin = toSignal(this.isUserAdmin$);
  isPaidUser = computed(() => {
    const user = this.user();
    if (!user) return false;
    return user.role >= UserRole.PAID_USER;
  });

  constructor(
    private authService: AuthService,
    private questionsService: QuestionsService,
    private http: HttpClient,
    private zone: NgZone
  ) {}

  getUserData$(timestamp: number) {
    return this.http
      .get<FormattedResponse<User>>(`${this.endpoint}/data?t=${timestamp}`)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) return;
          return response.data;
        }),
        first()
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

  getHistory(start: number, end: number) {
    return this.http
      .get<PaginatedResponse<AnswerPayload[]>>(
        `${this.endpoint}/history?start=${start}&limit=${end}`
      )
      .pipe(
        tap((response) => {
          if (!response || !response.data || !response.data.length) return;
          this.totalAnsweredQuestions.set(response.total);
          const questionsToHaveRelationsCached = response.data.map(
            (answer) => answer.question
          );
          this.questionsService.cacheRelations(questionsToHaveRelationsCached);
        }),
        map((response) =>
          !response || !response.data || !response.data.length
            ? ([] as Answer[])
            : response.data.map((record) => ({
                ...record,
                question: this.questionsService.serializeRecord(
                  record.question
                ),
              }))
        )
      );
  }

  signUp(dto: SignUpDto) {
    return this.http.post<FormattedResponse<undefined>>(this.endpoint, dto);
  }

  redefinePassword(dto: RedefinePasswordDto) {
    return this.http.patch<FormattedResponse<{ nonValidatedUser: boolean }>>(
      `${this.endpoint}/redefine`,
      dto,
      { observe: 'response' }
    );
  }

  listenToSse() {
    this.zone.runOutsideAngular(async () => {
      const accessToken = await firstValueFrom(this.authService.accessToken$);
      this.abortCtrl = new AbortController();

      if (!accessToken) return;
      console.log({ accessToken });
      try {
        await fetchEventSource(`${this.endpoint}/payments`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          openWhenHidden: true,
          onmessage: (ev) => {
            if (ev.data === '') return;
            const parsedEventData = JSON.parse(ev.data) as SseMessageEvent;
            if (parsedEventData.type === 'unsubscribe') {
              this.authService.refreshAccessToken();
              this.closeSseConnection();
              setTimeout(() => {
                this.listenToPayments$.next(parsedEventData);
              }, 3000);
            }
          },
        });
      } catch (error) {
        this.abortCtrl.abort();
      }
    });
  }

  closeSseConnection() {
    this.zone.runOutsideAngular(() => {
      if (!this.abortCtrl) return;
      this.abortCtrl.abort();
    });
  }
}
