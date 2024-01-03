import { Alternative } from '../../../../models/question.model';
import { EducationStage } from '../../../../shared/enums/education-stage';

export interface AddQuestionDto {
  code: string;
  prompt: string;
  correctIndex: number;
  subjectId: string;
  alternatives: Alternative[];
  answerExplanation?: string;
  illustration?: string;
  year?: number;
  institutionId?: string;
  boardId?: string;
  examId?: string;
  educationStage?: EducationStage;
}
