import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Output,
  ViewChild,
  signal,
  EventEmitter,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { fireToast } from '../../notification/functions/fire-toast.function';
import { UploadService } from '../../services/upload/upload.service';
import { UploadedImg } from '../../services/upload/interfaces/uploaded-img.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCloudArrowUp,
  faEraser,
  faRotateRight,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { resizeBase64Img } from './functions/resize-base64-img.function';
import { ImgUploadPreview } from './interface/img-upload-preview.interface';
import { NgOptimizedImage } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormattedResponse } from '../../shared/interfaces/formatted-response.interface';
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatProgressBarModule,
    FontAwesomeModule,
    ServerImgPipe,
  ],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploaderComponent implements OnChanges, OnDestroy {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  @Output() emitPreview = new EventEmitter<ImgUploadPreview>();

  destroy$ = new Subject<void>();
  acceptedExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
  fileMaxSizeInBytes = 26214400;
  faCloudArrowUp = faCloudArrowUp;
  faRotateRight = faRotateRight;

  loading = signal(false);
  displayProgressBar = signal(false);
  canSave = signal(true);
  progress = signal(0);
  imageHovered = signal(false);

  faEraser = faEraser;

  @Input()
  imgSrc?: string;
  @Input()
  generateThumbnail = false;

  private thumbSrc?: string;

  constructor(
    private uploadService: UploadService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes || !changes['imgSrc']) return;
    const { currentValue, previousValue } = changes['imgSrc'];
    if (previousValue || !currentValue) return;
    this.cd.detectChanges();
  }

  imageHover(hovered: boolean) {
    this.imageHovered.set(hovered);
  }

  handleFileUpload() {
    this.fileInput?.nativeElement.click();
  }

  previewImg(eventTarget: EventTarget | null) {
    if (!eventTarget) return;
    const target = eventTarget as HTMLInputElement;
    const fileList = target.files;
    if (!fileList) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      // validate file format

      if (!this.acceptedExtensions.includes(file.type)) {
        return fireToast(
          'Arquivo inválido',
          `Por favor, selecione uma imagem com extensão ${this.acceptedExtensions.join(
            ' ou '
          )}.`,
          'error'
        );
      }

      // validate file size

      if (file.size > this.fileMaxSizeInBytes) {
        return fireToast(
          'Arquivo inválido',
          `Por favor, selecione uma imagem menos de ${Math.round(
            this.fileMaxSizeInBytes / 1048576
          )} Mb.`,
          'error'
        );
      }

      // create canvas for thumbnail
      this.imgSrc = reader.result as string;
      if (this.generateThumbnail) {
        this.thumbSrc = await resizeBase64Img(
          reader.result as string,
          file.type,
          250,
          250
        );
      }
      this.cd.detectChanges();
      this.emitPreview.emit({ imgSrc: this.imgSrc, thumbSrc: this.thumbSrc });
    };
    reader.onerror = (error) => {
      console.log('Error: ', error);
    };
  }

  getPreviewedImgs() {
    return { image: this.imgSrc, thumbnail: this.thumbSrc };
  }

  clearImg() {
    this.imgSrc = undefined;
    this.cd.detectChanges();
  }

  async upload() {
    if (!this.imgSrc || this.imgSrc.includes('uploads/')) return;
    const imgPreviewData: ImgUploadPreview = {
      imgSrc: this.imgSrc,
      thumbSrc: this.thumbSrc,
    };
    const result = await this.uploadImage(imgPreviewData);

    return result;
  }

  async uploadImage(imgPreviewData: ImgUploadPreview) {
    this.loading.set(true);
    return new Promise<UploadedImg>((resolve, reject) => {
      this.uploadService
        .uploadImageAndThumbnail(imgPreviewData)
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: HttpEvent<FormattedResponse<UploadedImg>>) => {
          this.loading.set(true);

          switch (event.type) {
            case HttpEventType.Sent:
              this.canSave.set(false);
              this.displayProgressBar.set(true);
              break;
            case HttpEventType.UploadProgress:
              this.canSave.set(false);
              this.progress.set(
                Math.round((event.loaded / (event.total as number)) * 100)
              );
              break;
            case HttpEventType.Response:
              this.loading.set(true);
              this.canSave.set(true);
              this.displayProgressBar.set(false);
              if (
                !event ||
                !event.body ||
                !event.body.success ||
                !event.body.data
              ) {
                fireToast('Erro no upload', 'Favor comunicar', 'error');
                reject();
                break;
              }

              fireToast(
                'Imagem enviada com sucesso',
                'Não esqueça de salvar para atualizar a imagem',
                'success'
              );

              resolve(event.body.data);
              setTimeout(() => {
                this.progress.set(0);
                this.displayProgressBar.set(false);
              }, 300);
              break;
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
