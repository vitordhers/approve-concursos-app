import {
  ChangeDetectionStrategy,
  Component,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamsService } from '../../services/exams.service';
import { ExamType } from '../../shared/enums/exam-type.enum';
import { assessmentExamRecordLabels } from '../../shared/constants/assessment-exam-labels.const';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { DEFAULT_PAGINATION_SIZE } from '../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../shared/constants/pagination-sizes.const';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExamCardComponent } from '../exam-card/exam-card.component';
import { LoaderComponent } from '../loader/loader.component';
import { mockExamRecordLabels } from '../../shared/constants/mock-exam-labels.const';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { fireToast } from '../../notification/functions/fire-toast.function';
import { Exam } from '../../models/exam.model';
import { MatPaginatorIntlPtBr } from '../../shared/config/pagination-intl.model';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ExamCardComponent,
    LoaderComponent,
    MatButtonModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    FontAwesomeModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentPage$ = new BehaviorSubject({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });

  searchControl = new FormControl<string | undefined>(undefined, {
    nonNullable: true,
    validators: [Validators.minLength(1)],
  });

  faMagnifyingGlass = faMagnifyingGlass;
  faTimes = faTimes;

  loadingData = signal(true);

  @Input()
  type?: ExamType;

  examType = ExamType;

  type$ = new Subject<ExamType>();

  private loadedExams$ = combineLatest([
    this.currentPage$.pipe(
      distinctUntilChanged(
        (prev, curr) =>
          prev?.start === curr?.start &&
          prev?.end === curr?.end &&
          prev?.pageSize === curr?.pageSize
      )
    ),
    this.type$,
  ]).pipe(
    takeUntil(this.destroy$),
    switchMap(([{ start, end, pageSize }, type]) => {
      return this.type
        ? this.examsService.paginate(start, end, pageSize, type)
        : of([]);
    }),
    tap(() => this.loadingData.set(false))
  );

  private searchedExams$ = new BehaviorSubject<Exam[]>([]);

  loadedExams = toSignal(this.loadedExams$);
  searchedExams = toSignal(this.searchedExams$);

  loadingActions = signal(false);
  isUsingSearch = signal(false);

  labels = assessmentExamRecordLabels;

  currentPageSize = DEFAULT_PAGINATION_SIZE;

  pageSizeOptions = PAGINATION_SIZES;

  constructor(public examsService: ExamsService) {}

  ngOnInit(): void {
    // this.searchControl.valueChanges
    //   .pipe(
    //     takeUntil(this.destroy$),
    //     debounceTime(300),
    //     switchMap((value) => {
    //       if (!value || value === '') return EMPTY;
    //       return this.examsService.search(value);
    //     })
    //   )
    //   .subscribe((results) => {
    //     this.isUsingSearch.set(true);
    //   });

    if (this.type === undefined || this.type === null) return;

    if (this.type === ExamType.MOCK) {
      this.labels = mockExamRecordLabels;
    }
    this.type$.next(this.type);
  }

  search() {
    const searchedValue = this.searchControl.value;
    if (this.searchControl.invalid || !searchedValue || searchedValue === '') {
      this.isUsingSearch.set(false);

      return fireToast(
        'Valor inválido de busca',
        'a pesquisa não pode estar vazia',
        'error'
      );
    }

    this.examsService.search(searchedValue).subscribe((results) => {
      this.searchedExams$.next(results);
      this.isUsingSearch.set(true);
    });
  }

  clearSearch() {
    this.searchControl.reset();
    this.isUsingSearch.set(false);
  }

  onPageEvent({ pageIndex, pageSize }: PageEvent) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    this.currentPageSize = pageSize;
    this.currentPage$.next({ start, end, pageSize });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
