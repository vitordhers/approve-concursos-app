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
import { CommonModule, registerLocaleData } from '@angular/common';
import { EMPTY, Subject, from, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  faFont,
  faFingerprint,
  faArrowLeft,
  faSave,
  faTrash,
  faClock,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FileUploaderComponent } from '../../../../../../components/file-uploader/file-uploader.component';
import { fireToast } from '../../../../../../notification/functions/fire-toast.function';
import { ImgUploadPreview } from '../../../../../../components/file-uploader/interface/img-upload-preview.interface';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import Swal from 'sweetalert2';
import localePtBr from '@angular/common/locales/pt';
import { Board } from '../../../../../../models/board.model';
import { BoardAdminService } from '../../../../../../services/admin/boards/board-admin.service';
import { AddBoardDto } from '../../../../../../services/admin/boards/interfaces/add-board-dto.interface';
import { EditBoardDto } from '../../../../../../services/admin/boards/interfaces/edit-board-dto.interface';
import { boardRecordLabels } from '../../../../../../shared/constants/board-record-labels.const';

registerLocaleData(localePtBr);
@Component({
  selector: 'board-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    FileUploaderComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './add-edit.component.html',
  styleUrl: './add-edit.component.sass',
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

  labels = boardRecordLabels;

  loading = signal(false);

  @ViewChild(FileUploaderComponent)
  fileUploaderComponent?: FileUploaderComponent;

  private destroy$ = new Subject<void>();

  form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
    }),
    img: new FormControl<string | undefined>(undefined, { nonNullable: true }),
    thumb: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
  });

  updatedBoard: WritableSignal<Board | undefined> = signal(undefined);
  isEdit = computed(() => !!this.updatedBoard());

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private boardsService: BoardAdminService
  ) {}

  patchPreview(imgPreview: ImgUploadPreview) {
    this.form.controls['img'].patchValue(imgPreview.imgSrc);
    this.form.controls['thumb'].patchValue(imgPreview.thumbSrc);
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
          return this.boardsService.getOne(id);
        })
      )
      .subscribe({
        next: (board) => {
          this.loading.set(false);
          this.updatedBoard.set(board);
          if (!board) return;
          this.form.controls['name'].patchValue(board.name);
          this.form.controls['img'].patchValue(board.img);
          this.form.controls['thumb'].patchValue(board.thumb);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  save() {
    if (!this.fileUploaderComponent) return;

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return fireToast('Erro', 'ajuste seu formulário', 'error');
    }
    const { name } = this.form.getRawValue();

    return from(this.fileUploaderComponent.upload())
      .pipe(
        switchMap((uploadedImg) => {
          let img: string | undefined;
          let thumb: string | undefined;
          if (uploadedImg) {
            const { img: image, thumb: thumbnail } = uploadedImg;
            img = image;
            thumb = thumbnail;
          }

          const updatedBoard = this.updatedBoard();
          if (!updatedBoard) {
            const addBoardDto: AddBoardDto = {
              name,
              img,
              thumb,
            };
            return this.boardsService.add(addBoardDto);
          }
          const editBoardDto: EditBoardDto = {
            name,
            img,
            thumb,
          };

          return this.boardsService.edit(updatedBoard.id, editBoardDto);
        })
      )
      .subscribe({
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
    const updatedInstituition = this.updatedBoard();
    if (!this.isEdit || !updatedInstituition) return;
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
    const { id, name } = updatedInstituition;
    if (!id) return;
    this.boardsService.remove(id).subscribe({
      next: (result) => {
        this.loading.set(false);
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
        this.navigateToList();
      },
      error: (err) => {
        this.loading.set(false);
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

  navigateToList() {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
