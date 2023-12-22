import { Board } from '../../models/board.model';
import { Exam } from '../../models/exam.model';
import { Institution } from '../../models/institution.model';
import { Question } from '../../models/question.model';
import { Subject } from '../../models/subject.model';

export function displayNameFn(value: Institution | Board | Subject) {
  return value && value.name ? value.name : '';
}

export function displayCodeFn(value: Question | Exam) {
  return value && value.code ? value.code : '';
}
