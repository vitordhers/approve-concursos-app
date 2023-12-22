export interface EditAssessmentExamDto {
  name: string;
  questionsIds: string[];
  year?: number;
  institutionId?: string;
  boardId?: string;
}
