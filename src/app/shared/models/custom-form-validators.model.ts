import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { QuestionsAdminService } from '../../services/admin/questions/questions-admin.service';
import { Observable, first, map, switchMap, timer } from 'rxjs';
import { ExamsAdminService } from '../../services/admin/exams/exams.service';

export class CustomFormValidators {
  static createQuestionCodeValidator(
    validatorService: QuestionsAdminService | ExamsAdminService
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return timer(1000).pipe(
        switchMap(() => validatorService.validateCode(control.value)),
        map(({ valid }) => {
          return valid ? null : { codeTaken: true };
        }),
        first()
      );
    };
  }
}
