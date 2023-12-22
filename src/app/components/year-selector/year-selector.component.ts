import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import moment, { Moment } from 'moment';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { DATE_FORMATS } from '../../shared/constants/date-formats.const';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerModule,
} from '@angular/material/datepicker';

@Component({
  selector: 'app-year-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
  ],
  templateUrl: './year-selector.component.html',
  styleUrl: './year-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearSelectorComponent implements OnInit, OnDestroy {
  maxYear = new Date();

  @Input() year?: number;
  @Output() selectedEmitter = new EventEmitter<number>();

  control = new FormControl<Moment | undefined>(undefined, {
    nonNullable: true,
  });

  @ViewChild(MatDatepicker)
  private datePicker?: MatDatepicker<Date>;
  private destroy$ = new Subject<void>();
  constructor() {}

  ngOnInit(): void {
    if (this.year) {
      const date = new Date(this.year, 0, 1);
      const momentDate = moment(date);
      this.control.patchValue(momentDate);
    }

    this.control.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((date) => {
        if (date && String(date?.year()).length === 4) {
          this.selectedEmitter.emit(date.year());
        }
      });
  }

  onYearSelected(event: string) {
    if (!this.datePicker) return;
    const date = new Date(event);
    const momentDate = moment(date);
    this.control.patchValue(momentDate);
    this.datePicker.close();
    this.selectedEmitter.emit(momentDate.year());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
