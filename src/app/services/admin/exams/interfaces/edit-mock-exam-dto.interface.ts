export interface EditMockExamDto {
  name: string;
  mockQuestions: {
    times: number;
    subjectId: string;
  }[];
}
