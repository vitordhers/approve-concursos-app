import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  combineLatest,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatPaginatorIntlPtBr } from '../../shared/config/pagination-intl.model';
import { DEFAULT_PAGINATION_SIZE } from '../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../shared/constants/pagination-sizes.const';
import { AnswerableQuestionsService } from '../../services/answerable-questions.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ItemQuestionSelectorComponent } from '../item-question-selector/item-question-selector.component';
import { AnswerableQuestion } from '../../models/question.model';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { fireToast } from '../../notification/functions/fire-toast.function';

@Component({
  selector: 'app-question-select-list',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatButtonModule,
    ItemQuestionSelectorComponent,
    FontAwesomeModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './question-select-list.component.html',
  styleUrl: './question-select-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionSelectListComponent
  implements OnInit, OnDestroy, OnChanges
{
  private destroy$ = new Subject<void>();

  @Input() search?: string;
  @Output() selectedQuestionsIdsEmitter = new EventEmitter<string[]>();

  search$ = new BehaviorSubject<string | undefined>(undefined);

  searchedTerms = toSignal(this.search$);

  private currentPage$ = new BehaviorSubject({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });

  faCheck = faCheck;
  faMagnifyingGlass = faMagnifyingGlass;

  currentPageSize = DEFAULT_PAGINATION_SIZE;

  pageSizeOptions = PAGINATION_SIZES;

  searchTotalRecords = signal(0);

  searchedQuestions$ = combineLatest([this.currentPage$, this.search$]).pipe(
    takeUntil(this.destroy$),
    switchMap(([currentPage, search]) => {
      if (!search || search === '') return EMPTY;
      const { start, pageSize: limit } = currentPage;

      return this.answerableQuestionsService.searchByTerms(
        search,
        start,
        limit
      );
    }),
    tap((res) => {
      if (!res.success || !res.data || !res.total) return;
      this.searchTotalRecords.set(res.total);
    }),
    map((res) =>
      res.success && res.data && res.data.length
        ? res.data.map((record) =>
            this.answerableQuestionsService.serializeRecord(record)
          )
        : ([] as AnswerableQuestion[])
    )
  );

  searchedQuestions = toSignal(this.searchedQuestions$);

  selectedQuestionsIds = new Set<string>();

  constructor(private answerableQuestionsService: AnswerableQuestionsService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['search']) return;
    if (changes['search']) {
      const search = changes['search'].currentValue;
      if (!search || search === '') return;
      this.search$.next(search);
    }
  }

  onPageEvent({ pageIndex, pageSize }: PageEvent) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    this.currentPageSize = pageSize;
    this.currentPage$.next({ start, end, pageSize });
  }

  onQuestionSelectChange({ id, selected }: { id: string; selected: boolean }) {
    if (selected) {
      this.selectedQuestionsIds.add(id);
      return;
    }
    this.selectedQuestionsIds.delete(id);
  }

  onSelectQuestions() {
    const selectedQuestionsIds = [...this.selectedQuestionsIds];
    if (!selectedQuestionsIds.length) {
      fireToast(
        '☝️ Atenção',
        'é necessário escolher pelo menos uma questão para prosseguir',
        'info'
      );
      return;
    }
    this.selectedQuestionsIdsEmitter.next(selectedQuestionsIds);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
