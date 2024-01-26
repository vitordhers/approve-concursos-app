import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterComponent } from '../admin/pages/questions/components/filter/filter.component';
import { QuestionFilters } from '../../shared/interfaces/filters.interface';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { QuestionnaireComponent } from '../../components/questionnaire/questionnaire.component';
import { AnswerableQuestion, Question } from '../../models/question.model';
import { ExamsService } from '../../services/exams.service';
import { AnswerableQuestionsService } from '../../services/answerable-questions.service';
import {
  QuestionFilterKeysPt,
  translateQuestionParamMap,
} from '../../shared/enums/question-filters.enum';
import { QuestionSelectListComponent } from '../../components/question-select-list/question-select-list.component';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [
    CommonModule,
    FilterComponent,
    QuestionnaireComponent,
    QuestionSelectListComponent,
  ],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  selectedFilters: WritableSignal<QuestionFilters[]> = signal([]);
  currentFragment: WritableSignal<string | undefined> = signal(undefined);

  loadedQuestions = signal([] as AnswerableQuestion[]);

  loadedQuestionsTotal = signal(0);

  searchedTerms = signal('');

  constructor(
    private activatedRoute: ActivatedRoute,
    private answerableQuestionsService: AnswerableQuestionsService,
    private examsService: ExamsService,
    private router: Router
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
          const examId = params.get('prova');
          if (examId) {
            return this.examsService.loadExamQuestions(examId);
          }

          const questionIds = params.getAll('questao');
          if (questionIds.length) {
            return this.answerableQuestionsService.getByIds(questionIds);
          }

          const paramsKeys = params.keys;

          if (
            paramsKeys.some((param) => QuestionFilterKeysPt.includes(param))
          ) {
            const translatedParams = translateQuestionParamMap(params);
            return this.answerableQuestionsService.fetchQuestionsWithFilters(
              translatedParams
            );
          }

          const searchedTems = params.get('busca');
          if (searchedTems) {
            this.searchedTerms.set(searchedTems);
          }

          return of([]);
        })
      )
      .subscribe((loadedQuestions) => {
        this.loadedQuestionsTotal.set(loadedQuestions.length);
        this.loadedQuestions.set(loadedQuestions);
      });
  }

  onQuestionsSelected(questionsIds: string[]) {
    const queryParams: Params = { questao: questionsIds };
    this.router.navigate([], {
      fragment: 'resolver',
      queryParams,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
