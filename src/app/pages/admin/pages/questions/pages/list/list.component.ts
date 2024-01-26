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
  Subject as RxJsSubject,
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
  faFilter,
  faMagnifyingGlass,
  faBarcode,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import Swal from 'sweetalert2';
import { DEFAULT_PAGINATION_SIZE } from '../../../../../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../../../../../shared/constants/pagination-sizes.const';
import { MatPaginatorIntlPtBr } from '../../../../../../shared/config/pagination-intl.model';
import { Institution } from '../../../../../../models/institution.model';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import { ServerImgPipe } from '../../../../../../shared/pipes/server-img.pipe';
import { QuestionAdminService } from '../../../../../../services/admin/questions/question-admin.service';
import { Question } from '../../../../../../models/question.model';
import { Subject } from '../../../../../../models/subject.model';
import { Board } from '../../../../../../models/board.model';
import { Exam } from '../../../../../../models/exam.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ModalService } from '../../../../../../services/modal.service';
import { FilterComponent } from '../../components/filter/filter.component';
import { questionRecordLabels } from '../../../../../../shared/constants/question-record-labels.const';

registerLocaleData(localePtBr);

@Component({
  selector: 'question-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    FontAwesomeModule,
    FilterComponent,
    ServerImgPipe,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPtBr },
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit, OnDestroy {
  faAdd = faAdd;
  faFingerprint = faFingerprint;
  faClock = faClock;
  faBarcode = faBarcode;
  faBars = faBars;
  faTrash = faTrash;
  faPenToSquare = faPenToSquare;
  faFilter = faFilter;
  faMagnifyingGlass = faMagnifyingGlass;

  loadingData = signal(true);
  loadingActions = signal(false);

  labels = questionRecordLabels;

  private destroy$ = new RxJsSubject<void>();
  private currentPage$ = new BehaviorSubject({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });
  currentPageSize = DEFAULT_PAGINATION_SIZE;

  pageSizeOptions = PAGINATION_SIZES;
  displayedColumns: (keyof (Question & {
    actions: string;
    subject?: Subject;
    institution?: Institution;
    board?: Board;
    exam?: Exam;
  }))[] = ['id', 'code', 'updatedAt', 'actions'];

  searchControl = new FormControl<string | undefined>(undefined, {
    nonNullable: true,
  });

  private loadedQuestions$ = this.currentPage$.pipe(
    distinctUntilChanged(
      (prev, curr) =>
        prev?.start === curr?.start &&
        prev?.end === curr?.end &&
        prev?.pageSize === curr?.pageSize
    ),
    takeUntil(this.destroy$),
    switchMap(({ start, end, pageSize }) =>
      this.questionAdminService.paginate(start, end, pageSize)
    )
  );
  loadedQuestions = toSignal(this.loadedQuestions$);

  constructor(
    public questionAdminService: QuestionAdminService,
    private activatedRoute: ActivatedRoute,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
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

  search() {}

  showFilters() {
    this.modalService
      .openModal(FilterComponent, undefined)
      .subscribe((result) => {});
  }

  navigateToAdd() {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'criar']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar', id]);
  }

  async remove(question: Question) {
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
    const { id, code } = question;
    if (!id) return;
    this.questionAdminService.remove(id).subscribe({
      next: (result) => {
        this.loadingActions.set(false);
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
      },
      error: (err) => {
        this.loadingActions.set(false);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
