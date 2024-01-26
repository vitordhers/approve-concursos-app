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
import { EMPTY, Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { displayCodeFn } from '../../shared/functions/display-fn-selectors.function';
import { BaseQuestion, Question } from '../../models/question.model';
import { QuestionAdminService } from '../../services/admin/questions/question-admin.service';
import { questionRecordLabels } from '../../shared/constants/question-record-labels.const';
import { faBarcode, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { IconNumberSequenceComponent } from '../icon-number-sequence/icon-number-sequence.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuestionsService } from '../../services/questions.service';

@Component({
  selector: 'app-question-selector',
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
    MatTooltipModule,
    FontAwesomeModule,
    IconNumberSequenceComponent,
  ],
  templateUrl: './question-selector.component.html',
  styleUrl: './question-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionSelectorComponent implements OnInit, OnDestroy {
  faBarcode = faBarcode;
  faHashtag = faHashtag;
  @Input() required = false;
  @Input() initialRecord?: Question | BaseQuestion;
  @Input() markAsTouched?: Signal<boolean>;
  @Output() selectedEmitter = new EventEmitter<Question>();
  @Input() prefix?: number;
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

  formControl = new FormControl<Question | BaseQuestion | string | undefined>(
    undefined,
    {
      nonNullable: true,
    }
  );

  labels = questionRecordLabels;

  searchedRecords$ = this.formControl.valueChanges.pipe(
    takeUntil(this.destroy$),
    debounceTime(500),
    switchMap((value) =>
      value && typeof value === 'string' && value !== ''
        ? this.questionAdminService.searchByCode(value)
        : EMPTY
    )
  );

  constructor(
    private questionAdminService: QuestionAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.initialRecord) {
      this.formControl.patchValue(this.initialRecord);
    }
    if (!this.required) return;
    this.formControl.setValidators([Validators.required]);
  }

  displayFn = displayCodeFn;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
    this.touchedEffect.destroy();
    this.clearEffect.destroy();
  }

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    this.selectedEmitter.next(e.option.value as Question);
  }
}
