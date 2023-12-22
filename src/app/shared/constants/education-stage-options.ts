import { EducationStage } from '../enums/education-stage';

export const EDUCATION_STAGE_OPTIONS = [
  { label: 'Nenhum', value: EducationStage.NONE },
  { label: 'Fundamental', value: EducationStage.PRIMARY },
  { label: 'Médio', value: EducationStage.SECONDARY },
  { label: 'Superior', value: EducationStage.GRADUATION },
  { label: 'Pós-graduação', value: EducationStage.POST_GRADUATION },
];
