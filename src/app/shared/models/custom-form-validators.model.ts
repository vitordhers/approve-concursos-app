import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  ValidationErrors,
  ValidatorFn,
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
        switchMap(() => {
          const timestamp = Date.now();
          return validatorService.validateCode(control.value, timestamp);
        }),
        map(({ valid }) => {
          return valid ? null : { codeTaken: true };
        }),
        first()
      );
    };
  }

  static createAtLeastTwoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return (control as FormArray).value.length > 2
        ? null
        : { atLeastTwo: true };
    };
  }
}
