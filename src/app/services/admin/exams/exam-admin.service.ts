import {
  Injectable,
  Injector,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { distinctUntilChanged, first, map, of, switchMap, tap } from 'rxjs';
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
import { ExamsService } from '../../exams.service';

@Injectable({
  providedIn: 'root',
})
export class ExamAdminService {
  private endpoint = `${environment.apiUrl}/exams`;

  totalAssessmentRecords = computed(() =>
    this.examsService.totalAssessmentRecords()
  );
  totalMockRecords = computed(() => this.examsService.totalMockRecords());

  loadedRelations: WritableSignal<
    Relation<BaseQuestion | BaseInstitution | BaseBoard>[]
  > = signal([]);

  constructor(private http: HttpClient, private examsService: ExamsService) {}

  getOne(id: string) {
    return this.examsService.getOne(id);
  }

  validateCode(code: string, timestamp: number) {
    const headers = new HttpHeaders({
      'Cache-Control':
        'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return this.http
      .get<FormattedResponse<{ valid: boolean }>>(
        `${this.endpoint}/validate-code/${code}?t=${timestamp}`,
        { headers }
      )
      .pipe(
        map((res) => (res.success && res.data ? res.data : { valid: false }))
      );
  }

  paginate(start: number = 0, end: number, pageSize: number, type: ExamType) {
    return this.examsService.paginate(start, end, pageSize, type);
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
            this.examsService.totalMockRecords.update((v) =>
              v !== undefined ? v + 1 : undefined
            );
          }
          if (type === ExamType.ASSESSMENT) {
            this.examsService.totalAssessmentRecords.update((v) =>
              v !== undefined ? v + 1 : undefined
            );
          }
        }),
        map((res) =>
          res.success && res.data
            ? { ...res, data: this.examsService.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.examsService.cacheRecords([res.data])
            : undefined
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
            ? { ...res, data: this.examsService.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.examsService.cacheRecords([res.data])
            : undefined
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
            this.examsService.totalMockRecords.update((v) =>
              v !== undefined ? v - 1 : undefined
            );
          }
          if (type === ExamType.ASSESSMENT) {
            this.examsService.totalAssessmentRecords.update((v) =>
              v !== undefined ? v - 1 : undefined
            );
          }
        }),
        tap((res) =>
          this.examsService.loadedRecords.update((m) => {
            if (!res.success) return m;
            m = cloneDeep(m);
            m.delete(id);
            return m;
          })
        ),
        first()
      );
  }
}
