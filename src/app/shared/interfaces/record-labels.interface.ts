import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface RecordLabels {
  icon: IconDefinition;
  uri: string;
  defArticle: string;
  indefArticle: string;
  defArticlePlural: string;
  indefArticlePlural: string;
  label: string;
  labelCapitalized: string;
  plural: string;
  pluralCapitalized: string;
}
