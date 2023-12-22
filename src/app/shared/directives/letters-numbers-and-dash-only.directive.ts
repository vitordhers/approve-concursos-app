import { Directive, OnDestroy, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[formControlName][appLettersNumbersAndDashOnly]',
  standalone: true,
})
export class LettersNumbersAndDashOnlyDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(public ngControl: NgControl) {}

  ngOnInit(): void {
    this.ngControl.valueChanges
      ?.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onInputChange(value);
      });
  }

  onInputChange(value: string) {
    let newVal = value.replace(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/? ]*$/g, '');
    if (this.ngControl && this.ngControl.valueAccessor) {
      this.ngControl.valueAccessor.writeValue(newVal);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
