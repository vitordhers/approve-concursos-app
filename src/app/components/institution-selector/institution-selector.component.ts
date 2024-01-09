import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
import { Institution } from '../../models/institution.model';
import {
  EMPTY,
  Subject,
  debounceTime,
  firstValueFrom,
  switchMap,
  takeUntil,
} from 'rxjs';
import { displayNameFn } from '../../shared/functions/display-fn-selectors.function';
import { institutionRecordLabels } from '../../shared/constants/institution-labels.const';
import { InstitutionsService } from '../../services/institutions.service';

@Component({
  selector: 'app-institution-selector',
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
  templateUrl: './institution-selector.component.html',
  styleUrl: './institution-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionSelectorComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() required = false;
  @Input() disabled = false;
  @Input() loadValue?: Institution | string;

  @Input() markAsTouched?: Signal<boolean>;
  @Output() selectedEmitter = new EventEmitter<Institution>();

  private destroy$ = new Subject<void>();
  private touchedEffect = effect(() => {
    if (this.markAsTouched && this.markAsTouched()) {
      this.formControl.markAsTouched();
    } else {
      this.formControl.markAsUntouched();
    }
    this.cd.detectChanges();
  });

  formControl = new FormControl<Institution | string | undefined>(undefined, {
    nonNullable: true,
  });

  labels = institutionRecordLabels;

  searchedRecords$ = this.formControl.valueChanges.pipe(
    takeUntil(this.destroy$),
    debounceTime(500),
    switchMap((value) =>
      value && typeof value === 'string' && value !== ''
        ? this.institutionService.search(value)
        : EMPTY
    )
  );

  constructor(
    private institutionService: InstitutionsService,
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
    if (typeof loadedValue !== 'string') return;
    const loadedResult = await firstValueFrom(
      this.institutionService.getOne(loadedValue)
    );
    if (!loadedResult) return;
    loadedValue = loadedResult;

    this.formControl.patchValue(loadedValue, { emitEvent: false });
  }

  displayFn = displayNameFn;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.touchedEffect.destroy();
  }

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    this.selectedEmitter.next(e.option.value as Institution);
  }
}
