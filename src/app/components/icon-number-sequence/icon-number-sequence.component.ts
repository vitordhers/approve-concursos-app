import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  fa0,
  fa1,
  fa2,
  fa3,
  fa4,
  fa5,
  fa6,
  fa7,
  fa8,
  fa9,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-icon-number-sequence',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './icon-number-sequence.component.html',
  styleUrl: './icon-number-sequence.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconNumberSequenceComponent implements OnChanges {
  icons = [fa0, fa1, fa2, fa3, fa4, fa5, fa6, fa7, fa8, fa9];

  @Input() no?: number;

  numbers: WritableSignal<number[]> = signal([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['no']) return;
    const { currentValue }: { currentValue: number } = changes['no'];
    this.numbers.set(this.splitNumberIntoArray(currentValue));
  }

  splitNumberIntoArray(number: number): number[] {
    const numberString = number.toString();
    return Array.from(numberString, Number);
  }
}
