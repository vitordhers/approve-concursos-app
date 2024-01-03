import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Signal,
  SimpleChanges,
  effect,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import {
  EMPTY,
  Subject,
  debounceTime,
  firstValueFrom,
  switchMap,
  takeUntil,
} from 'rxjs';
import { displayCodeFn } from '../../shared/functions/display-fn-selectors.function';
import { Exam } from '../../models/exam.model';
import { assessmentExamRecordLabels } from '../../shared/constants/assessment-exam-labels.const';
import { ExamsAdminService } from '../../services/admin/exams/exams.service';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-exam-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatCardModule,
    FontAwesomeModule,
    ServerImgPipe,
  ],
  templateUrl: './exam-selector.component.html',
  styleUrl: './exam-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamSelectorComponent implements OnInit, OnDestroy {
  @Input() required = false;
  @Input() disabled = false;
  @Input() loadValue?: Exam | string;
  @Input() markAsTouched?: Signal<boolean>;
  @Output() selectedEmitter = new EventEmitter<Exam>();
  @Input() clear?: Signal<boolean>;

  private destroy$ = new Subject<void>();

  private touchedEffect = effect(() => {
    if (this.markAsTouched && this.markAsTouched()) {
      this.formControl.markAsTouched();
    } else {
      this.formControl.markAsUntouched();
    }
    this.cd.detectChanges();
  });

  private clearEffect = effect(() => {
    if (!this.clear || !this.clear()) return;
    this.formControl.reset();
    this.cd.detectChanges();
  });

  formControl = new FormControl<Exam | string | undefined>(undefined, {
    nonNullable: true,
  });

  labels = assessmentExamRecordLabels;

  faBarcode = faBarcode;

  searchedRecords$ = this.formControl.valueChanges.pipe(
    takeUntil(this.destroy$),
    debounceTime(500),
    switchMap((value) =>
      value && typeof value === 'string' && value !== ''
        ? this.examService.search(value)
        : EMPTY
    )
  );

  constructor(
    private examService: ExamsAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.disabled) {
      this.formControl.disable();
    }
    if (!this.required) return;
    this.formControl.setValidators([Validators.required]);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes['loadValue']) return;
    let loadedValue = changes['loadValue'].currentValue;
    if (!loadedValue) return;
    console.log('@@@@@@@@@@@@@@@@@', loadedValue);
    if (typeof loadedValue !== 'string') return;
    const loadedResult = await firstValueFrom(
      this.examService.getOne(loadedValue)
    );
    if (!loadedResult) return;
    loadedValue = loadedResult;

    this.formControl.patchValue(loadedValue, { emitEvent: false });
  }

  displayFn = displayCodeFn;

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    this.selectedEmitter.next(e.option.value as Exam);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.touchedEffect.destroy();
    this.clearEffect.destroy();
  }
}
