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
import { distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';

import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { environment } from '../../../../environments/environment';
import { BaseQuestion, Question } from '../../../models/question.model';
import { AddQuestionDto } from './interfaces/add-question-dto.interface';
import { EditQuestionDto } from './interfaces/edit-question-dto.interface';
import { Relation } from '../../../shared/interfaces/relation.interface';
import { BaseBoard, Board } from '../../../models/board.model';
import {
  BaseInstitution,
  Institution,
} from '../../../models/institution.model';
import { BaseExam, Exam } from '../../../models/exam.model';
import { BaseSubject, Subject } from '../../../models/subject.model';
import { Entity } from '../../../shared/enums/entity.enum';
import { generateHash } from '../../../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class QuestionsAdminService {
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

  private serializeRecord(record: BaseQuestion, cacheRelations = false) {
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
    return new Question(
      record.id,
      record.entityId,
      record.code,
      record.prompt,
      record.correctIndex,
      record.subjectId,
      record.answerExplanation,
      record.alternatives,
      record.createdAt,
      record.updatedAt,
      record.illustration,
      record.year,
      record.institutionId,
      record.boardId,
      record.entityId,
      record.educationStage
    );
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

  add(dto: AddQuestionDto) {
    return this.http.post<FormattedResponse<Question>>(this.endpoint, dto).pipe(
      tap((res) =>
        res.success && res.data
          ? this.totalRecords.update((v) => v + 1)
          : undefined
      ),
      map((res) =>
        res.success && res.data
          ? { ...res, data: this.serializeRecord(res.data) }
          : res
      ),
      tap((res) =>
        res.success && res.data ? this.cacheRecords([res.data]) : undefined
      )
    );
  }

  edit(id: string, dto: EditQuestionDto) {
    return this.http
      .patch<FormattedResponse<Question>>(`${this.endpoint}/${id}`, dto)
      .pipe(
        map((res) =>
          res.success && res.data
            ? { ...res, data: this.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res.success && res.data ? this.cacheRecords([res.data]) : undefined
        )
      );
  }

  remove(id: string) {
    return this.http
      .delete<FormattedResponse<void>>(`${this.endpoint}/${id}`)
      .pipe(
        tap((res) =>
          res.success ? this.totalRecords.update((v) => v - 1) : undefined
        ),
        tap((res) =>
          this.loadedRecords.update((m) => {
            if (!res.success) return m;
            m = cloneDeep(m);
            m.delete(id);
            return m;
          })
        )
      );
  }
}
