import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  registerLocaleData,
} from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { EMPTY, Subject as RxJsSubject, iif, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  faFont,
  faFingerprint,
  faArrowLeft,
  faSave,
  faTrash,
  faClock,
  faImage,
  faBarcode,
  faCircleInfo,
  faClipboardQuestion,
  faAdd,
  faCirclePlus,
  faTimes,
  faCircleMinus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import Swal from 'sweetalert2';
import { fireToast } from '../../../../../../notification/functions/fire-toast.function';
import { Institution } from '../../../../../../models/institution.model';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import { assessmentExamRecordLabels } from '../../../../../../shared/constants/assessment-exam-labels.const';
import { Exam } from '../../../../../../models/exam.model';
import { ExamAdminService } from '../../../../../../services/admin/exams/exam-admin.service';
import { Board } from '../../../../../../models/board.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BaseQuestion,
  MockQuestion,
  Question,
} from '../../../../../../models/question.model';
import { YearSelectorComponent } from '../../../../../../components/year-selector/year-selector.component';
import { mockExamRecordLabels } from '../../../../../../shared/constants/mock-exam-labels.const';
import { ServerImgPipe } from '../../../../../../shared/pipes/server-img.pipe';
import { SubjectSelectorComponent } from '../../../../../../components/subject-selector/subject-selector.component';
import { Subject } from '../../../../../../models/subject.model';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { QuestionSelectorComponent } from '../../../../../../components/question-selector/question-selector.component';
import { ExamType } from '../../../../../../shared/enums/exam-type.enum';
import { InstitutionSelectorComponent } from '../../../../../../components/institution-selector/institution-selector.component';
import { BoardSelectorComponent } from '../../../../../../components/board-selector/board-selector.component';
import { EditAssessmentExamDto } from '../../../../../../services/admin/exams/interfaces/edit-assessment-exam-dto.interface';
import { AddAssessmentExamDto } from '../../../../../../services/admin/exams/interfaces/add-assessment-exam-dto.interface';
import { EditMockExamDto } from '../../../../../../services/admin/exams/interfaces/edit-mock-exam-dto.interface';
import { AddMockExamDto } from '../../../../../../services/admin/exams/interfaces/add-mock-exam-dto.interface';
import { QuestionAdminService } from '../../../../../../services/admin/questions/question-admin.service';
import { cloneDeep } from 'lodash';
import { LettersNumbersAndDashOnlyDirective } from '../../../../../../shared/directives/letters-numbers-and-dash-only.directive';
import { CustomFormValidators } from '../../../../../../shared/utils/custom-form-validators.model';

registerLocaleData(localePtBr);

