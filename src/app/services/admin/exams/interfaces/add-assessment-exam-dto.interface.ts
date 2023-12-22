export interface AddAssessmentExamDto {
  name: string;
  code: string;
  questionsIds: string[];
  year?: number;
  institutionId?: string;
  boardId?: string;
}
