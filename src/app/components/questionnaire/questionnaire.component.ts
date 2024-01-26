import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewChild,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerableQuestion } from '../../models/question.model';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatPaginatorIntlPtBr } from '../../shared/config/pagination-intl.model';
import { AnswerableQuestionComponent } from '../answerable-question/answerable-question.component';
import { cloneDeep } from 'lodash';
import { DEFAULT_QUESTION_PAGINATION_SIZE } from '../../shared/config/default-question-pagination-size.const';
import { QUESTION_PAGINATION_SIZES } from '../../shared/constants/question-pagination-sizes.const';
import { Router } from '@angular/router';
import { fireToast } from '../../notification/functions/fire-toast.function';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatButtonModule,
    MatSelectModule,
    FontAwesomeModule,
    AnswerableQuestionComponent,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionnaireComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @Input()
  loadedQuestions?: WritableSignal<AnswerableQuestion[]>;

  @Input()
  totalQuestions = 0;

  faMagnifyingGlass = faMagnifyingGlass;

  displayedQuestions = computed(() => {
    if (!this.loadedQuestions) return [];
    const { start, end } = this.currentPage();
    const loadedQuestions = this.loadedQuestions();
    const displayedQuestions = loadedQuestions.slice(start, end);
    return displayedQuestions;
  });

  currentPage = signal({
    start: 0,
    end: DEFAULT_QUESTION_PAGINATION_SIZE,
    pageSize: DEFAULT_QUESTION_PAGINATION_SIZE,
  });

  currentPageSize = DEFAULT_QUESTION_PAGINATION_SIZE;

  pageSizeOptions = QUESTION_PAGINATION_SIZES;

  answerMap = new Map<string, number>();

  // private currentPageEffect = effect(
  //   () => {
  //     const currentPage = this.currentPage();
  //     // this.pageEventEmitter.next(currentPage);
  //   },
  //   { allowSignalWrites: true }
  // );

  constructor(private cd: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.answerMap.clear();
  }

  onPageEvent({ pageIndex, pageSize }: PageEvent) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    this.currentPageSize = pageSize;

    this.currentPage.set(cloneDeep({ start, end, pageSize }));
    this.cd.detectChanges();
  }

  nextPage(nextPage: boolean) {
    if (!nextPage || !this.paginator) return;
    if (!this.paginator.hasNextPage()) {
      fireToast(
        'Parabéns! 👏',
        'Você terminou sua prova. Vamos ver seus resultados?',
        'success'
      );
      setTimeout(() => {}, 3000);

      this.router.navigate(['painel', 'historico']);
      return;
    }
    this.paginator.nextPage();
  }

  navigateToFilter() {
    this.router.navigate([], { fragment: 'filtro' });
  }

  ngOnDestroy(): void {
    // this.currentPageEffect.destroy();
  }
}
