import { Directive, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[formControlName][appCpf]',
  standalone: true,
})
export class CpfDirective implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  constructor(public ngControl: NgControl) {}

  ngOnInit(): void {
    this.ngControl.valueChanges
      ?.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onInputChange(value);
      });
  }

  onInputChange(value: string) {
    let newVal = value.replace(/\D/g, '');

    if (newVal.length === 0) {
      newVal = '';
    } else if (newVal.length <= 3) {
      newVal = newVal.replace(/^(\d{0,3})/, '$1');
    } else if (newVal.length <= 4) {
      newVal = newVal.replace(/^(\d{0,3})/, '$1.');
    } else if (newVal.length <= 6) {
      newVal = newVal.replace(/^(\d{0,3})(\d{0,3})/, '$1.$2');
    } else if (newVal.length <= 7) {
      newVal = newVal.replace(/^(\d{0,3})(\d{0,3})/, '$1.$2.');
    } else if (newVal.length <= 9) {
      newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})/, '$1.$2.$3');
    } else {
      newVal = newVal.substring(0, 11);
      newVal = newVal.replace(
        /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/,
        '$1.$2.$3-$4'
      );
    }
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