@Component({
  selector: 'exams-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    CdkDropList,
    CdkDrag,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    FontAwesomeModule,
    YearSelectorComponent,
    BoardSelectorComponent,
    SubjectSelectorComponent,
    InstitutionSelectorComponent,
    QuestionSelectorComponent,
    LettersNumbersAndDashOnlyDirective,
    ServerImgPipe,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './add-edit.component.html',
  styleUrl: './add-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditComponent implements OnInit, OnDestroy {
  private destroy$ = new RxJsSubject<void>();

  faFont = faFont;
  faFingerprint = faFingerprint;
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faTrash = faTrash;
  faClock = faClock;
  faImage = faImage;
  faBarcode = faBarcode;
  faCircleInfo = faCircleInfo;
  faTimes = faTimes;
  faClipboardQuestion = faClipboardQuestion;
  faAdd = faAdd;
  faCirclePlus = faCirclePlus;
  faCircleMinus = faCircleMinus;

  type = signal(ExamType.ASSESSMENT);

  labels = assessmentExamRecordLabels;

  loading = signal(false);

  form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50),
      ],
      asyncValidators: [
        CustomFormValidators.createQuestionCodeValidator(this.examAdminService),
      ],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    }),
    year: new FormControl<number | undefined>(undefined, {
      nonNullable: true,
    }),
    questions: new FormArray<FormControl<Question | BaseQuestion>>([]),
    mockQuestions: new FormArray<
      FormGroup<{
        subjectId: FormControl<string>;
        subject: FormControl<Subject>;
        times: FormControl<number>;
      }>
    >([]),
    institutionId: new FormControl<Institution | string | undefined>(
      undefined,
      {
        nonNullable: true,
      }
    ),
    boardId: new FormControl<Board | string | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  markAddMockQuestionFormGroupSubjectAsTouched = signal(false);
  markAddAssessmentQuestionFormControlAsTouched = signal(false);
  clearAddAssessmentQuestionFormControl: WritableSignal<boolean> =
    signal(false);
  markInstitutionSelectorAsTouched = signal(false);
  markBoardSelectorAsTouched = signal(false);

  addMockQuestionsFromGroup = new FormGroup({
    subjectId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subject: new FormControl<Subject | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    times: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  addAssesmentQuestionsFormControl = new FormControl<Question | undefined>(
    undefined,
    { nonNullable: true, validators: [Validators.required] }
  );

  updatedRecord: WritableSignal<Exam | undefined> = signal(undefined);
  isEdit = computed(() => !!this.updatedRecord());

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private examAdminService: ExamAdminService,
    private questionAdminService: QuestionAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((paramMap) => {
          const id = paramMap.get('id');
          if (!id) {
            this.loading.set(false);
            return EMPTY;
          }
          this.loading.set(true);
          return this.examAdminService.getOne(id);
        })
      )
      .subscribe({
        next: (record) => {
          this.loading.set(false);
          this.updatedRecord.set(record);
          if (!record) return;
          this.form.controls['code'].patchValue(record.code);
          this.form.controls['code'].clearAsyncValidators();
          this.form.controls['code'].updateValueAndValidity();

          this.form.controls['name'].patchValue(record.name);
          // if (record.questions && record.questions.length) {
          //   this.loadQuestions(
          //     this.form.controls['questions'],
          //     record.questions
          //   );
          // }
          this.form.controls['year'].patchValue(record.year);

          if (record.institutionId) {
            this.form.controls['institutionId'].patchValue(
              record.institutionId
            );
          }

          if (record.boardId) {
            this.form.controls['boardId'].patchValue(record.boardId);
          }
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });

    this.labels = this.router.url.includes(assessmentExamRecordLabels.uri)
      ? assessmentExamRecordLabels
      : mockExamRecordLabels;

    this.type.set(
      this.router.url.includes(assessmentExamRecordLabels.uri)
        ? ExamType.ASSESSMENT
        : ExamType.MOCK
    );
  }

  pushQuestionToFormArray(
    formArray: FormArray<FormControl<BaseQuestion | Question>>,
    control: FormControl<BaseQuestion | Question>
  ) {
    formArray.push(control);
  }

  loadQuestions(
    formArray: FormArray<FormControl<BaseQuestion | Question>>,
    questions: BaseQuestion[]
  ) {
    formArray.clear();
    questions.forEach((q) => {
      const control = this.createNewFormControl(q);
      this.pushQuestionToFormArray(formArray, control);
    });
  }

  private createNewFormControl(value: BaseQuestion) {
    return new FormControl(value, { nonNullable: true });
  }

  onSelectAddMockQuestionSubject(subject: Subject) {
    this.addMockQuestionsFromGroup.controls['subject'].patchValue(subject);
    this.addMockQuestionsFromGroup.controls['subject'].markAsTouched();
    this.addMockQuestionsFromGroup.controls['subjectId'].patchValue(subject.id);
    this.addMockQuestionsFromGroup.controls['subjectId'].markAsTouched();

    this.questionAdminService
      .count('subjectId', subject.dbId)
      .subscribe((result) => {
        if (!result || !result.success || result.total === 0) {
          this.addMockQuestionsFromGroup.controls['subject'].reset();
          this.addMockQuestionsFromGroup.controls['subjectId'].reset();
          this.addMockQuestionsFromGroup.controls['times'].clearValidators();
          fireToast(
            'Houve um erro!',
            'A disciplina escolhida é inválida! Favor reportar.',
            'error'
          );
          return;
        }

        this.addMockQuestionsFromGroup.controls['times'].addValidators(
          Validators.max(result.total)
        );
      });
  }

  addMockQuestionSubject() {
    const { subjectId, subject, times } = this.addMockQuestionsFromGroup.value;
    if (
      this.addMockQuestionsFromGroup.invalid ||
      !subjectId ||
      !subject ||
      !times
    ) {
      this.addMockQuestionsFromGroup.markAllAsTouched();
      this.markAddMockQuestionFormGroupSubjectAsTouched.set(true);
      return;
    }
    const formGroup = new FormGroup({
      subjectId: new FormControl<string>(subject.id, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      subject: new FormControl<Subject>(subject, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      times: new FormControl<number>(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
    });
    this.form.controls['mockQuestions'].controls.push(formGroup);
  }

  onUpdateMockQuestionSubject(subject: Subject, index: number) {
    const formGroup = this.form.controls['mockQuestions'].controls.at(index);
    if (!formGroup) {
      console.error(
        `onUpdateMockQuestionSubject -> missing formGroup at mockQuestions formArray at index ${index}`
      );
      return;
    }

    formGroup.controls['subject'].patchValue(subject);
    formGroup.controls['subjectId'].patchValue(subject.id);

    this.questionAdminService
      .count('subjectId', subject.dbId)
      .subscribe((result) => {
        if (!result || !result.success || result.total === 0) {
          formGroup.controls['subject'].reset();
          formGroup.controls['subjectId'].reset();
          formGroup.controls['times'].clearValidators();
          fireToast(
            'Houve um erro!',
            'A disciplina escolhida é inválida! Favor reportar.',
            'error'
          );
          return;
        }

        formGroup.controls['times'].addValidators(Validators.max(result.total));
      });
  }

  onSelectInstitution(institution: Institution) {
    this.form.controls['institutionId'].patchValue(institution);
    this.markInstitutionSelectorAsTouched.set(true);
  }

  onSelectedBoard(board: Board) {
    this.form.controls['boardId'].patchValue(board);
    this.markBoardSelectorAsTouched.set(true);
  }

  onSelectAddAssessmentQuestion(question: Question) {
    this.addAssesmentQuestionsFormControl.patchValue(question);
    this.addAssesmentQuestionsFormControl.markAsTouched();
  }

  addAssessmentQuestion() {
    const question = this.addAssesmentQuestionsFormControl.value;
    if (this.addAssesmentQuestionsFormControl.invalid || !question) {
      this.addAssesmentQuestionsFormControl.markAsTouched();
      this.markAddAssessmentQuestionFormControlAsTouched.set(true);
      return;
    }

    const control = new FormControl<Question>(question, {
      nonNullable: true,
      validators: [Validators.required],
    });
    this.pushQuestionToFormArray(this.form.controls['questions'], control);
    this.addAssesmentQuestionsFormControl.reset();
    this.clearAddAssessmentQuestionFormControl.set(true);
    console.log('SHOULD CLEAR');
    this.clearAddAssessmentQuestionFormControl.set(false);
  }

  onUpdateSelectedQuestion(question: Question, index: number) {
    const formControl = this.form.controls['questions'].controls.at(index);
    if (!formControl) {
      console.error(
        `onUpdateSelectedQuestion -> missing formControl at questions formArray at index ${index}`
      );
      return;
    }

    formControl.patchValue(question);
  }

  updateArrayOrder<T>(
    array: T[],
    previousIndex: number,
    currentIndex: number
  ): T[] {
    const newArray = [...array]; // Create a copy of the original array
    const [removedItem] = newArray.splice(previousIndex, 1); // Remove the item from the previous position
    newArray.splice(currentIndex, 0, removedItem); // Insert the item at the new position
    return newArray;
  }

  drop({ previousIndex, currentIndex }: CdkDragDrop<string[]>) {
    const questionsFormArray = this.form.controls['questions'];
    const previousFormControl = cloneDeep(questionsFormArray.at(previousIndex));
    const currentFormControl = cloneDeep(questionsFormArray.at(currentIndex));

    console.log({
      previousIndex,
      previousValue: previousFormControl.value.code,
      currentIndex,
      currentValue: currentFormControl.value.code,
    });

    questionsFormArray.removeAt(previousIndex);
    questionsFormArray.insert(previousIndex, currentFormControl);
    questionsFormArray.removeAt(currentIndex);
    questionsFormArray.insert(currentIndex, previousFormControl);

    questionsFormArray.controls.map((c) => {
      console.log('END RESULT', c.value.code);
    });

    this.cd.detectChanges();
  }

  removeQuestion(index: number) {
    const formGroup = this.form.controls['questions'].at(index);
    if (!formGroup) return;
    this.form.controls['questions'].removeAt(index);
  }

  saveMockExam() {
    const { code, name, mockQuestions } = this.form.getRawValue();
    const updatedRecord = this.updatedRecord();
    if (updatedRecord) {
      const dto: EditMockExamDto = {
        name,
        mockQuestions: mockQuestions.map((mq) => ({
          times: mq.times,
          subjectId: mq.subjectId,
        })),
      };
      return this.examAdminService.edit(updatedRecord.id, dto, ExamType.MOCK);
    }
    const dto: AddMockExamDto = {
      code,
      name,
      mockQuestions: mockQuestions.map((mq) => ({
        times: mq.times,
        subjectId: mq.subjectId,
      })),
    };
    return this.examAdminService.add(dto, ExamType.MOCK);
  }

  saveAssessmentExam() {
    const {
      code,
      name,
      year,
      questions,
      institutionId: institution,
      boardId: board,
    } = this.form.getRawValue();
    const updatedRecord = this.updatedRecord();
    if (updatedRecord) {
      const dto: EditAssessmentExamDto = {
        name,
        year,
        questionsIds: questions.map((q) => q.id),
        institutionId:
          institution && typeof institution !== 'string'
            ? institution.id
            : undefined,
        boardId: board && typeof board !== 'string' ? board.id : undefined,
      };
      return this.examAdminService.edit(
        updatedRecord.id,
        dto,
        ExamType.ASSESSMENT
      );
    }
    const dto: AddAssessmentExamDto = {
      code,
      name,
      year,
      questionsIds: questions.map((q) => q.id),
      institutionId:
        institution && typeof institution !== 'string'
          ? institution.id
          : undefined,
      boardId: board && typeof board !== 'string' ? board.id : undefined,
    };

    return this.examAdminService.add(dto, ExamType.ASSESSMENT);
  }

  save() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      console.log(this.form.errors);
      return fireToast('Erro', 'ajuste seu formulário', 'error');
    }
    const { name } = this.form.getRawValue();
    iif(
      () => this.type() === ExamType.ASSESSMENT,
      this.saveAssessmentExam(),
      this.saveMockExam()
    ).subscribe({
      next: (result) => {
        if (!result.success) {
          return fireGenericError(
            { name },
            this.labels.labelCapitalized,
            this.isEdit()
              ? this.labels.defArticle === 'o'
                ? 'atualizado'
                : 'atualizada'
              : this.labels.defArticle === 'o'
              ? 'criado'
              : 'criada'
          );
        }
        fireGenericSuccess(
          { name },
          this.labels.labelCapitalized,
          this.isEdit()
            ? this.labels.defArticle === 'o'
              ? 'atualizado'
              : 'atualizada'
            : this.labels.defArticle === 'o'
            ? 'criado'
            : 'criada'
        );
        this.navigateToList();
      },
      error: (err) => {
        fireGenericError(
          { name },
          this.labels.labelCapitalized,
          this.isEdit()
            ? this.labels.defArticle === 'o'
              ? 'atualizado'
              : 'atualizada'
            : this.labels.defArticle === 'o'
            ? 'criado'
            : 'criada',
          err
        );
      },
    });
  }

  async remove() {
    const toBeRemovedRecord = this.updatedRecord();
    if (!this.isEdit || !toBeRemovedRecord) return;
    const { isConfirmed } = await Swal.fire({
      title: `Tem certeza que deseja excluir ${this.labels.indefArticle} ${this.labels.labelCapitalized} do banco de dados?`,
      icon: 'question',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      heightAuto: false,
    });
    if (!isConfirmed) return;
    this.loading.set(true);
    const { id, code } = toBeRemovedRecord;
    if (!id) return;
    this.examAdminService.remove(id, toBeRemovedRecord.type).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (!result.success) {
          return fireGenericError(
            { name: code },
            `${this.labels.defArticle.toLocaleUpperCase()} ${
              this.labels.labelCapitalized
            }`,
            this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
          );
        }
        fireGenericSuccess(
          { name: code },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
        );
        this.navigateToList();
      },
      error: (err) => {
        this.loading.set(false);
        fireGenericError(
          { name: code },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada',
          err
        );
      },
    });
  }

  onYearSelected(year: number) {
    this.form.controls['year'].patchValue(year);
  }

  navigateToList() {
    this.router.navigate([
      'painel',
      'admin',
      'testes',
      this.labels.uri,
      'editar',
    ]);
  }

  trackBy(_index: number, fc: FormControl<Question | BaseQuestion>) {
    return fc.value.code;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
