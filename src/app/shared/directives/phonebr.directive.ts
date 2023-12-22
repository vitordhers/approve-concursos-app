import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[formControlName][appPhoneBr]',
  standalone: true,
})
export class PhoneBrDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() appPhoneBr = false;
  @Input() phoneType!: 'celphone' | 'telephone';
  constructor(public ngControl: NgControl) {}

  ngOnInit(): void {
    this.ngControl.valueChanges
      ?.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onInputChange(value);
      });
  }

  onInputChange(value: string) {
    if (!value || !this.ngControl.valueAccessor) return;

    let newVal = value.replace(/\D/g, '');

    if (newVal.length === 0) {
      newVal = '';
    } else if (newVal.length <= 2) {
      newVal = newVal.replace(/^(\d{0,2})/, '($1');
    } else if (newVal.length <= 3) {
      newVal = newVal.replace(/^(\d{0,2})/, '($1) ');
    } else if (newVal.length <= 4 && this.phoneType === 'celphone') {
      newVal = newVal.replace(/^(\d{0,2})(\d{0,1})/, '($1) $2 ');
    } else if (newVal.length <= 6 && this.phoneType === 'telephone') {
      newVal = newVal.replace(/^(\d{0,2})(\d{0,4})/, '($1) $2');
    } else if (newVal.length <= 7 && this.phoneType === 'celphone') {
      newVal = newVal.replace(/^(\d{0,2})(\d{0,1})(\d{0,4})/, '($1) $2 $3');
    } else if (newVal.length <= 10 && this.phoneType === 'telephone') {
      newVal = newVal.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
    } else {
      newVal = newVal.substring(0, 11);
      newVal = newVal.replace(
        /^(\d{0,2})(\d{0,1})(\d{0,4})(\d{0,4})/,
        '($1) $2 $3-$4'
      );
    }
    this.ngControl.valueAccessor.writeValue(newVal);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
