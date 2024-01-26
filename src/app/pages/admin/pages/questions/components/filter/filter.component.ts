import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Institution } from '../../../../../../models/institution.model';
import { EducationStage } from '../../../../../../shared/enums/education-stage';
import { Board } from '../../../../../../models/board.model';
import { Subject as RxJsSubject } from 'rxjs';
import { BaseSubject } from '../../../../../../models/subject.model';
import { MatButtonModule } from '@angular/material/button';
import { BoardSelectorComponent } from '../../../../../../components/board-selector/board-selector.component';
import { InstitutionSelectorComponent } from '../../../../../../components/institution-selector/institution-selector.component';
import { YearSelectorComponent } from '../../../../../../components/year-selector/year-selector.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faGraduationCap,
  faTimes,
  faArrowRight,
  faArrowLeft,
  faHashtag,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { EDUCATION_STAGE_OPTIONS } from '../../../../../../shared/constants/education-stage-options';
import { MatSelectModule } from '@angular/material/select';
import { QuestionsService } from '../../../../../../services/questions.service';
import {
  QuestionFilters,
  MultipleValuesQuestionFilter,
  RangeValueQuestionFilter,
  SelectorQuestionFilter,
  SingleValueQuestionFilter,
} from '../../../../../../shared/interfaces/filters.interface';
import { FilterType } from '../../../../../../shared/enums/filter-type.enum';
import { SubjectsService } from '../../../../../../services/subjects.service';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  QuestionFilter,
  QuestionFilterPt,
} from '../../../../../../shared/enums/question-filters.enum';
import { AnswerableQuestionsService } from '../../../../../../services/answerable-questions.service';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatCheckboxModule,
    MatStepperModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    FontAwesomeModule,
    BoardSelectorComponent,
    InstitutionSelectorComponent,
    YearSelectorComponent,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements OnInit, OnDestroy {
  isStepperLinear = signal(false);

  faTimes = faTimes;
  faGraduationCap = faGraduationCap;
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faHashtag = faHashtag;
  faCircleCheck = faCircleCheck;

  educationStageOptions = EDUCATION_STAGE_OPTIONS;

  destroy$ = new RxJsSubject<void>();

  firstFormGroup = new FormGroup({
    year: new FormControl<number | undefined>(undefined, { nonNullable: true }),
    isStartingYear: new FormControl<boolean>(false, { nonNullable: true }),
    institutionId: new FormControl<Institution | string | undefined>(
      undefined,
      {
        nonNullable: true,
      }
    ),
    boardIds: new FormArray([] as FormControl<Board>[]),
    educationStage: new FormControl<EducationStage | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  subjectsFormArray = new FormArray<
    FormGroup<{ subjectId: FormControl<string>; quantity: FormControl<number> }>
  >([]);

  clearBoardSelector = signal(false);

  dataSource = signal(
    [] as {
      total: number;
      subject: BaseSubject;
    }[]
  );

  displayedColumns: string[] = ['name', 'quantity', 'total'];

  constructor(
    private answerableQuestionsService: AnswerableQuestionsService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onSelectedIndexChange(index: number) {
    this.isStepperLinear.set(index === 1);
    if (index === 1) {
      this.applyFirstFiltersAndPaginateSubjectsSummary();
    }
  }

  getFirstFilters() {
    const {
      year,
      isStartingYear,
      institutionId: institution,
      boardIds: boards,
      educationStage,
    } = this.firstFormGroup.value;

    const filters: QuestionFilters[] = [];

    if (year) {
      const currentYear = new Date().getFullYear();
      const yearFilter = isStartingYear
        ? ({
            id: QuestionFilter.fromTo,
            type: FilterType.RANGE,
            key: 'year',
            values: [year, currentYear],
          } as RangeValueQuestionFilter)
        : ({
            id: QuestionFilter.year,
            type: FilterType.SINGLE_VALUE,
            key: 'year',
            value: year,
          } as SingleValueQuestionFilter);
      filters.push(yearFilter);
    }
    if (institution && typeof institution !== 'string') {
      const institutionFilter: SingleValueQuestionFilter = {
        id: QuestionFilter.institutionId,
        type: FilterType.SINGLE_VALUE,
        key: 'institutionId',
        value: institution.id,
      };
      filters.push(institutionFilter);
    }

    if (boards && boards.length) {
      const boardsFilter: MultipleValuesQuestionFilter = {
        id: QuestionFilter.boardIdOR,
        type: FilterType.MULTIPLE_VALUES,
        key: 'boardID',
        condition: 'OR',
        values: [],
      };

      boards.forEach((board) => {
        boardsFilter.values.push(board.id);
      });
      filters.push(boardsFilter);
    }

    // this check allow us to bypass EducationStage.NONE
    if (educationStage) {
      const educationStageFilter: SingleValueQuestionFilter = {
        id: QuestionFilter.educationStage,
        key: 'educationStage',
        type: FilterType.SINGLE_VALUE,
        value: educationStage,
      };
      filters.push(educationStageFilter);
    }

    return filters;
  }

  applyFirstFiltersAndPaginateSubjectsSummary() {
    const filters = this.getFirstFilters();

    const params = this.mapQuestionFiltersToQueryParams(filters);

    this.answerableQuestionsService
      .applyFirstFiltersAndGetSubjectsSummary(params)
      .subscribe((results) => {
        this.dataSource.set(results);

        results.forEach((r) => {
          const control = new FormGroup({
            subjectId: new FormControl(r.subject.id, { nonNullable: true }),
            quantity: new FormControl(0, {
              nonNullable: true,
              validators: [Validators.max(r.total)],
            }),
          });
          this.subjectsFormArray.push(control);
        });
      });
  }

  mapQuestionFiltersToQueryParams(
    filters: QuestionFilters[],
    queryParamsLanguage: 'en' | 'pt' = 'en'
  ) {
    const singleParams: Params = {};
    const multipleParams: Params = {};
    const paramFilter =
      queryParamsLanguage === 'en' ? QuestionFilter : QuestionFilterPt;

    filters.forEach((filter) => {
      switch (filter.id) {
        case QuestionFilter.year:
          singleParams[paramFilter.year] = filter.value;
          return;
        case QuestionFilter.institutionId:
          singleParams[paramFilter.institutionId] = filter.value;
          return;
        case QuestionFilter.educationStage:
          singleParams[paramFilter.educationStage] = filter.value;
          return;
        case QuestionFilter.fromTo:
          singleParams[paramFilter.fromTo] = filter.values;
          return;
        case QuestionFilter.boardIdOR:
          if (multipleParams[paramFilter.boardIdOR]) {
            multipleParams[paramFilter.boardIdOR] = [
              ...multipleParams[paramFilter.boardIdOR],
              ...filter.values,
            ];
            return;
          }
          multipleParams[paramFilter.boardIdOR] = filter.values;
          return;
        case QuestionFilter.subjectIdOR:
          if (multipleParams[paramFilter.subjectIdOR]) {
            multipleParams[paramFilter.subjectIdOR] = [
              ...multipleParams[paramFilter.subjectIdOR],
              ...filter.values,
            ];
            return;
          }
          multipleParams[paramFilter.subjectIdOR] = filter.values;
          return;
        case QuestionFilter.subjectIdSELECTOR:
          const value = `${filter.values[0]}_${filter.values[1]}`;
          if (multipleParams[paramFilter.subjectIdSELECTOR]) {
            multipleParams[paramFilter.subjectIdSELECTOR] = [
              ...multipleParams[paramFilter.subjectIdSELECTOR],
              value,
            ];
            return;
          }
          multipleParams[paramFilter.subjectIdSELECTOR] = [value];
          return;
        default:
          return;
      }
    });

    const params: Params = { ...singleParams, ...multipleParams };

    return params;
  }

  filter() {
    let filters = this.getFirstFilters();

    const subjects = this.subjectsFormArray.value as {
      subjectId: string;
      quantity: number;
    }[];

    const subjectsFilters: SelectorQuestionFilter[] = [];

    subjects.forEach((subject) => {
      if (!subject.quantity) return;
      const filter: SelectorQuestionFilter = {
        id: QuestionFilter.subjectIdSELECTOR,
        type: FilterType.SELECTOR,
        key: 'subjectId',
        condition: 'OR',
        values: [subject.quantity, subject.subjectId],
      };
      subjectsFilters.push(filter);
    });

    filters = [...filters, ...subjectsFilters];

    const mappedParams = this.mapQuestionFiltersToQueryParams(filters, 'pt');

    this.router.navigate([], {
      fragment: 'resolver',
      queryParams: mappedParams,
    });
  }

  onYearSelected(year: number) {
    this.firstFormGroup.controls['year'].patchValue(year);
  }

  checkStartingYear(checked: boolean) {
    this.firstFormGroup.controls['isStartingYear'].setValue(checked);
  }

  onSelectedBoard(board: Board) {
    const control = new FormControl(board, { nonNullable: true });
    this.firstFormGroup.controls['boardIds'].push(control);
    this.clearBoardSelector.set(true);
  }

  removeBoardAt(index: number) {
    this.firstFormGroup.controls['boardIds'].removeAt(index);
  }

  onSelectInstitution(institution: Institution) {
    this.firstFormGroup.controls['institutionId'].patchValue(institution);
  }

  // new FormControl<Board | string | undefined>(undefined, {
  //   nonNullable: true,
  // }),

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
