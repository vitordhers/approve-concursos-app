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
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  faAdd,
  faFingerprint,
  faClock,
  faFont,
  faBars,
  faPenToSquare,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import localePtBr from '@angular/common/locales/pt';
import Swal from 'sweetalert2';
import { DEFAULT_PAGINATION_SIZE } from '../../../../../../shared/config/default-pagination-size.const';
import { PAGINATION_SIZES } from '../../../../../../shared/constants/pagination-sizes.const';
import { MatPaginatorIntlPtBr } from '../../../../../../shared/config/pagination-intl.model';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import { BoardAdminService } from '../../../../../../services/admin/boards/board-admin.service';
import { Board } from '../../../../../../models/board.model';
import { ServerImgPipe } from '../../../../../../shared/pipes/server-img.pipe';
import { boardRecordLabels } from '../../../../../../shared/constants/board-record-labels.const';

registerLocaleData(localePtBr);

@Component({
  selector: 'board-list',
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
  loadingData = signal(true);
  loadingActions = signal(false);

  labels = boardRecordLabels;

  private destroy$ = new Subject<void>();
  private currentPage$ = new BehaviorSubject({
    start: 0,
    end: DEFAULT_PAGINATION_SIZE,
    pageSize: DEFAULT_PAGINATION_SIZE,
  });
  currentPageSize = DEFAULT_PAGINATION_SIZE;
  // private paginationSize$ = new BehaviorSubject(DEFAULT_PAGINATION_SIZE);
  // paginationSize = toSignal(this.paginationSize$);

  pageSizeOptions = PAGINATION_SIZES;
  displayedColumns: string[] = ['thumb', 'id', 'name', 'updatedAt', 'actions'];

  private loadedBoards$ = this.currentPage$.pipe(
    distinctUntilChanged(
      (prev, curr) =>
        prev?.start === curr?.start &&
        prev?.end === curr?.end &&
        prev?.pageSize === curr?.pageSize
    ),
    takeUntil(this.destroy$),
    switchMap(({ start, end, pageSize }) =>
      this.boardAdminService.paginate(start, end, pageSize)
    )
  );
  loadedBoards = toSignal(this.loadedBoards$);

  constructor(
    public boardAdminService: BoardAdminService,
    private activatedRoute: ActivatedRoute,
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

  navigateToAdd() {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'criar']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar', id]);
  }

  async remove(board: Board) {
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
    const { id, name } = board;
    if (!id) return;
    this.boardAdminService.remove(id).subscribe({
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
