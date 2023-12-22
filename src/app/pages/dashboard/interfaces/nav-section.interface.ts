import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { NavSectionType } from '../enums/nav-section-type.enum';

export interface NavSection {
  title: string;
  type: NavSectionType;
  uri: string;
  icon: IconDefinition;
  isSubsection: boolean;
  isAdmin?: boolean;
  subsections?: NavSection[];
  action?: (search?: string) => void;
}
