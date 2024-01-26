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
  navigationPayload?: NavigationPayload | ((arg: string) => NavigationPayload);
}

export interface NavigationPayload {
  params?: string[];
  fragment?: string;
  queryParams?: Record<string, string>;
}
