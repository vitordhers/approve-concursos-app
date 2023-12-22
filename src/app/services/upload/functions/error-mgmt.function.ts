import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export const errorMgmt = (error: HttpErrorResponse) => {
  let errorMessage = '';
  if (error.error instanceof ErrorEvent) {
    // Get client-side error
    errorMessage = error.error.message;
  } else {
    // Get server-side error
    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
  }
  console.log(errorMessage);
  return throwError(() => new Error(errorMessage));
};
