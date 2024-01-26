import { BaseQuestion, Question } from '../../models/question.model';

export interface Answer {
  id: string;
  answeredAlternativeIndex: number;
  at: number;
  question: Question;
}

export interface AnswerPayload {
  id: string;
  answeredAlternativeIndex: number;
  at: number;
  question: BaseQuestion;
}
