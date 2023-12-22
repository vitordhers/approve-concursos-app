import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../../../../services/modal.service';
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
import { Subject as RxJsSubject, takeUntil } from 'rxjs';
import { BaseSubject, Subject } from '../../../../../../models/subject.model';
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
} from '@fortawesome/free-solid-svg-icons';
import { EDUCATION_STAGE_OPTIONS } from '../../../../../../shared/constants/education-stage-options';
import { MatSelectModule } from '@angular/material/select';
import { QuestionsService } from '../../../../../../services/questions.service';
import {
  Filters,
  MultipleValuesFilter,
  RangeValueFilter,
  SelectorFilter,
  SingleValueFilter,
} from '../../../../../../shared/interfaces/filters.interface';
import { FilterType } from '../../../../../../shared/enums/filter-type.enum';
import { SubjectsService } from '../../../../../../services/subjects.service';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';

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
    private ModalService: ModalService,
    private questionsService: QuestionsService,
    private router: Router
  ) {
    // year
    // institution
    // board
    // exam
    // educationStage
    // subject
  }

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

    const filters: Filters[] = [];

    if (year) {
      const currentYear = new Date().getFullYear();
      const yearFilter = isStartingYear
        ? ({
            type: FilterType.RANGE,
            key: 'year',
            from: year,
            to: currentYear,
          } as RangeValueFilter)
        : ({
            type: FilterType.SINGLE_VALUE,
            key: 'year',
            value: year,
          } as SingleValueFilter);
      filters.push(yearFilter);
    }
    if (institution && typeof institution !== 'string') {
      const institutionFilter: SingleValueFilter = {
        type: FilterType.SINGLE_VALUE,
        key: 'institutionId',
        value: institution.dbId,
      };
      filters.push(institutionFilter);
    }

    if (boards && boards.length) {
      const boardsFilter: MultipleValuesFilter = {
        type: FilterType.MULTIPLE_VALUES,
        key: 'boardId',
        condition: 'OR',
        values: [],
      };

      boards.forEach((board) => {
        boardsFilter.values.push(board.dbId);
      });
      filters.push(boardsFilter);
    }

    if (educationStage) {
      const educationStageFilter: SingleValueFilter = {
        type: FilterType.SINGLE_VALUE,
        key: 'educationStage',
        value: educationStage,
      };
      filters.push(educationStageFilter);
    }

    return filters;
  }

  applyFirstFiltersAndPaginateSubjectsSummary() {
    const filters = this.getFirstFilters();

    this.questionsService
      .applyFirstFiltersAndGetSubjectsSummary(filters)
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

  filter() {
    let filters = this.getFirstFilters();

    const subjects = this.subjectsFormArray.value;
    const subjectsFilters: SelectorFilter[] = [];

    subjects.forEach((subject) => {
      if (!subject.quantity) return;
      const filter: SelectorFilter = {
        type: FilterType.SELECTOR,
        key: 'subjectId',
        condition: 'OR',
        limit: subject.quantity,
        fetch: ['institutionId', 'subjectId', 'boardId', 'examId'],
        value: `subjects:${subject.subjectId}`,
      };
      subjectsFilters.push(filter);
    });

    filters = [...filters, ...subjectsFilters];

    const arrayString = filters.length ? JSON.stringify(filters) : '';

    const encodedArrayString = encodeURIComponent(arrayString);

    const params = new URLSearchParams({ data: encodedArrayString });
    const queryParams: Params = { data: encodedArrayString };

    this.router.navigate([], { fragment: 'resolver', queryParams });
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
  }
}
