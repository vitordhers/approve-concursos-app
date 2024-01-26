import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { QuestionAdminService } from '../../services/admin/questions/question-admin.service';
import { Observable, first, map, switchMap, timer } from 'rxjs';
import { ExamAdminService } from '../../services/admin/exams/exam-admin.service';

export class CustomFormValidators {
  static createQuestionCodeValidator(
    validatorService: QuestionAdminService | ExamAdminService
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
