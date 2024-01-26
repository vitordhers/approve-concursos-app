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
import { CacheAcessor, Entity } from '../shared/enums/entity.enum';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import {
  QuestionFilters,
  SelectorQuestionFilter,
} from '../shared/interfaces/filters.interface';
import { generateHash } from '../shared/functions/generate-hash.function';
import { AnswerDto } from './interfaces/answer-dto.interface';
import { QuestionsService } from './questions.service';
import { Params } from '@angular/router';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';

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
      (prev, curr) =>
        generateHash([...prev.entries()]) === generateHash([...curr.entries()])
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

  serializeRecord(record: BaseQuestion) {
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

  cacheRelations(
    records: {
      subject?: BaseSubject;
      institution?: BaseInstitution;
      board?: BaseBoard;
      exam?: BaseExam;
    }[]
  ) {
    const relationsMap = new Map<
      CacheAcessor,
      (BaseSubject | BaseInstitution | BaseBoard | BaseExam)[]
    >();

    const subjectRelations: BaseSubject[] = [];
    const institutionRelations: BaseInstitution[] = [];
    const boardRelations: BaseInstitution[] = [];
    const examRelations: BaseExam[] = [];

    records.forEach((record) => {
      if (record.subject) {
        subjectRelations.push(record.subject);
      }

      if (record.institution) {
        institutionRelations.push(record.institution);
      }

      if (record.board) {
        boardRelations.push(record.board);
      }
      if (record.exam) {
        examRelations.push(record.exam);
      }
    });

    if (subjectRelations.length) {
      relationsMap.set(Entity.SUBJECTS, subjectRelations);
    }

    if (institutionRelations.length) {
      relationsMap.set(Entity.INSTITUTIONS, institutionRelations);
    }

    if (boardRelations.length) {
      relationsMap.set(Entity.BOARDS, boardRelations);
    }

    if (examRelations.length) {
      relationsMap.set(Entity.EXAMS, examRelations);
    }

    this.loadedRelations.set(relationsMap);
  }

  cacheRecords(records: (AnswerableQuestion | BaseQuestion)[]) {
    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      const serializedRecords = records.map((record) =>
        record instanceof AnswerableQuestion
          ? record
          : this.serializeRecord(record as BaseQuestion)
      );
      serializedRecords.forEach((i) => m.set(i.id, i));
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
            tap((res) =>
              res.success && res.data && withRelations
                ? this.cacheRelations([res.data])
                : undefined
            ),
            map((res) =>
              res.success && res.data
                ? this.serializeRecord(res.data)
                : undefined
            ),
            tap((record) => (record ? this.cacheRecords([record]) : undefined))
          );
      })
    );
  }

  getByIds(questionsIds: string[]) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const recordsToLoad = questionsIds.length;
        const alreadyLoadedRecords: AnswerableQuestion[] = [];
        const missingRecordsIds: string[] = [];

        questionsIds.forEach((questionId) => {
          if (loadedRecords.has(questionId)) {
            alreadyLoadedRecords.push(
              loadedRecords.get(questionId) as AnswerableQuestion
            );
            return;
          }
          missingRecordsIds.push(questionId);
        });

        if (
          recordsToLoad == alreadyLoadedRecords.length ||
          missingRecordsIds.length === 0
        ) {
          return of(alreadyLoadedRecords);
        }

        return this.http
          .get<PaginatedResponse<BaseQuestion[]>>(
            `${this.endpoint}/select?ids=${encodeURIComponent(
              missingRecordsIds.join(',')
            )}`
          )
          .pipe(
            tap((res) => {
              if (!res || !res.success || !res.data || !res.data.length) return;
              const records = res.data;
              this.cacheRelations(records);
            }),
            map((res) => {
              if (!res || !res.success || !res.data || !res.data.length)
                return [] as AnswerableQuestion[];
              const records = res.data;

              const serializedRecords = records.map((r) =>
                this.serializeRecord(r)
              );

              this.cacheRecords(serializedRecords);
              return serializedRecords;
            }),
            map((fetchedRecords) => {
              return [...alreadyLoadedRecords, ...fetchedRecords]
            })
          );
      })
    );
  }

  searchByTerms(value: string, start: number, limit: number) {
    return this.http
      .get<PaginatedResponse<BaseQuestion[]>>(
        `${this.endpoint}/search?terms=${encodeURIComponent(
          value
        )}&start=${start}&limit=${limit}`
      )
      .pipe(
        tap((res) => {
          if (!res || !res.success || !res.data || !res.data.length) return;
          const records = res.data;
          this.cacheRelations(records);
          const serializedRecords = records.map((r) => this.serializeRecord(r));

          this.cacheRecords(serializedRecords);
        })
      );
  }

  searchByCode(value: string) {
    return this.http
      .get<FormattedResponse<BaseQuestion[]>>(
        `${this.endpoint}/search?code=${encodeURIComponent(value)}`
      )
      .pipe(
        map((res) =>
          res.success && res.data && res.data.length
            ? res.data.map((record) => this.serializeRecord(record))
            : ([] as Question[])
        ),
        tap((records) => this.cacheRecords(records))
      );
  }

  getCached(questionsIds: string[]) {
    return this.loadedRecords$.pipe(
      map((m) => [...m.values()]),
      map((questions) => questions.filter((q) => questionsIds.includes(q.id)))
    );
  }

  private paramsToQueryParamsString(params: Params) {
    let queryParamStr = '';

    Object.entries(params).forEach(([key, value], index) => {
      console.log({ key, value, index });
      if (index === 0) {
        queryParamStr += '?';
      }
      queryParamStr += `&${encodeURIComponent(key)}=${encodeURIComponent(
        value
      )}`;
    });

    return queryParamStr;
  }

  applyFirstFiltersAndGetSubjectsSummary(params: Params) {
    const queryParams = this.paramsToQueryParamsString(params);

    console.log('applyFirstFiltersAndGetSubjectsSummary', { queryParams });
    return this.http
      .get<FormattedResponse<{ total: number; subject: BaseSubject }[]>>(
        `${this.endpoint}/prefilter${queryParams}`
      )
      .pipe(
        tap((response) => {
          if (
            !response ||
            !response.success ||
            !response.data ||
            !response.data.length
          )
            return;
          this.cacheRelations(response.data);
        }),
        map((response) => {
          if (
            !response ||
            !response.success ||
            !response.data ||
            !response.data.length
          )
            return [];
          return response.data;
        })
      );
  }

  fetchQuestionsWithFilters(params: Params) {
    const queryParams = this.paramsToQueryParamsString(params);

    return this.http
      .get<FormattedResponse<BaseQuestion[]>>(
        `${this.endpoint}/filter${queryParams}`
      )
      .pipe(
        tap((response) =>
          response.success && response.data && response.data.length
            ? this.cacheRelations(response.data)
            : undefined
        ),
        map((response) => {
          if (
            !response ||
            !response.success ||
            !response.data ||
            !response.data.length
          )
            return [];
          return response.data.map((q) => this.serializeRecord(q));
        })
      );
  }

  answer(answerDto: AnswerDto) {
    return this.http.post(`${this.endpoint}/answer`, answerDto);
  }
}
