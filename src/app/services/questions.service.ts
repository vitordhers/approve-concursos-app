import {
  Injectable,
  Injector,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../environments/environment';
import { BaseBoard } from '../models/board.model';
import { BaseExam } from '../models/exam.model';
import { BaseInstitution } from '../models/institution.model';
import { Question, BaseQuestion } from '../models/question.model';
import { BaseSubject } from '../models/subject.model';
import { Entity } from '../shared/enums/entity.enum';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';
import { Relation } from '../shared/interfaces/relation.interface';
import {
  Filters,
  SelectorFilter,
} from '../shared/interfaces/filters.interface';
import { generateHash } from '../shared/functions/generate-hash.function';
import { AnswerDto } from './interfaces/answer-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  private endpoint = `${environment.apiUrl}/questions`;
  private allLoaded = false;
  private loadedRecords = signal(new Map<string, Question>());
  private injector = inject(Injector);

  private paginateLoaded = computed(() =>
    Array.from(this.loadedRecords().values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    )
  );

  private paginateLoaded$ = toObservable(this.paginateLoaded, {
    injector: this.injector,
  }).pipe(
    distinctUntilChanged(
      (prev, curr) => generateHash(prev) === generateHash(curr)
    )
  );

  private loadedRecords$ = toObservable(this.loadedRecords, {
    injector: this.injector,
  }).pipe(
    distinctUntilChanged(
      (prev, curr) => generateHash(prev) === generateHash(curr)
    )
  );

  totalRecords = signal(0);

  loadedRelations: WritableSignal<
    Relation<BaseSubject | BaseInstitution | BaseBoard | BaseExam>[]
  > = signal([]);

  constructor(private http: HttpClient) {}

  private setAllLoaded(map: Map<string, Question>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength == this.totalRecords();
  }

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
        `QuestionsAdminService -> serializeRecord missing: ${{
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
    return new Question(
      record.id,
      record.entityId,
      record.code,
      record.prompt,
      record.correctIndex,
      record.subjectId,
      record.alternatives,
      record.createdAt,
      record.updatedAt,
      record.answerExplanation,
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
    const relations: Relation<
      BaseSubject | BaseInstitution | BaseBoard | BaseExam
    >[] = [];

    if (record && record.subject) {
      relations.push({ records: [record.subject], entity: Entity.SUBJECTS });
    }

    if (record && record.institution) {
      relations.push({
        records: [record.institution],
        entity: Entity.INSTITUTIONS,
      });
    }
    if (record && record.board) {
      relations.push({ records: [record.board], entity: Entity.BOARDS });
    }
    if (record && record.exam) {
      relations.push({ records: [record.exam], entity: Entity.EXAMS });
    }

    this.loadedRelations.set(relations);
  }

  cacheRecords(records: (Question | BaseQuestion)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Question
        ? record
        : this.serializeRecord(record as BaseQuestion)
    );

    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      serializedRecords.map((i) => m.set(i.id, i));
      this.setAllLoaded(m);
      return m;
    });
  }

  count(key: string, value: string) {
    return this.http.get<PaginatedResponse<undefined>>(
      `${this.endpoint}/count?key=${key}&value=${value}`
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

  getOne(id: string, withRelations = false) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const loadedRecord = loadedRecords.get(id);
        if (loadedRecord) {
          return of(loadedRecord);
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

  validateCode(code: string) {
    return this.http
      .get<FormattedResponse<{ valid: boolean }>>(
        `${this.endpoint}/validate-code/${code}`
      )
      .pipe(
        map((res) => (res.success && res.data ? res.data : { valid: false }))
      );
  }

  getCached(questionsIds: string[]) {
    return this.loadedRecords$.pipe(
      map((m) => [...m.values()]),
      map((questions) => questions.filter((q) => questionsIds.includes(q.id)))
    );
  }

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        if (this.allLoaded || alreadyLoadedRecords.length === end - start)
          return of(paginateLoaded.slice(start, end));

        let missingRecordsNo = 0;
        let updatedStart = start;
        let updatedEnd = end;
        if (alreadyLoadedRecords.length) {
          missingRecordsNo = pageSize - alreadyLoadedRecords.length;
          updatedStart = alreadyLoadedRecords.length;
          updatedEnd = start + missingRecordsNo;
        }

        return this.http
          .get<PaginatedResponse<Question[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success ? this.totalRecords.set(res.total) : undefined
            ),
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

  applyFirstFiltersAndGetSubjectsSummary(filters: Filters[]) {
    const arrayString = filters.length ? JSON.stringify(filters) : '';

    const encodedArrayString = encodeURIComponent(arrayString);

    const params = new URLSearchParams({ filters: encodedArrayString });

    return this.http
      .get<FormattedResponse<{ total: number; subject: BaseSubject }[]>>(
        `${this.endpoint}/prefilter?${encodedArrayString !== '' ? params : ''}`
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
          const records = response.data;
          records?.map((r) => this.cacheRelations(r));
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
