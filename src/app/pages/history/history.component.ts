import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user/user.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { generateHash } from '../../shared/functions/generate-hash.function';
import { QuestionsService } from '../../services/questions.service';
import { cloneDeep } from 'lodash';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatPaginatorIntlPtBr } from '../../shared/config/pagination-intl.model';
import { DEFAULT_PAGINATION_SIZE } from '../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../shared/constants/pagination-sizes.const';
import { AnswerableQuestionComponent } from '../../components/answerable-question/answerable-question.component';
import { Answer } from '../../shared/interfaces/answer.interface';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, AnswerableQuestionComponent],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent implements OnInit, OnDestroy {
  loadedRecordsMap = signal(new Map<string, Answer>());
  answerMap = new Map<string, number>();

  destroy$ = new Subject<void>();

  currentPage = signal({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });

  pageChangeEffect = effect(
    () => {
      const { start, end, pageSize } = this.currentPage();
      this.paginate(start, end, pageSize).subscribe();
    },
    { allowSignalWrites: true }
  );

  loadedRecords = computed(() => {
    const { start, end } = this.currentPage();
    const loadedQuestions = Array.from(this.loadedRecordsMap().values());
    const paginatedQuestions = loadedQuestions.slice(start, end);
    return paginatedQuestions;
  });

  private allLoaded = false;

  private injector = inject(Injector);

  private paginateLoaded = computed(() =>
    Array.from(this.loadedRecordsMap().values()).sort((a, b) => b.at - a.at)
  );

  currentPageSize = DEFAULT_PAGINATION_SIZE;

  pageSizeOptions = PAGINATION_SIZES;

  private paginateLoaded$ = toObservable(this.paginateLoaded, {
    injector: this.injector,
  }).pipe(
    distinctUntilChanged(
      (prev, curr) => generateHash(prev) === generateHash(curr)
    )
  );

  totalRecords = signal(0);

  private setAllLoaded(map: Map<string, Answer>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength === this.totalRecords();
  }

  constructor(
    private userService: UserService,
    private questionsService: QuestionsService
  ) {}

  ngOnInit(): void {}

  cacheRecords(records: Answer[]) {
    this.loadedRecordsMap.update((m) => {
      m = cloneDeep(m);
      records.map((i) => m.set(i.id, i));
      this.setAllLoaded(m);
      return m;
    });
  }

  onPageEvent({ pageIndex, pageSize }: PageEvent) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    this.currentPageSize = pageSize;
    this.currentPage.set(cloneDeep({ start, end, pageSize }));
  }

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        if (this.allLoaded || alreadyLoadedRecords.length === end - start)
          return of(paginateLoaded.slice(start, end));

        let missingRecordsNo = 0;
        let updatedStart = start;
        let updatedEnd = end;
        if (alreadyLoadedRecords.length) {
          missingRecordsNo = pageSize - alreadyLoadedRecords.length;
          updatedStart = alreadyLoadedRecords.length;
          updatedEnd = start + missingRecordsNo;
        }

        return this.userService.getHistory$(updatedStart, updatedEnd).pipe(
          tap((res) =>
            res.success ? this.totalRecords.set(res.total) : undefined
          ),
          map((res) =>
            res.success && res.data && res.data.length
              ? res.data.map((record) => ({
                  ...record,
                  question: this.questionsService.serializeRecord(
                    record.question,
                    true
                  ),
                }))
              : ([] as Answer[])
          ),
          tap((records) => this.cacheRecords(records))
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
    this.pageChangeEffect.destroy();
  }
}
