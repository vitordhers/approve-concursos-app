import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function matchPasswordsValidator(
  controlName: string,
  matchingControlName: string
): ValidatorFn {
  return (formControl: AbstractControl): ValidationErrors | null => {
    const formGroup = formControl.parent as FormGroup;
    if (!formGroup) return null;
    const passwordControl = formGroup.get(controlName);
    const confirmControl = formGroup.get(matchingControlName);

    if (!passwordControl || !confirmControl) {
      return null;
    }

    const passwordValue = passwordControl.value;
    const confirmValue = confirmControl.value;

    if (passwordValue !== confirmValue) {
      return { matchPasswords: true };
    }

    return null;
  };
}
