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
import {
  EMPTY,
  Subject,
  debounceTime,
  firstValueFrom,
  switchMap,
  takeUntil,
} from 'rxjs';
import { displayNameFn } from '../../shared/functions/display-fn-selectors.function';
import { Board } from '../../models/board.model';
import { BoardAdminService } from '../../services/admin/boards/board.service';
import { boardRecordLabels } from '../../shared/constants/board-record-labels.const';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-board-selector',
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
  templateUrl: './board-selector.component.html',
  styleUrl: './board-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSelectorComponent implements OnInit, OnDestroy {
  @Input() required = false;
  @Input() loadValue?: Signal<Board | string | undefined>;
  @Input() markAsTouched?: Signal<boolean>;
  @Output() selectedEmitter = new EventEmitter<Board>();
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

  private loadValueEffect = effect(async () => {
    if (!this.loadValue) return;
    let loadedValue = this.loadValue();
    if (!loadedValue) return;
    if (typeof loadedValue === 'string') {
      const loadedResult = await firstValueFrom(
        this.boardService.getOne(loadedValue)
      );
      if (!loadedResult) return;
      loadedValue = loadedResult;
    }

    this.formControl.patchValue(loadedValue, { emitEvent: false });
  });

  private clearEffect = effect(() => {
    if (!this.clear || !this.clear()) return;
    this.formControl.reset();
    this.cd.detectChanges();
  });

  formControl = new FormControl<Board | string | undefined>(undefined, {
    nonNullable: true,
  });

  labels = boardRecordLabels;

  searchedRecords$ = this.formControl.valueChanges.pipe(
    takeUntil(this.destroy$),
    debounceTime(500),
    switchMap((value) =>
      value && typeof value === 'string' && value !== ''
        ? this.boardService.search(value)
        : EMPTY
    )
  );

  constructor(
    private boardService: BoardAdminService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.required) return;
    this.formControl.setValidators([Validators.required]);
  }

  displayFn = displayNameFn;

  onOptionSelected(e: MatAutocompleteSelectedEvent) {
    this.selectedEmitter.next(e.option.value as Board);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.touchedEffect.destroy();
    this.loadValueEffect.destroy();
    this.clearEffect.destroy();
  }
}
