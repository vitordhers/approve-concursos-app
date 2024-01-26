import { ParamMap, Params } from '@angular/router';
import { EnumUtils } from '../utils/enum-utilities.model';

export enum QuestionFilter {
  year = 'year',
  institutionId = 'institutionId',
  educationStage = 'educationStage',
  fromTo = 'fromTo',
  boardIdOR = 'boardIdOR',
  subjectIdOR = 'subjectIdOR',
  subjectIdSELECTOR = 'subjectIdSELECTOR',
}

export enum QuestionFilterPt {
  year = 'ano',
  institutionId = 'orgao',
  educationStage = 'escolaridade',
  fromTo = 'de-ate',
  boardIdOR = 'ou-banca',
  subjectIdOR = 'ou-disciplina',
  subjectIdSELECTOR = 'com-disciplina',
}

export type QuestionFilterKey = keyof typeof QuestionFilter;

export const QuestionFilterKeys = EnumUtils.enumKeys(QuestionFilter);
export const QuestionFilterKeysPt = EnumUtils.enumValues(
  QuestionFilterPt
) as string[];
export const QuestionFilterDict = EnumUtils.enumObject(QuestionFilter);

export const translateQuestionParamMap = (
  paramMap: ParamMap,
  translateTo: 'en' | 'pt' = 'pt'
) => {
  const translatedParams: Params = {};
  if (translateTo === 'pt') {
    Object.entries(QuestionFilterPt).forEach(([key, param]) => {
      if (paramMap.has(param)) {
        const values = paramMap.getAll(param);
        translatedParams[key] = values.length ? values.join(',') : values[0];
      }
    });
  }
  return translatedParams;
};
export const QuestionFilterTranslate: {
  year: {
    en: QuestionFilter.year;
    pt: QuestionFilterPt.year;
  };
  institutionId: {
    en: QuestionFilter.institutionId;
    pt: QuestionFilterPt.institutionId;
  };
  educationStage: {
    en: QuestionFilter.educationStage;
    pt: QuestionFilterPt.educationStage;
  };
  fromTo: {
    en: QuestionFilter.fromTo;
    pt: QuestionFilterPt.fromTo;
  };
  boardIdOR: {
    en: QuestionFilter.boardIdOR;
    pt: QuestionFilterPt.boardIdOR;
  };

  subjectIdOR: {
    en: QuestionFilter.subjectIdOR;
    pt: QuestionFilterPt.subjectIdOR;
  };
  subjectIdSELECTOR: {
    en: QuestionFilter.subjectIdSELECTOR;
    pt: QuestionFilterPt.subjectIdSELECTOR;
  };
} = {
  year: {
    en: QuestionFilter.year,
    pt: QuestionFilterPt.year,
  },
  institutionId: {
    en: QuestionFilter.institutionId,
    pt: QuestionFilterPt.institutionId,
  },
  educationStage: {
    en: QuestionFilter.educationStage,
    pt: QuestionFilterPt.educationStage,
  },
  fromTo: {
    en: QuestionFilter.fromTo,
    pt: QuestionFilterPt.fromTo,
  },
  boardIdOR: {
    en: QuestionFilter.boardIdOR,
    pt: QuestionFilterPt.boardIdOR,
  },

  subjectIdOR: {
    en: QuestionFilter.subjectIdOR,
    pt: QuestionFilterPt.subjectIdOR,
  },
  subjectIdSELECTOR: {
    en: QuestionFilter.subjectIdSELECTOR,
    pt: QuestionFilterPt.subjectIdSELECTOR,
  },
};
