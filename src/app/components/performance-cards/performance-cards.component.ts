import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartColumn,
  faCircleRight,
  faPenToSquare,
  faSquareCheck,
  faSquareXmark,
} from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-performance-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, FontAwesomeModule],
  templateUrl: './performance-cards.component.html',
  styleUrl: './performance-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceCardsComponent implements OnInit {
  faPenToSquare = faPenToSquare;
  faCircleRight = faCircleRight;
  faSquareCheck = faSquareCheck;
  faSquareXmark = faSquareXmark;
  faChartColumn = faChartColumn;

  countTotal: WritableSignal<number | undefined> = signal(undefined);
  correctTotal: WritableSignal<number | undefined> = signal(undefined);
  wrongTotal: WritableSignal<number | undefined> = signal(undefined);
  overallPerformance: WritableSignal<number | undefined> = signal(undefined);

  isPaidUser = computed(() => this.userService.isPaidUser());

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getOverallPerformance$().subscribe((result) => {
      if (!result) {
        return;
      }
      const { count, correct } = result;
      const { total: countTotal } = count;
      const { total: correctTotal } = correct;

      const wrongTotal = countTotal - correctTotal;
      const overallPerformance = correctTotal / countTotal;

      this.countTotal.set(countTotal);
      this.correctTotal.set(correctTotal);
      this.wrongTotal.set(wrongTotal);
      this.overallPerformance.set(overallPerformance);
    });
  }
}
