import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faA,
  faAlignJustify,
  faB,
  faBarcode,
  faBuilding,
  faC,
  faCalendar,
  faCheckDouble,
  faCircleCheck,
  faD,
  faE,
  faFileExcel,
  faFileImage,
  faFileUpload,
  faGraduationCap,
  faHashtag,
  faImage,
  faListCheck,
  faListOl,
  faSave,
  faSheetPlastic,
  faUsersLine,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FileUploaderComponent } from '../../../../../../components/file-uploader/file-uploader.component';
import { read, utils } from 'xlsx';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from '../../../../../../models/subject.model';
import { Institution } from '../../../../../../models/institution.model';
import { Board } from '../../../../../../models/board.model';
import { Exam } from '../../../../../../models/exam.model';
import { EducationStage } from '../../../../../../shared/enums/education-stage';
import { CustomFormValidators } from '../../../../../../shared/models/custom-form-validators.model';
import { QuestionsAdminService } from '../../../../../../services/admin/questions/questions-admin.service';
import { MatTableModule } from '@angular/material/table';
import { cloneDeep } from 'lodash';
import { fireToast } from '../../../../../../notification/functions/fire-toast.function';
import { SubjectSelectorComponent } from '../../../../../../components/subject-selector/subject-selector.component';
import { InstitutionSelectorComponent } from '../../../../../../components/institution-selector/institution-selector.component';
import { BoardSelectorComponent } from '../../../../../../components/board-selector/board-selector.component';
import { YearSelectorComponent } from '../../../../../../components/year-selector/year-selector.component';
import { LetterIndexToAplhabetCharPipe } from '../../../../../../shared/pipes/letter-index-to-char.pipe';
import { ExamSelectorComponent } from '../../../../../../components/exam-selector/exam-selector.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TruncatePipe } from '../../../../../../shared/pipes/truncate.pipe';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ImgUploadPreview } from '../../../../../../components/file-uploader/interface/img-upload-preview.interface';
import { MatSelectModule } from '@angular/material/select';
import { EDUCATION_STAGE_OPTIONS } from '../../../../../../shared/constants/education-stage-options';
import { AddQuestionDto } from '../../../../../../services/admin/questions/interfaces/add-question-dto.interface';
import { Alternative } from '../../../../../../models/question.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-bulk',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatSelectModule,
    FileUploaderComponent,
    SubjectSelectorComponent,
    InstitutionSelectorComponent,
    BoardSelectorComponent,
    ExamSelectorComponent,
    YearSelectorComponent,
    LetterIndexToAplhabetCharPipe,
    TruncatePipe,
  ],
  templateUrl: './add-bulk.component.html',
  styleUrl: './add-bulk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddBulkComponent implements OnInit {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  faImage = faImage;
  faFileExcel = faFileExcel;
  faFileUpload = faFileUpload;
  faHashtag = faHashtag;
  faBarcode = faBarcode;
  faAlignJustify = faAlignJustify;
  faFileImage = faFileImage;
  faA = faA;
  faB = faB;
  faC = faC;
  faD = faD;
  faE = faE;
  faCircleCheck = faCircleCheck;
  faCheckDouble = faCheckDouble;
  faGraduationCap = faGraduationCap;
  faCalendar = faCalendar;
  faSheetPlastic = faSheetPlastic;
  faBuilding = faBuilding;
  faUsersLine = faUsersLine;
  faListCheck = faListCheck;
  faSave = faSave;

  educationStageOptions = EDUCATION_STAGE_OPTIONS;

  form: FormArray<QuestionFormGroup> = new FormArray([] as QuestionFormGroup[]);

  displayedColumns = [
    'no',
    'code',
    'prompt',
    'illustration',
    'alternativeA',
    'alternativeB',
    'alternativeC',
    'alternativeD',
    'alternativeE',
    'correctIndex',
    'answerExplanation',
    'educationStage',
    'year',
    'subject',
    'institution',
    'board',
    'exam',
  ];

  constructor(
    private questionService: QuestionsAdminService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('oninit');
    this.form.clear();
  }

  handleFileUpload() {
    this.fileInput?.nativeElement.click();
  }

  onFileChange(target: EventTarget | null) {
    if (!target) return;
    const eventTarget = target as HTMLInputElement;
    const fileList = eventTarget.files;
    if (!fileList) return;

    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = async (e: ProgressEvent) => {
      let finalTarget = e.currentTarget;
      if (!finalTarget) return;
      const fileReader = finalTarget as FileReader;

      const workbook = read(fileReader.result, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const readResults = utils.sheet_to_json<SheetImportedQuestionLine>(
        workbook.Sheets[firstSheetName]
      );

      readResults.splice(0, 4);

      this.pushNewQuestionToForm(readResults);
      this.cd.detectChanges();
      setTimeout(() => {
        this.form.updateValueAndValidity();
        this.cd.detectChanges();
      }, 2000);
    };
  }

  private pushNewQuestionToForm(sheetLinesData: SheetImportedQuestionLine[]) {
    try {
      sheetLinesData.forEach((sheetLineData) => {
        const formGroup = this.convertQuestionLineToFormGroup(sheetLineData);
        this.form.push(formGroup);
      });
    } catch (error: any) {
      console.error(error);
      fireToast('Erro no upload', JSON.stringify(error), 'error');
    }
  }

  private convertQuestionLineToFormGroup(lineData: SheetImportedQuestionLine) {
    if (
      !lineData.code ||
      !lineData.prompt ||
      !lineData.subjectId ||
      !lineData.statementA ||
      !lineData.statementB ||
      !lineData.correctLetter
    ) {
      throw new Error(
        `"Line data code has missing values ${JSON.stringify(lineData)}`
      );
    }

    return new FormGroup({
      code: new FormControl(lineData.code.replace(/\n/g, ''), {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(50),
        ],
        asyncValidators: [
          CustomFormValidators.createQuestionCodeValidator(
            this.questionService
          ),
        ],
      }),
      prompt: new FormControl(lineData.prompt, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(5000),
        ],
      }),
      illustration: new FormControl(undefined, { nonNullable: true }),
      subjectId: new FormControl<Subject | string>(lineData.subjectId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      alternatives: this.pushAlternativesFormGroups([
        lineData.statementA,
        lineData.statementB,
        lineData.statementC,
        lineData.statementD,
        lineData.statementE,
      ]),
      correctIndex: new FormControl(
        this.correctLetterToCorrectIndex(lineData.correctLetter),
        { nonNullable: false, validators: [Validators.required] }
      ),
      answerExplanation: new FormControl(lineData.answerExplanation, {
        nonNullable: true,
      }),
      year: new FormControl(lineData.year, { nonNullable: true }),
      educationStage: new FormControl<EducationStage | undefined>(
        lineData.educationStage,
        {
          nonNullable: true,
        }
      ),
      institutionId: new FormControl<Institution | string | undefined>(
        lineData.institutionId,
        {
          nonNullable: true,
        }
      ),
      boardId: new FormControl<Board | string | undefined>(lineData.boardId, {
        nonNullable: true,
      }),
      examId: new FormControl<Exam | string | undefined>(lineData.examId, {
        nonNullable: true,
      }),
    }) as QuestionFormGroup;
  }

  private pushAlternativesFormGroups(
    alternatives: [
      string,
      string,
      string | undefined,
      string | undefined,
      string | undefined
    ]
  ) {
    const alternativesArray = new FormArray<
      FormGroup<{ statement: FormControl<string> }>
    >([], [CustomFormValidators.createAtLeastTwoValidator()]);

    alternatives.forEach((alternative) => {
      if (!alternative) return;
      const alternativeFormGroup = new FormGroup({
        statement: new FormControl(alternative, {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(1000),
          ],
        }),
      });
      alternativesArray.push(alternativeFormGroup);
    });

    return alternativesArray;
  }

  private correctLetterToCorrectIndex(correctLetter: string): number {
    switch (correctLetter) {
      case 'a':
        return 0;
      case 'b':
        return 1;
      case 'c':
        return 2;
      case 'd':
        return 3;
      case 'e':
        return 4;
      default:
        console.error({ correctLetter });
        throw new Error('Correct letter must be a, b, c, d or e');
    }
  }

  async uploadImageAndPatchControl(
    uploaderComponent: FileUploaderComponent,
    index: number,
    imagePreview?: ImgUploadPreview
  ) {
    if (!imagePreview || !imagePreview.imgSrc) return;

    const result = await uploaderComponent.upload();
    if (!result) return;
    const { img } = result;
    if (!img) return;

    this.form.at(index).controls['illustration'].patchValue(img);
  }

  saveQuestions() {
    if (this.form.invalid) {
      fireToast(
        'Erro!',
        'O arquivo enviado possui erros, corrija-os e envie o arquivo novamente',
        'error'
      );
      return;
    }
    const values = this.form.value;

    const dtos: AddQuestionDto[] = [];

    values.forEach((value) => {
      const {
        code,
        alternatives,
        prompt,
        correctIndex,
        subjectId: subject,
        illustration,
        year,
        educationStage,
        answerExplanation,
        institutionId: institution,
        boardId: board,
        examId: exam,
      } = value;
      if (
        !code ||
        !alternatives ||
        !alternatives.length ||
        !prompt ||
        !subject ||
        correctIndex === undefined
      )
        return;
      const addQuestionDto: AddQuestionDto = {
        code,
        prompt,
        alternatives: alternatives as Alternative[],
        correctIndex,
        subjectId:
          subject && typeof subject !== 'string' ? subject.id : subject,
        illustration,
        year,
        answerExplanation,
        educationStage,
        institutionId: institution
          ? typeof institution === 'string'
            ? institution
            : institution.id
          : undefined,
        boardId: board
          ? typeof board === 'string'
            ? board
            : board.id
          : undefined,
        examId: exam ? (typeof exam === 'string' ? exam : exam.id) : undefined,
      };

      dtos.push(addQuestionDto);
    });

    this.questionService.addBulk(dtos).subscribe((result) => {
      if (!result.success) return;
      this.form.clear();
      this.router.navigate(['painel', 'admin', 'questoes', 'editar']);
      fireToast(
        'Sucesso!',
        'as questões foram adicionadas com sucesso',
        'success'
      );
    });
  }
}

type SheetImportedQuestionLine = {
  no: number;
  code: string;
  prompt: string;
  correctLetter: string;
  subjectId: string;
  statementA: string;
  statementB: string;
  statementC?: string;
  statementD?: string;
  statementE?: string;
  educationStage?: number;
  answerExplanation?: string;
  year?: number;
  institutionId?: string;
  boardId?: string;
  examId?: string;
};

type QuestionFormGroup = FormGroup<{
  code: FormControl<string>;
  prompt: FormControl<string>;
  illustration: FormControl<string | undefined>;
  subjectId: FormControl<Subject | string>;
  alternatives: FormArray<FormGroup<{ statement: FormControl<string> }>>;
  answerExplanation: FormControl<string | undefined>;
  correctIndex: FormControl<number>;
  year: FormControl<number | undefined>;
  educationStage: FormControl<EducationStage | undefined>;
  institutionId: FormControl<string | Institution | undefined>;
  boardId: FormControl<string | Board | undefined>;
  examId: FormControl<string | Exam | undefined>;
}>;
