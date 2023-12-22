import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Question } from '../../models/question.model';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  takeUntil,
  Subject as RxJsSubject,
  switchMap,
  EMPTY,
} from 'rxjs';
import { SubjectsService } from '../../services/subjects.service';
import { InstitutionsService } from '../../services/institutions.service';
import { ExamsService } from '../../services/exams.service';
import { BoardsService } from '../../services/boards.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import { IndexToAplhabetCharPipe } from '../../shared/pipes/letter-index-to-icon.pipe';
import { LetterIndexToAplhabetCharPipe } from '../../shared/pipes/letter-index-to-char.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { IconNumberSequenceComponent } from '../icon-number-sequence/icon-number-sequence.component';
import {
  faCheck,
  faPenClip,
  faSquareXmark,
  faSquareCheck,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { QuestionsService } from '../../services/questions.service';
import { AnswerDto } from '../../services/interfaces/answer-dto.interface';
import { AlternativeTooltipPipe } from '../../shared/pipes/alternative-tooltip.pipe';
import { toLocaleDateStringOptions } from '../../shared/config/locale-date-string-options.const';
import { cloneDeep } from 'lodash';
import { fireToast } from '../../notification/functions/fire-toast.function';

@Component({
  selector: 'app-answerable-question',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    NgOptimizedImage,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatCardModule,
    MatSelectModule,
    MatTooltipModule,
    MatListModule,
    FontAwesomeModule,
    IconNumberSequenceComponent,
    ServerImgPipe,
    IndexToAplhabetCharPipe,
    LetterIndexToAplhabetCharPipe,
    AlternativeTooltipPipe,
  ],
  templateUrl: './answerable-question.component.html',
  styleUrl: './answerable-question.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerableQuestionComponent implements OnInit, OnChanges {
  private destroy$ = new RxJsSubject<void>();
  @ViewChild(MatSelectionList) selectionList?: MatSelectionList;

  @Output() nextPage = new EventEmitter<boolean>();

  @Input()
  _question?: Question;

  @Input() questionNo?: number;

  @Input() prevAnswer?: number;

  @Input() correctAnswer?: number;
  @Input() answeredAt?: number;

  @Input() pageEnd?: number;
  @Input() examTotalQuestions?: number;
  @Input() questionIndex?: number;

  faPenClip = faPenClip;
  faCheck = faCheck;
  faSquareXmark = faSquareXmark;
  faSquareCheck = faSquareCheck;
  faCheckDouble = faCheckDouble

  selectedIndex: WritableSignal<number | undefined> = signal(undefined);

  answeredAtDate?: Date;

  // answeredIndex: WritableSignal<number | undefined> = signal(undefined);

  question$ = new BehaviorSubject<Question | undefined>(undefined);

  answerMap = signal(new Map<string, number>());

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

  selectedAnswer: WritableSignal<number | undefined> = signal(undefined);

  localeDateStringOptions = toLocaleDateStringOptions;

  constructor(
    private subjectsService: SubjectsService,
    private institutionsService: InstitutionsService,
    private examService: ExamsService,
    private boardsService: BoardsService,
    private questionsService: QuestionsService
  ) {}

  ngOnInit(): void {
    if (
      this.prevAnswer === undefined ||
      this.prevAnswer === null ||
      !this._question
    )
      return;
    // console.log('@@@@@@', this.correctAnswer, this.answeredAt, this.prevAnswer);
    this.answerMap.update((m) => {
      if (
        this.prevAnswer === undefined ||
        this.prevAnswer === null ||
        !this._question
      )
        return m;
      const updatedMap = cloneDeep(m);
      updatedMap.set(this._question.id, this.prevAnswer);

      return updatedMap;
    });
    if (!this.answeredAt) return;
    this.answeredAtDate = new Date(this.answeredAt);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('@@@@', cloneDeep({ changes }));
    if (!changes['_question']) return;
    if (changes['_question']) {
      const question = changes['_question'].currentValue;
      if (!question) return;
      this.question$.next(question);
    }
  }

  chooseAnswer() {
    if (!this.selectionList || this.answeredAt) return;
    // console.log('@@@@@@@', this.answeredAt);

    this.selectedIndex.set(
      this.selectionList.selectedOptions.selected[0].value
    );
  }

  answer() {
    if (this.correctAnswer) return;
    const answeredIndex = this.selectedIndex();
    const question = this.question();
    if (answeredIndex === undefined || !question) return;

    const { id } = question;
    const answer: AnswerDto = {
      questionId: id,
      answeredAlternativeIndex: answeredIndex,
    };

    this.questionsService.answer(answer).subscribe(() => {
      this.answerMap.update((m) => {
        const updatedMap = cloneDeep(m);
        updatedMap.set(question.id, answeredIndex);

        return updatedMap;
      });

      if (
        !this.pageEnd ||
        !this.questionNo ||
        !this.examTotalQuestions ||
        this.questionIndex === undefined
      )
        return;

      console.log('@@@@', {
        pageEnd: this.pageEnd,
        questionIndex: this.questionIndex,
        questionNo: this.questionNo,
        examTotalQuestions: this.examTotalQuestions,
      });

      if (
        this.pageEnd !== this.questionIndex + 1 &&
        this.questionNo !== this.examTotalQuestions
      )
        return;

      if (this.pageEnd === this.questionIndex + 1) {
        fireToast('Muito bom!😉', 'vamos virar a página pra você', 'success');
      }

      setTimeout(
        () => {
          this.nextPage.next(true);
        },
        this.pageEnd === this.questionIndex + 1 ? 3000 : 0
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
