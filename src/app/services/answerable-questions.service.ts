import { Injectable, Injector, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../environments/environment';
import { BaseBoard } from '../models/board.model';
import { BaseExam } from '../models/exam.model';
import { BaseInstitution } from '../models/institution.model';
import {
  Question,
  BaseQuestion,
  AnswerableQuestion,
} from '../models/question.model';
import { BaseSubject } from '../models/subject.model';
import { CacheAcessor } from '../shared/enums/entity.enum';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import {
  Filters,
  SelectorFilter,
} from '../shared/interfaces/filters.interface';
import { generateHash } from '../shared/functions/generate-hash.function';
import { AnswerDto } from './interfaces/answer-dto.interface';
import { QuestionsService } from './questions.service';

@Injectable({
  providedIn: 'root',
})
export class AnswerableQuestionsService {
  private endpoint = `${environment.apiUrl}/questions`;

  loadedRecords = signal(new Map<string, AnswerableQuestion>());
  private injector = inject(Injector);

  loadedRecords$ = toObservable(this.loadedRecords, {
    injector: this.injector,
  }).pipe(
    distinctUntilChanged(
      (prev, curr) => generateHash(prev) === generateHash(curr)
    )
  );

  loadedRelations = signal(
    new Map<
      CacheAcessor,
      (BaseSubject | BaseInstitution | BaseBoard | BaseExam)[]
    >()
  );

  constructor(
    private http: HttpClient,
    private questionsService: QuestionsService
  ) {}

  serializeRecord(record: BaseQuestion, cacheRelations = false) {
    if (
      !record.id ||
      !record.entityId ||
      !record.code ||
      !record.createdAt ||
      !record.updatedAt
    ) {
      console.error({
        id: record?.id,
        entity: record?.entityId,
        code: record?.code,
        createdAt: record?.createdAt,
        updatedAt: record?.updatedAt,
      });
      throw new Error(
        `AnswerableQuestionsService -> serializeRecord missing: ${{
          id: record?.id,
          entity: record?.entityId,
          code: record?.code,
          createdAt: record?.createdAt,
          updatedAt: record?.updatedAt,
        }}`
      );
    }

    if (cacheRelations) {
      this.cacheRelations(record);
    }
    return new AnswerableQuestion(
      record.id,
      record.entityId,
      record.code,
      record.prompt,
      record.subjectId,
      record.alternatives,
      record.createdAt,
      record.updatedAt,
      record.illustration,
      record.year,
      record.institutionId,
      record.boardId,
      record.examId,
      record.educationStage
    );
  }

  cacheRelations(record: {
    subject?: BaseSubject;
    institution?: BaseInstitution;
    board?: BaseBoard;
    exam?: BaseExam;
  }) {
    const relationsMap = new Map<
      CacheAcessor,
      (BaseSubject | BaseInstitution | BaseBoard | BaseExam)[]
    >();

    const subjectRelations: BaseSubject[] = [];
    const institutionRelations: BaseInstitution[] = [];
    const boardRelations: BaseInstitution[] = [];
    const examRelations: BaseExam[] = [];

    if (record && record.subject) {
      subjectRelations.push(record.subject);
    }

    if (record && record.institution) {
      institutionRelations.push(record.institution);
    }

    if (record && record.board) {
      boardRelations.push(record.board);
    }
    if (record && record.exam) {
      examRelations.push(record.exam);
    }

    this.loadedRelations.set(relationsMap);
  }

  cacheRecords(records: (AnswerableQuestion | BaseQuestion)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof AnswerableQuestion
        ? record
        : this.serializeRecord(record as BaseQuestion)
    );

    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      serializedRecords.map((i) => m.set(i.id, i));
      return m;
    });
  }

  getOne(id: string, withRelations = false) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const loadedRecord = loadedRecords.get(id);
        if (loadedRecord) {
          return of(loadedRecord);
        }

        const questionFromQuestionsService =
          this.questionsService.getOneFromCache(id);

        if (questionFromQuestionsService) {
          return of(this.serializeRecord(questionFromQuestionsService));
        }

        return this.http
          .get<FormattedResponse<BaseQuestion>>(
            `${this.endpoint}/${id}?withRelations=${withRelations}`
          )
          .pipe(
            map((res) =>
              res.success && res.data
                ? this.serializeRecord(res.data, withRelations)
                : undefined
            ),
            tap((record) => (record ? this.cacheRecords([record]) : undefined))
          );
      })
    );
  }

  searchByCode(value: string) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecordsMap) => {
        const regex = new RegExp(value);
        const foundRecords = Array.from(loadedRecordsMap.values()).filter((r) =>
          regex.test(r.code)
        );
        if (foundRecords && foundRecords.length) {
          return of(foundRecords);
        }

        return this.http
          .get<FormattedResponse<BaseQuestion[]>>(
            `${this.endpoint}/search?code=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Question[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }

  getCached(questionsIds: string[]) {
    return this.loadedRecords$.pipe(
      map((m) => [...m.values()]),
      map((questions) => questions.filter((q) => questionsIds.includes(q.id)))
    );
  }

  fetchQuestionsWithFilters(filters: Filters[], selectors: SelectorFilter[]) {
    const filtersArrayString = filters.length ? JSON.stringify(filters) : '';
    const encodedFiltersArrayString = encodeURIComponent(filtersArrayString);

    const selectorsArrayString = selectors.length
      ? JSON.stringify(selectors)
      : '';
    const encodedSelectorsArrayString =
      encodeURIComponent(selectorsArrayString);

    const params = new URLSearchParams({
      filters: encodedFiltersArrayString,
      selectors: encodedSelectorsArrayString,
    });

    return this.http
      .get<FormattedResponse<BaseQuestion[]>>(
        `${this.endpoint}/filter?${
          encodedSelectorsArrayString !== '' ||
          encodedSelectorsArrayString !== ''
            ? params
            : ''
        }`
      )
      .pipe(
        map((response) => {
          if (
            !response ||
            !response.success ||
            !response.data ||
            !response.data.length
          )
            return [];
          return response.data.map((q) => this.serializeRecord(q, true));
        })
      );
  }

  answer(answerDto: AnswerDto) {
    return this.http.post(`${this.endpoint}/answer`, answerDto);
  }
}
