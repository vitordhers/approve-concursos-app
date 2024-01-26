import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartSimple,
  faListCheck,
  faListOl,
} from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PerformanceCardsComponent } from '../../components/performance-cards/performance-cards.component';
import { ExamListComponent } from '../../components/exam-list/exam-list.component';
import { ExamType } from '../../shared/enums/exam-type.enum';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    FontAwesomeModule,
    PerformanceCardsComponent,
    ExamListComponent,
  ],
  templateUrl: './study.component.html',
  styleUrl: './study.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  faChartSimple = faChartSimple;
  faListCheck = faListCheck;
  faListOl = faListOl;
  examType = ExamType;

  currentFragment: WritableSignal<string | undefined> = signal(undefined);
  currentIndex: WritableSignal<number | undefined> = signal(undefined);

  changeTabOnFragmentChangedEffect = effect(
    () => {
      let index: number;

      switch (this.currentFragment()) {
        case 'desempenho':
          index = 0;
          break;
        case 'simulados':
          index = 1;
          break;
        case 'provas':
          index = 2;
          break;
        default:
          index = 0;
          break;
      }

      this.currentIndex.set(index);
    },
    { allowSignalWrites: true }
  );

  isPaidUser = computed(() => this.userService.isPaidUser());

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.fragment
      .pipe(takeUntil(this.destroy$))
      .subscribe((fragment) => {
        if (!fragment) return;

        this.currentFragment.set(fragment);
      });
  }

  tabChanged(index: number) {
    let fragment: string;
    switch (index) {
      case 0:
        fragment = 'desempenho';
        break;
      case 1:
        fragment = 'simulados';
        break;
      case 2:
        fragment = 'provas';
        break;

      default:
        fragment = 'desempenho';
        break;
    }

    this.router.navigate([], { fragment });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
    this.changeTabOnFragmentChangedEffect.destroy();
  }
}
