import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamsService } from '../../services/exams.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Exam } from '../../models/exam.model';
import { assessmentExamRecordLabels } from '../../shared/constants/assessment-exam-labels.const';
import { ExamType } from '../../shared/enums/exam-type.enum';
import { mockExamRecordLabels } from '../../shared/constants/mock-exam-labels.const';
import { cloneDeep } from 'lodash';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-exam-summary',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, FontAwesomeModule],
  templateUrl: './exam-summary.component.html',
  styleUrl: './exam-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamSummaryComponent implements OnInit {
  constructor(
    private examsService: ExamsService,
    @Inject(DIALOG_DATA) public data: DialogData,
    private dialogRef: DialogRef<undefined, ExamSummaryComponent>
  ) {}

  faTimes = faTimes;

  labels = assessmentExamRecordLabels;

  displayedColumns: string[] = ['name', 'total'];

  subjectRelations: WritableSignal<SubjectRelation[]> = signal([]);

  ngOnInit(): void {
    if (this.data.exam.type === ExamType.MOCK) {
      this.labels = mockExamRecordLabels;
    }

    this.examsService.getSummary(this.data.exam.id).subscribe((response) => {
      if (!response || !response.questions || !response.questions.length)
        return;
      const subjectRelations: SubjectRelation[] = [];
      response.questions.forEach((q) => {
        if (!q.subject) return;
        const subjectRelation: SubjectRelation = {
          name: (q.subject as any)[0].name,
          total: (q as any).total,
        };
        subjectRelations.push(subjectRelation);
      });

      this.subjectRelations.set(cloneDeep(subjectRelations));
    });
  }

  dismiss() {
    this.dialogRef.close();
  }
}

interface SubjectRelation {
  total: number;
  name: string;
}

interface DialogData {
  exam: Exam;
}
