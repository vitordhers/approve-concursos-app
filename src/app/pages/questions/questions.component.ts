import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterComponent } from '../admin/pages/questions/components/filter/filter.component';
import {
  Filters,
  SelectorFilter,
} from '../../shared/interfaces/filters.interface';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  combineLatest,
  switchMap,
  takeUntil,
} from 'rxjs';
import { QuestionnaireComponent } from '../../components/questionnaire/questionnaire.component';
import { QuestionsService } from '../../services/questions.service';
import { FilterType } from '../../shared/enums/filter-type.enum';
import { Question } from '../../models/question.model';
import { ExamsService } from '../../services/exams.service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FilterComponent, QuestionnaireComponent],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  selectedFilters: WritableSignal<Filters[]> = signal([]);
  currentExamId: WritableSignal<string | undefined> = signal(undefined);
  currentFragment: WritableSignal<string | undefined> = signal(undefined);

  loadedFilteredQuestions = signal([] as Question[]);
  loadedExamQuestions = signal([] as Question[]);

  loadedFilteredQuestionsTotal = signal(0);

  loadedExamQuestionsTotal = computed(() => {
    const currentExamId = this.currentExamId();
    if (!currentExamId) return 0;
    const totals = this.examsService.examQuestionsLoadedMap();
    const examTotals = totals.get(currentExamId);
    if (!examTotals) return 0;

    return examTotals.total;
  });

  examPaginator$ = new BehaviorSubject<
    { start: number; end: number; pageSize: number } | undefined
  >(undefined);

  constructor(
    private activatedRoute: ActivatedRoute,
    private questionsService: QuestionsService,
    private examsService: ExamsService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.fragment
      .pipe(takeUntil(this.destroy$))
      .subscribe((fragment) => {
        if (!fragment) return;

        this.currentFragment.set(fragment);
      });

    this.activatedRoute.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const data = params.get('data');
          if (!data) return EMPTY;

          let filters = JSON.parse(decodeURIComponent(data)) as Filters[];
          const selectors = filters.filter(
            (f) => f.type === FilterType.SELECTOR
          ) as SelectorFilter[];

          filters = filters.filter((f) => f.type !== FilterType.SELECTOR);

          // console.log('@@@', { filters, selectors });

          return this.questionsService.fetchQuestionsWithFilters(
            filters,
            selectors
          );
        })
      )
      .subscribe((result) => {
        this.loadedFilteredQuestions.set(result);
        this.loadedFilteredQuestionsTotal.set(result.length);
      });

    combineLatest([this.activatedRoute.queryParamMap, this.examPaginator$])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, page]) => {
          const examId = params.get('examId');
          if (!examId || !page) return EMPTY;
          this.currentExamId.set(examId);

          const { start, end, pageSize } = page;

          return this.examsService.paginateExamQuestions(
            examId,
            start,
            end,
            pageSize
          );
        })
      )
      .subscribe((examQuestions) => {
        this.loadedExamQuestions.set(examQuestions);
      });
  }

  onExamPagination(paginationEvent: {
    start: number;
    end: number;
    pageSize: number;
  }) {
    this.examPaginator$.next(paginationEvent);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
