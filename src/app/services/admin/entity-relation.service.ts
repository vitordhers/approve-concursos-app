import { CreateEffectOptions, Injectable, effect } from '@angular/core';
import { SubjectAdminService } from './subjects/subject.service';
import { InstitutionAdminService } from './institution/institution.service';
import { BoardAdminService } from './boards/board.service';
import { QuestionsAdminService } from './questions/questions-admin.service';
import { ExamsAdminService } from './exams/exams.service';
import { Entity } from '../../shared/enums/entity.enum';
import { BaseSubject, Subject } from '../../models/subject.model';
import { BaseInstitution, Institution } from '../../models/institution.model';
import { BaseBoard, Board } from '../../models/board.model';
import { BaseExam, Exam } from '../../models/exam.model';
import { BaseQuestion } from '../../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class EntityRelationAdminService {
  questionsRelationsCacheLoadEffect = effect(
    () => {
      const newRelations = this.questionService.loadedRelations();

      newRelations.map((relation) => {
        switch (relation.entity) {
          case Entity.SUBJECTS: {
            return this.subjectService.cacheRecords(
              relation.records as BaseSubject[]
            );
          }
          case Entity.INSTITUTIONS: {
            return this.institutionService.cacheRecords(
              relation.records as BaseInstitution[]
            );
          }
          case Entity.BOARDS: {
            return this.boardService.cacheRecords(
              relation.records as BaseBoard[]
            );
          }
          case Entity.EXAMS: {
            return this.examService.cacheRecords(
              relation.records as BaseExam[]
            );
          }
        }
      });
    },
    { allowSignalWrites: true } as CreateEffectOptions
  );

  examsRelationsCacheLoadEffect = effect(
    () => {
      const newRelations = this.examService.loadedRelations();

      newRelations.map((relation) => {
        switch (relation.entity) {
          case Entity.INSTITUTIONS: {
            return this.institutionService.cacheRecords(
              relation.records as BaseInstitution[]
            );
          }
          case Entity.BOARDS: {
            return this.boardService.cacheRecords(
              relation.records as BaseBoard[]
            );
          }
          case Entity.QUESTIONS: {
            return this.questionService.cacheRecords(
              relation.records as BaseQuestion[]
            );
          }
        }
      });
    },
    { allowSignalWrites: true } as CreateEffectOptions
  );

  constructor(
    private subjectService: SubjectAdminService,
    private institutionService: InstitutionAdminService,
    private boardService: BoardAdminService,
    private questionService: QuestionsAdminService,
    private examService: ExamsAdminService
  ) {}
}
