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
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import {
  EMPTY,
  Subject as RxJsSubject,
  debounceTime,
  firstValueFrom,
  switchMap,
  takeUntil,
} from 'rxjs';
import { displayNameFn } from '../../shared/functions/display-fn-selectors.function';
import { Subject } from '../../models/subject.model';
import { subjectRecordLabels } from '../../shared/constants/subject-record-labels.const';
import { SubjectAdminService } from '../../services/admin/subjects/subject.service';

@Component({
  selector: 'app-subject-selector',
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
  templateUrl: './subject-selector.component.html',
  styleUrl: './subject-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectSelectorComponent implements OnInit, OnDestroy {
  @Input() required = false;
  @Input() loadValue?: Signal<Subject | string | undefined>;
  @Input() markAsTouched?: Signal<boolean>;
  @Output() selectedEmitter = new EventEmitter<Subject>();

  private destroy$ = new RxJsSubject<void>();

  private touchedEffect = effect(() => {
    if (this.markAsTouched && this.markAsTouched()) {
      this.formControl.markAsTouched();
    } else {
      this.formControl.markAsUntouched();
    }
    this.cd.detectChanges();
  });

  private loadValueEffect = effect(async () => {
    if (!this.loadValue) return;
    let loadedValue = this.loadValue();
    if (!loadedValue) return;
    if (typeof loadedValue === 'string') {
      const loadedResult = await firstValueFrom(
        this.subjectService.getOne(loadedValue)
      );
      if (!loadedResult) return;
      loadedValue = loadedResult;
    }

    this.formControl.patchValue(loadedValue, { emitEvent: false });
  });

  formControl = new FormControl<Subject | string | undefined>(undefined, {
    nonNullable: true,
  });

  labels = subjectRecordLabels;

  searchedRecords$ = this.formControl.valueChanges.pipe(
    takeUntil(this.destroy$),
    debounceTime(500),
    switchMap((value) =>
      value && typeof value === 'string' && value !== ''
        ? this.subjectService.search(value)
        : EMPTY
    )
  );

  constructor(
    private subjectService: SubjectAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.required) return;
    this.formControl.setValidators([Validators.required]);
  }

  displayFn = displayNameFn;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.touchedEffect.destroy();
    this.loadValueEffect.destroy();
  }

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    this.selectedEmitter.next(e.option.value as Subject);
  }
}
