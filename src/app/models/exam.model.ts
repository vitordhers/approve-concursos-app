import { Entity } from '../shared/enums/entity.enum';
import { ExamType } from '../shared/enums/exam-type.enum';
import { BaseEntity, BaseEntityInterface } from './base-entity.model';
import { BaseBoard } from './board.model';
import { BaseInstitution } from './institution.model';
import { BaseQuestion } from './question.model';

export class Exam extends BaseEntity {
  constructor(
    id: string,
    entityId: Entity,
    updatedAt: number,
    createdAt: number,
    public code: string,
    public name: string,
    public type: ExamType,
    public questionsIds: string[],
    public year?: number,
    public boardId?: string,
    public institutionId?: string
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}

export interface BaseExam extends BaseEntityInterface {
  id: string;
  entityId: Entity;
  createdAt: number;
  updatedAt: number;
  code: string;
  name: string;
  type: ExamType;
  questionsIds: string[];
  year?: number;
  boardId?: string;
  institutionId?: string;
  institution?: BaseInstitution;
  board?: BaseBoard;
  questions?: BaseQuestion[];
  answerableQuestions?: BaseQuestion[];
}
