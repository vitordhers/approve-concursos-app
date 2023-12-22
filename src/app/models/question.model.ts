import { EducationStage } from '../shared/enums/education-stage';
import { Entity } from '../shared/enums/entity.enum';
import { BaseEntity, BaseEntityInterface } from './base-entity.model';
import { BaseBoard } from './board.model';
import { BaseExam, Exam } from './exam.model';
import { BaseInstitution, Institution } from './institution.model';
import { BaseSubject, Subject } from './subject.model';

export class Question extends BaseEntity implements BaseQuestion {
  constructor(
    id: string,
    entityId: Entity,
    public code: string,
    public prompt: string,
    public correctIndex: number,
    public subjectId: string,
    public answerExplanation: string,
    public alternatives: Alternative[],
    createdAt: number,
    updatedAt: number,
    public illustration?: string,
    public year?: number,
    public institutionId?: string,
    public boardId?: string,
    public examId?: string,
    public educationStage?: EducationStage
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}

export interface MockQuestion {
  subjectId: string;
  times: number;
  subject: Subject;
}

export interface BaseQuestion extends BaseEntityInterface {
  id: string;
  code: string;
  prompt: string;
  subjectId: string;
  answerExplanation: string;
  alternatives: Alternative[];
  correctIndex: number;
  illustration?: string;
  year?: number;
  institutionId?: string;
  boardId?: string;
  examId?: string;
  educationStage?: EducationStage;
  subject?: BaseSubject;
  institution?: BaseInstitution;
  board?: BaseBoard;
  exam?: BaseExam;
}

export interface Alternative {
  statement: string;
}
