import { Alternative, BaseQuestion } from '../../../../models/question.model';
import { EducationStage } from '../../../../shared/enums/education-stage';

export interface EditQuestionDto {
  prompt: string;
  correctIndex: number;
  subjectId: string;
  answerExplanation: string;
  alternatives: Alternative[];
  illustration?: string;
  year?: number;
  institutionId?: string;
  boardId?: string;
  examId?: string;
  educationStage?: EducationStage;
}
