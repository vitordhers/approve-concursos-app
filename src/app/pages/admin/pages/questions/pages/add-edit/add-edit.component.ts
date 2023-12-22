import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  ViewChild,
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
import {
  EMPTY,
  Subject as RxJsSubject,
  from,
  switchMap,
  takeUntil,
} from 'rxjs';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import {
  faFont,
  faFingerprint,
  faArrowLeft,
  faSave,
  faTrash,
  faClock,
  faImage,
  faCircleInfo,
  faAlignJustify,
  faListUl,
  faCircleCheck,
  faCirclePlus,
  faCircleMinus,
  faCalendarDay,
  faGraduationCap,
  faListOl,
  faBarcode,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import Swal from 'sweetalert2';
import { FileUploaderComponent } from '../../../../../../components/file-uploader/file-uploader.component';
import { fireToast } from '../../../../../../notification/functions/fire-toast.function';
import { ImgUploadPreview } from '../../../../../../components/file-uploader/interface/img-upload-preview.interface';
import { Entity } from '../../../../../../shared/enums/entity.enum';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import { Alternative, Question } from '../../../../../../models/question.model';
import { QuestionsAdminService } from '../../../../../../services/admin/questions/questions-admin.service';
import { AddQuestionDto } from '../../../../../../services/admin/questions/interfaces/add-question-dto.interface';
import { EditQuestionDto } from '../../../../../../services/admin/questions/interfaces/edit-question-dto.interface';
import { EducationStage } from '../../../../../../shared/enums/education-stage';
import { cloneDeep } from 'lodash';
import { Institution } from '../../../../../../models/institution.model';
import { Board } from '../../../../../../models/board.model';
import { Subject } from '../../../../../../models/subject.model';
import { ServerImgPipe } from '../../../../../../shared/pipes/server-img.pipe';
import { LetterIndexToAplhabetCharPipe } from '../../../../../../shared/pipes/letter-index-to-char.pipe';
import { IndexToAplhabetCharPipe } from '../../../../../../shared/pipes/letter-index-to-icon.pipe';
import { LettersNumbersAndDashOnlyDirective } from '../../../../../../shared/directives/letters-numbers-and-dash-only.directive';
import { displayCodeFn } from '../../../../../../shared/functions/display-fn-selectors.function';
import { InstitutionSelectorComponent } from '../../../../../../components/institution-selector/institution-selector.component';
import { Exam } from '../../../../../../models/exam.model';
import { EDUCATION_STAGE_OPTIONS } from '../../../../../../shared/constants/education-stage-options';
import { questionRecordLabels } from '../../../../../../shared/constants/question-record-labels.const';
import { BoardSelectorComponent } from '../../../../../../components/board-selector/board-selector.component';
import { SubjectSelectorComponent } from '../../../../../../components/subject-selector/subject-selector.component';
import { CustomFormValidators } from '../../../../../../shared/models/custom-form-validators.model';
import { YearSelectorComponent } from '../../../../../../components/year-selector/year-selector.component';

registerLocaleData(localePtBr);

@Component({
  selector: 'questions-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCardModule,
    FontAwesomeModule,
    FileUploaderComponent,
    ServerImgPipe,
    IndexToAplhabetCharPipe,
    LetterIndexToAplhabetCharPipe,
    LettersNumbersAndDashOnlyDirective,
    InstitutionSelectorComponent,
    BoardSelectorComponent,
    SubjectSelectorComponent,
    YearSelectorComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './add-edit.component.html',
  styleUrl: './add-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditComponent implements OnInit, OnDestroy {
  faFont = faFont;
  faFingerprint = faFingerprint;
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faTrash = faTrash;
  faClock = faClock;
  faImage = faImage;
  faCircleInfo = faCircleInfo;
  faAlignJustify = faAlignJustify;
  faListUl = faListUl;
  faCircleCheck = faCircleCheck;
  faCirclePlus = faCirclePlus;
  faCircleMinus = faCircleMinus;
  faCalendarDay = faCalendarDay;
  faGraduationCap = faGraduationCap;
  faListOl = faListOl;
  faBarcode = faBarcode;
  faCheckDouble = faCheckDouble;

  educationStageOptions = EDUCATION_STAGE_OPTIONS;

  labels = questionRecordLabels;

  loading = signal(false);

  @ViewChild(FileUploaderComponent)
  fileUploaderComponent?: FileUploaderComponent;

  private destroy$ = new RxJsSubject<void>();

  form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50),
      ],
      asyncValidators: [
        CustomFormValidators.createQuestionCodeValidator(this.questionService),
      ],
    }),
    prompt: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5000),
      ],
    }),
    illustration: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    subjectId: new FormControl<Subject | string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    alternatives: new FormArray<FormGroup<{ statement: FormControl<string> }>>(
      []
    ),
    answerExplanation: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5000),
      ],
    }),
    correctIndex: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    year: new FormControl<number | undefined>(undefined, {
      nonNullable: true,
    }),
    institutionId: new FormControl<Institution | string | undefined>(
      undefined,
      {
        nonNullable: true,
      }
    ),
    boardId: new FormControl<Board | string | undefined>(undefined, {
      nonNullable: true,
    }),
    examId: new FormControl<Exam | string | undefined>(undefined, {
      nonNullable: true,
    }),
    educationStage: new FormControl<EducationStage | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  insertAlternativeStatementControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.minLength(1), Validators.maxLength(1000)],
  });

  updatedRecord: WritableSignal<Question | undefined> = signal(undefined);

  loadSubjectValue: WritableSignal<Subject | string | undefined> =
    signal(undefined);

  loadBoardValue: WritableSignal<Board | string | undefined> =
    signal(undefined);

  loadInstitutionValue: WritableSignal<Institution | string | undefined> =
    signal(undefined);

  isEdit = computed(() => !!this.updatedRecord());

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private questionService: QuestionsAdminService
  ) {}

  patchPreview(imgPreview: ImgUploadPreview) {
    this.form.controls['illustration'].patchValue(imgPreview.imgSrc);
  }

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
          return this.questionService.getOne(id, true);
        })
      )
      .subscribe({
        next: (question) => {
          this.loading.set(false);
          this.updatedRecord.set(question);
          if (!question) return;

          this.form.reset();

          this.form.controls['code'].patchValue(question.code);
          this.form.controls['code'].clearAsyncValidators();
          this.form.controls['code'].updateValueAndValidity();
          this.form.controls['prompt'].patchValue(question.prompt);

          if (question.illustration) {
            this.form.controls['illustration'].patchValue(
              question.illustration
            );
          }
          this.form.controls['subjectId'].patchValue(question.subjectId);
          this.loadSubjectValue.set(question.subjectId);
          this.createAlternativesControls(
            this.form.controls['alternatives'],
            question.alternatives
          );

          this.form.controls['correctIndex'].patchValue(question.correctIndex);

          this.form.controls['year'].patchValue(question.year);
          if (question.institutionId) {
            this.form.controls['institutionId'].patchValue(
              question.institutionId
            );
            this.loadInstitutionValue.set(question.institutionId);
          }
          if (question.boardId) {
            this.form.controls['boardId'].patchValue(question.boardId);
            this.loadBoardValue.set(question.boardId);
          }
          if (question.examId) {
            this.form.controls['examId'].patchValue(question.examId);
          }
          if (question.educationStage) {
            this.form.controls['educationStage'].patchValue(
              question.educationStage
            );
          }
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  displayFn = displayCodeFn;

  private createAlternativesControls(
    formArray: FormArray<FormGroup<{ statement: FormControl<string> }>>,
    alternatives: Alternative[]
  ) {
    formArray.clear();
    alternatives.forEach((alt) => {
      const formGroup = new FormGroup({
        statement: new FormControl(alt.statement, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(1000),
          ],
        }),
      });
      formArray.push(formGroup);
    });
  }

  pushNewAlternative() {
    const currentInsertFormControl = cloneDeep(
      this.insertAlternativeStatementControl
    );
    currentInsertFormControl.addValidators(Validators.required);
    const formGroup = new FormGroup({ statement: currentInsertFormControl });
    this.form.controls['alternatives'].push(formGroup);
    this.form.controls['alternatives'].markAllAsTouched();

    this.insertAlternativeStatementControl.reset();
    this.insertAlternativeStatementControl.markAsUntouched();
    this.insertAlternativeStatementControl.markAsPristine();
  }

  removeAlternative(index: number) {
    this.form.controls['alternatives'].removeAt(index);
  }

  onSubjectSelected(record: Subject) {
    this.form.controls['subjectId'].patchValue(record);
  }
  onInstitutionSelected(record: Institution) {
    this.form.controls['institutionId'].patchValue(record);
  }
  onBoardSelected(record: Board) {
    this.form.controls['boardId'].patchValue(record);
  }
  onExamSelected(record: Exam) {
    this.form.controls['examId'].patchValue(record);
  }
  onYearSelected(year: number) {
    this.form.controls['year'].patchValue(year);
  }

  save() {
    if (!this.fileUploaderComponent) return;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      console.error(this.form.errors, this.form, this.form.valid);
      return fireToast('Erro', 'ajuste seu formulário', 'error');
    }
    const {
      code,
      prompt,
      subjectId: subject,
      answerExplanation,
      alternatives,
      correctIndex,
      year,
      institutionId: institution,
      boardId: board,
      examId: exam,
      educationStage,
    } = this.form.getRawValue();

    return from(this.fileUploaderComponent.upload(Entity.QUESTIONS))
      .pipe(
        switchMap((uploadedImg) => {
          const { img } = uploadedImg;

          const updatedRecord = this.updatedRecord();
          if (!updatedRecord) {
            const addRecordDto: AddQuestionDto = {
              code,
              prompt,
              illustration: img || undefined,
              subjectId:
                subject && typeof subject !== 'string' ? subject.id : subject,
              alternatives,
              answerExplanation,
              correctIndex,
              year: year || undefined,
              institutionId:
                institution && typeof institution !== 'string'
                  ? institution.id || undefined
                  : undefined,
              boardId:
                board && typeof board !== 'string'
                  ? board.id || undefined
                  : undefined,
              examId:
                exam && typeof exam !== 'string'
                  ? exam.id || undefined
                  : undefined,
              educationStage: educationStage || undefined,
            };
            return this.questionService.add(addRecordDto);
          }
          const editRecordDto: EditQuestionDto = {
            prompt,
            illustration: img || undefined,
            subjectId:
              subject && typeof subject !== 'string' ? subject.id : subject,
            alternatives,
            answerExplanation,
            correctIndex,
            year: year || undefined,
            institutionId:
              institution && typeof institution !== 'string'
                ? institution.id || undefined
                : undefined,
            boardId:
              board && typeof board !== 'string'
                ? board.id || undefined
                : undefined,
            examId:
              exam && typeof exam !== 'string'
                ? exam.id || undefined
                : undefined,
            educationStage: educationStage || undefined,
          };

          return this.questionService.edit(updatedRecord.id, editRecordDto);
        })
      )
      .subscribe({
        next: (result) => {
          if (!result.success) {
            return fireGenericError(
              { name: code },
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
            { name: code },
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
            { name: code },
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
    const updatedRecord = this.updatedRecord();
    if (!this.isEdit || !updatedRecord) return;
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
    const { id, code } = updatedRecord;
    if (!id) return;
    this.questionService.remove(id).subscribe({
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

  navigateToList() {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
