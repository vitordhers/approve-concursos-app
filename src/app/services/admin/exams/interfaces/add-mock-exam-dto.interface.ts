export interface AddMockExamDto {
  name: string;
  code: string;
  mockQuestions: {
    times: number;
    subjectId: string;
  }[];
}
