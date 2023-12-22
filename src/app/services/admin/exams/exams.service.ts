import {
  Injectable,
  Injector,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { toObservable } from '@angular/core/rxjs-interop';
import { cloneDeep } from 'lodash';
import { BaseExam, Exam } from '../../../models/exam.model';
import { AddMockExamDto } from './interfaces/add-mock-exam-dto.interface';
import { AddAssessmentExamDto } from './interfaces/add-assessment-exam-dto.interface';
import { EditMockExamDto } from './interfaces/edit-mock-exam-dto.interface';
import { EditAssessmentExamDto } from './interfaces/edit-assessment-exam-dto.interface';
import { BaseQuestion } from '../../../models/question.model';
import { BaseInstitution } from '../../../models/institution.model';
import { BaseBoard } from '../../../models/board.model';
import { Relation } from '../../../shared/interfaces/relation.interface';
import { ExamType } from '../../../shared/enums/exam-type.enum';
import { generateHash } from '../../../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class ExamsAdminService {
  private endpoint = `${environment.apiUrl}/exams`;
  private allAssessmentLoaded = false;
  private allMockLoaded = false;
  private loadedRecords = signal(new Map<string, Exam>());
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

  totalAssessmentRecords = signal(0);
  totalMockRecords = signal(0);

  loadedRelations: WritableSignal<
    Relation<BaseQuestion | BaseInstitution | BaseBoard>[]
  > = signal([]);

  constructor(private http: HttpClient) {}

  private setAllLoaded(map: Map<string, Exam>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allMockLoaded = recordsLength == this.totalMockRecords();
    this.allAssessmentLoaded = recordsLength == this.totalAssessmentRecords();
  }

  private serializeRecord(record: BaseExam) {
    return new Exam(
      record.id,
      record.entityId,
      record.createdAt,
      record.updatedAt,
      record.code,
      record.name,
      record.type,
      record.questionsIds,
      // record.questions && record.questions.length ? record.questions : [],
      record.year,
      record.boardId,
      record.institutionId
    );
  }

  cacheRecords(records: (Exam | BaseExam)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Exam ? record : this.serializeRecord(record as BaseExam)
    );

    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      serializedRecords.map((i) => m.set(i.id, i));
      this.setAllLoaded(m);
      return m;
    });
  }

  getOne(id: string) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const loadedRecord = loadedRecords.get(id);
        if (loadedRecord) {
          return of(loadedRecord);
        }

        return this.http
          .get<FormattedResponse<Exam>>(`${this.endpoint}/${id}`)
          .pipe(
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

  search(value: string) {
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
          .get<FormattedResponse<Exam[]>>(
            `${this.endpoint}/search?query=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Exam[])
            ),
            tap((records) => this.cacheRecords(records))
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

  paginate(start: number = 0, end: number, pageSize: number, type: ExamType) {
    return this.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        const loadedClause =
          type === ExamType.MOCK
            ? this.allMockLoaded
            : this.allAssessmentLoaded;

        if (loadedClause || alreadyLoadedRecords.length === end - start)
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
          .get<PaginatedResponse<Exam[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}&type=${type}`
          )
          .pipe(
            tap((res) => {
              if (!res.success) return;
              if (type === ExamType.MOCK) {
                this.totalMockRecords.set(res.total);
              }
              if (type === ExamType.ASSESSMENT) {
                this.totalAssessmentRecords.set(res.total);
              }
            }),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Exam[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }

  add(dto: AddMockExamDto | AddAssessmentExamDto, type: ExamType) {
    return this.http
      .post<FormattedResponse<Exam>>(
        `${this.endpoint}/${type === ExamType.MOCK ? 'mock' : 'assessment'}`,
        dto
      )
      .pipe(
        tap((res) => {
          if (!res.success) return;
          if (type === ExamType.MOCK) {
            this.totalMockRecords.update((v) => v + 1);
          }
          if (type === ExamType.ASSESSMENT) {
            this.totalAssessmentRecords.update((v) => v + 1);
          }
        }),
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

  edit(
    id: string,
    dto: EditMockExamDto | EditAssessmentExamDto,
    type: ExamType
  ) {
    return this.http
      .patch<FormattedResponse<Exam>>(
        `${this.endpoint}/${
          type === ExamType.MOCK ? 'mock' : 'assessment'
        }/${id}`,
        dto
      )
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

  remove(id: string, type: ExamType) {
    return this.http
      .delete<FormattedResponse<undefined>>(`${this.endpoint}/${id}`)
      .pipe(
        tap((res) => {
          if (!res.success) return;
          if (type === ExamType.MOCK) {
            this.totalMockRecords.update((v) => v - 1);
          }
          if (type === ExamType.ASSESSMENT) {
            this.totalAssessmentRecords.update((v) => v - 1);
          }
        }),
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
