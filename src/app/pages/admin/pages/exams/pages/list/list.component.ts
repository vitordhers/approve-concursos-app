import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import localePtBr from '@angular/common/locales/pt';
import {
  faAdd,
  faFingerprint,
  faClock,
  faFont,
  faBars,
  faPenToSquare,
  faTrash,
  faBarcode,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import Swal from 'sweetalert2';
import { DEFAULT_PAGINATION_SIZE } from '../../../../../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../../../../../shared/constants/pagination-sizes.const';
import { MatPaginatorIntlPtBr } from '../../../../../../shared/config/pagination-intl.model';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import { ServerImgPipe } from '../../../../../../shared/pipes/server-img.pipe';
import { ExamAdminService } from '../../../../../../services/admin/exams/exam-admin.service';
import { ExamType } from '../../../../../../shared/enums/exam-type.enum';
import { assessmentExamRecordLabels } from '../../../../../../shared/constants/assessment-exam-labels.const';
import { mockExamRecordLabels } from '../../../../../../shared/constants/mock-exam-labels.const';
import { Exam } from '../../../../../../models/exam.model';

registerLocaleData(localePtBr);

@Component({
  selector: 'institution-list',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    FontAwesomeModule,
    ServerImgPipe,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit, OnDestroy {
  faAdd = faAdd;
  faFingerprint = faFingerprint;
  faClock = faClock;
  faFont = faFont;
  faBars = faBars;
  faTrash = faTrash;
  faPenToSquare = faPenToSquare;
  faBarcode = faBarcode;

  type$ = new BehaviorSubject(ExamType.ASSESSMENT);
  type = toSignal(this.type$);

  loadingData = signal(true);
  loadingActions = signal(false);

  labels = assessmentExamRecordLabels;

  private destroy$ = new Subject<void>();
  private currentPage$ = new BehaviorSubject({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });
  currentPageSize = DEFAULT_PAGINATION_SIZE;

  pageSizeOptions = PAGINATION_SIZES;
  displayedColumns: string[] = [
    'thumb',
    'id',
    'code',
    'name',
    'updatedAt',
    'actions',
  ];

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
    switchMap(([{ start, end, pageSize }, type]) =>
      this.examsAdminService.paginate(start, end, pageSize, type)
    )
  );
  loadedExams = toSignal(this.loadedExams$);

  constructor(
    public examsAdminService: ExamAdminService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.labels = this.router.url.includes(assessmentExamRecordLabels.uri)
      ? assessmentExamRecordLabels
      : mockExamRecordLabels;

    this.type$.next(
      this.router.url.includes(assessmentExamRecordLabels.uri)
        ? ExamType.ASSESSMENT
        : ExamType.MOCK
    );

    this.activatedRoute.url
      .pipe(
        takeUntil(this.destroy$),
        filter(([{ path }]) => path === 'editar')
      )
      .subscribe(() => {
        this.currentPage$.next({
          start: 0,
          end: this.currentPageSize,
          pageSize: this.currentPageSize,
        });
      });
  }

  onPageEvent({ pageIndex, pageSize }: PageEvent) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    this.currentPageSize = pageSize;

    this.currentPage$.next({ start, end, pageSize });
  }

  navigateToAdd() {
    this.router.navigate([
      'painel',
      'admin',
      'testes',
      this.labels.uri,
      'criar',
    ]);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar', id]);
  }

  async remove(exam: Exam) {
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
    this.loadingActions.set(true);
    const { id, name, type } = exam;
    if (!id) return;
    this.examsAdminService.remove(id, type).subscribe({
      next: (result) => {
        this.loadingActions.set(false);
        if (!result.success) {
          return fireGenericError(
            { name },
            `${this.labels.defArticle.toLocaleUpperCase()} ${
              this.labels.labelCapitalized
            }`,
            this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
          );
        }
        fireGenericSuccess(
          { name },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
        );
      },
      error: (err) => {
        this.loadingActions.set(false);
        fireGenericError(
          { name },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada',
          err
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
