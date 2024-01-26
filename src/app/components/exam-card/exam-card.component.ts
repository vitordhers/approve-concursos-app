import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Exam } from '../../models/exam.model';
import { CodeToColorClassPipe } from '../../shared/pipes/code-to-color-class.pipe';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleRight,
  faListCheck,
  faListOl,
  faTableList,
} from '@fortawesome/free-solid-svg-icons';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ExamType } from '../../shared/enums/exam-type.enum';
import { Institution } from '../../models/institution.model';
import { InstitutionsService } from '../../services/institutions.service';
import { ServerImgPipe } from '../../shared/pipes/server-img.pipe';
import { ModalService } from '../../services/modal.service';
import { ExamSummaryComponent } from '../exam-summary/exam-summary.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exam-card',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    FontAwesomeModule,
    CodeToColorClassPipe,
    ServerImgPipe,
  ],
  templateUrl: './exam-card.component.html',
  styleUrl: './exam-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamCardComponent implements OnInit {
  @Input()
  exam?: Exam;

  faCircleRight = faCircleRight;
  faTableList = faTableList;
  faListCheck = faListCheck;
  faListOl = faListOl;
  examType = ExamType;

  institution: WritableSignal<Institution | undefined> = signal(undefined);
  constructor(
    private institutionsService: InstitutionsService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.exam) return;
    if (this.exam.type === ExamType.MOCK || !this.exam.institutionId) return;

    this.institutionsService
      .getOne(this.exam.institutionId)
      .subscribe((institution) => {
        this.institution.set(institution);
      });
  }

  openExamSummaryModal() {
    if (!this.exam) return;
    this.modalService.openModal(ExamSummaryComponent, { exam: this.exam });
  }

  navigateToExamId(id: string) {
    this.router.navigate(['painel', 'questoes'], {
      fragment: 'resolver',
      queryParams: { prova: id },
    });
  }
}
