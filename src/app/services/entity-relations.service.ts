import { CreateEffectOptions, Injectable, effect } from '@angular/core';
import { BaseBoard } from '../models/board.model';
import { BaseExam } from '../models/exam.model';
import { BaseInstitution } from '../models/institution.model';
import { BaseQuestion } from '../models/question.model';
import { BaseSubject } from '../models/subject.model';
import { Entity } from '../shared/enums/entity.enum';
import { ExamsService } from './exams.service';
import { SubjectsService } from './subjects.service';
import { InstitutionsService } from './institutions.service';
import { BoardsService } from './boards.service';
import { QuestionsService } from './questions.service';
import { cloneDeep } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class EntityRelationService {
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

      // const relationMap = new Map<Entity, (BaseInstitution | BaseBoard | BaseQuestion)[]>();

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
    private subjectService: SubjectsService,
    private institutionService: InstitutionsService,
    private boardService: BoardsService,
    private questionService: QuestionsService,
    private examService: ExamsService
  ) {}
}
