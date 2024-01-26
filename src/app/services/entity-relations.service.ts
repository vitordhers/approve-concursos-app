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
import { AnswerableQuestionsService } from './answerable-questions.service';

@Injectable({
  providedIn: 'root',
})
export class EntityRelationService {
  questionsRelationsCacheLoadEffect = effect(
    () => {
      const relationMap = this.questionService.loadedRelations();

      if (relationMap.size === 0) return;

      if (relationMap.has(Entity.SUBJECTS)) {
        this.subjectService.cacheRecords(
          relationMap.get(Entity.SUBJECTS) as BaseSubject[]
        );
      }

      if (relationMap.has(Entity.INSTITUTIONS)) {
        this.institutionService.cacheRecords(
          relationMap.get(Entity.INSTITUTIONS) as BaseInstitution[]
        );
      }

      if (relationMap.has(Entity.BOARDS)) {
        this.boardService.cacheRecords(
          relationMap.get(Entity.BOARDS) as BaseBoard[]
        );
      }

      if (relationMap.has(Entity.EXAMS)) {
        this.examService.cacheRecords(
          relationMap.get(Entity.EXAMS) as BaseExam[]
        );
      }
    },
    { allowSignalWrites: true } as CreateEffectOptions
  );

  answerableQuestionsRelationsCacheLoadEffect = effect(
    () => {
      const relationMap = this.answerableQuestionsService.loadedRelations();

      if (relationMap.size === 0) return;

      if (relationMap.has(Entity.SUBJECTS)) {
        this.subjectService.cacheRecords(
          relationMap.get(Entity.SUBJECTS) as BaseSubject[]
        );
      }

      if (relationMap.has(Entity.INSTITUTIONS)) {
        this.institutionService.cacheRecords(
          relationMap.get(Entity.INSTITUTIONS) as BaseInstitution[]
        );
      }

      if (relationMap.has(Entity.BOARDS)) {
        this.boardService.cacheRecords(
          relationMap.get(Entity.BOARDS) as BaseBoard[]
        );
      }

      if (relationMap.has(Entity.EXAMS)) {
        this.examService.cacheRecords(
          relationMap.get(Entity.EXAMS) as BaseExam[]
        );
      }
    },
    { allowSignalWrites: true } as CreateEffectOptions
  );

  examsRelationsCacheLoadEffect = effect(
    () => {
      const relationMap = this.examService.loadedRelations();

      if (relationMap.size === 0) return;

      if (relationMap.has(Entity.INSTITUTIONS)) {
        this.institutionService.cacheRecords(
          relationMap.get(Entity.INSTITUTIONS) as BaseInstitution[]
        );
      }

      if (relationMap.has(Entity.BOARDS)) {
        this.boardService.cacheRecords(
          relationMap.get(Entity.BOARDS) as BaseBoard[]
        );
      }

      if (relationMap.has(Entity.QUESTIONS)) {
        this.questionService.cacheRecords(
          relationMap.get(Entity.QUESTIONS) as BaseQuestion[]
        );
      }

      if (relationMap.has('answerable_questions')) {
        this.answerableQuestionsService.cacheRecords(
          relationMap.get('answerable_questions') as BaseQuestion[]
        );
      }

      if (relationMap.has(Entity.SUBJECTS)) {
        this.subjectService.cacheRecords(
          relationMap.get(Entity.SUBJECTS) as BaseSubject[]
        );
      }
    },
    { allowSignalWrites: true } as CreateEffectOptions
  );

  constructor(
    private subjectService: SubjectsService,
    private institutionService: InstitutionsService,
    private boardService: BoardsService,
    private questionService: QuestionsService,
    private answerableQuestionsService: AnswerableQuestionsService,
    private examService: ExamsService
  ) {}
}
