import { faBuilding, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { RecordLabels } from '../interfaces/record-labels.interface';

export const mockExamRecordLabels: RecordLabels = {
  icon: faListCheck,
  uri: 'simulados',
  defArticle: 'o',
  indefArticle: 'esse',
  defArticlePlural: 'os',
  indefArticlePlural: 'esses',
  label: 'simulado',
  labelCapitalized: 'Simulado',
  plural: 'simulados',
  pluralCapitalized: 'Simulados',
};
