import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AnswerableQuestion, Question } from '../../models/question.model';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { SubjectsService } from '../../services/subjects.service';
import { InstitutionsService } from '../../services/institutions.service';
import { ExamsService } from '../../services/exams.service';
import { BoardsService } from '../../services/boards.service';
import { AnswerableQuestionsService } from '../../services/answerable-questions.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-item-question-selector',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatCardModule,
    ServerImgPipe,
  ],
  templateUrl: './item-question-selector.component.html',
  styleUrl: './item-question-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemQuestionSelectorComponent
  implements OnInit, OnChanges, OnDestroy
{
  private destroy$ = new Subject<void>();

  @Input()
  questionId?: string;

  private questionId$ = new Subject<string>();

  @Output() questionSelectedEmitter = new EventEmitter<{
    id: string;
    selected: boolean;
  }>();

  question$ = this.questionId$.pipe(
    takeUntil(this.destroy$),
    distinctUntilChanged(),
    switchMap((id) => this.answerableQuestionsService.getOne(id, true))
  );

  private subject$ = this.question$.pipe(
    takeUntil(this.destroy$),
    switchMap((question) => {
      if (!question) return EMPTY;
      return this.subjectsService.getOne(question.subjectId);
    })
  );

  private institution$ = this.question$.pipe(
    takeUntil(this.destroy$),
    switchMap((question) => {
      if (!question || !question.institutionId) return EMPTY;
      return this.institutionsService.getOne(question.institutionId);
    })
  );

  private exam$ = this.question$.pipe(
    takeUntil(this.destroy$),
    switchMap((question) => {
      if (!question || !question.examId) return EMPTY;
      return this.examService.getOne(question.examId);
    })
  );

  private board$ = this.question$.pipe(
    takeUntil(this.destroy$),
    switchMap((question) => {
      if (!question || !question.boardId) return EMPTY;
      return this.boardsService.getOne(question.boardId);
    })
  );

  question = toSignal(this.question$);
  subject = toSignal(this.subject$);
  institution = toSignal(this.institution$);
  exam = toSignal(this.exam$);
  board = toSignal(this.board$);

  formControl = new FormControl<boolean>(false, { nonNullable: true });

  constructor(
    private subjectsService: SubjectsService,
    private institutionsService: InstitutionsService,
    private examService: ExamsService,
    private boardsService: BoardsService,
    private answerableQuestionsService: AnswerableQuestionsService
  ) {}

  ngOnInit(): void {
    this.formControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selected) => {
        const question = this.question();
        if (!question) return;
        console.log({ id: question.id, selected })
        this.questionSelectedEmitter.next({ id: question.id, selected });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['questionId']) return;
    if (changes['questionId']) {
      const questionId = changes['questionId'].currentValue;
      if (!questionId) return;
      this.questionId$.next(questionId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
