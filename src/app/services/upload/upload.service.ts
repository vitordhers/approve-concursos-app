import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  EMPTY,
  Observable,
  catchError,
  combineLatest,
  from,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { UploadedImg } from './interfaces/uploaded-img.interface';
import { errorMgmt } from './functions/error-mgmt.function';
import { ImgUploadPreview } from '../../components/file-uploader/interface/img-upload-preview.interface';
import { FormattedResponse } from '../../shared/interfaces/formatted-response.interface';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private endpoint = `${environment.apiUrl}/uploads`;
  constructor(private http: HttpClient) {}

  uploadImageAndThumbnail(
    imgPreviewData: ImgUploadPreview,
    subfolder: string
  ): Observable<HttpEvent<FormattedResponse<UploadedImg>>> {
    return this.ImgPreviewToBlob(imgPreviewData)
      .pipe(
        switchMap(([imageBlob, thumbnailBlob]) => {
          const formData = new FormData();
          if (!imageBlob && !thumbnailBlob) return EMPTY;

          formData.append('subfolder', subfolder);

          if (imageBlob) {
            formData.append('image', imageBlob);
          }

          if (thumbnailBlob) {
            formData.append('thumbnail', thumbnailBlob);
          }
          return this.http.post<FormattedResponse<UploadedImg>>(
            this.endpoint,
            formData,
            {
              reportProgress: true,
              observe: 'events',
            }
          );
        })
      )

      .pipe(catchError(errorMgmt));
  }

  ImgPreviewToBlob({ imgSrc, thumbSrc }: ImgUploadPreview) {
    const imageBlob$ = imgSrc
      ? from(from(fetch(imgSrc)).pipe(switchMap((r) => from(r.blob()))))
      : of(undefined);
    const thumbnailBlob$ = thumbSrc
      ? from(from(fetch(thumbSrc)).pipe(switchMap((r) => from(r.blob()))))
      : of(undefined);

    return combineLatest([imageBlob$, thumbnailBlob$]);
  }
}
