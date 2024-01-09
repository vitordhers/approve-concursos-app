import { Injectable, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { first, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';

import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { environment } from '../../../../environments/environment';
import { BaseQuestion, Question } from '../../../models/question.model';
import { AddQuestionDto } from './interfaces/add-question-dto.interface';
import { EditQuestionDto } from './interfaces/edit-question-dto.interface';
import { QuestionsService } from '../../questions.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionAdminService {
  private endpoint = `${environment.apiUrl}/questions`;

  totalRecords = computed(() => this.questionsService.totalRecords());

  constructor(
    private http: HttpClient,
    private questionsService: QuestionsService
  ) {}

  count(key: string, value: string) {
    return this.http.get<PaginatedResponse<undefined>>(
      `${this.endpoint}/count?key=${key}&value=${value}`
    );
  }

  getOne(id: string, withRelations = false) {
    return this.questionsService.getOne(id, withRelations);
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

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.questionsService.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        if (
          this.questionsService.allLoaded ||
          alreadyLoadedRecords.length === end - start
        )
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
              res.success
                ? this.questionsService.totalRecords.set(res.total)
                : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) =>
                    this.questionsService.serializeRecord(record)
                  )
                : ([] as Question[])
            ),
            tap((records) => this.questionsService.cacheRecords(records))
          );
      })
    );
  }

  add(dto: AddQuestionDto) {
    return this.http.post<FormattedResponse<Question>>(this.endpoint, dto).pipe(
      tap((res) =>
        res.success && res.data
          ? this.questionsService.totalRecords.update((v) =>
              v !== undefined ? v + 1 : undefined
            )
          : undefined
      ),
      map((res) =>
        res.success && res.data
          ? { ...res, data: this.questionsService.serializeRecord(res.data) }
          : res
      ),
      tap((res) =>
        res.success && res.data
          ? this.questionsService.cacheRecords([res.data])
          : undefined
      )
    );
  }

  addBulk(dtos: AddQuestionDto[]) {
    return this.http
      .post<FormattedResponse<Question[]>>(`${this.endpoint}/bulk`, dtos)
      .pipe(
        tap((res) =>
          this.questionsService.totalRecords.update((v) => {
            if (!res.success || !res.data || !res.data.length) return v;
            return v !== undefined ? v + res.data.length : undefined;
          })
        ),
        map((res) =>
          res.success && res.data && res.data.length
            ? {
                ...res,
                data: res.data.map((data) =>
                  this.questionsService.serializeRecord(data)
                ),
              }
            : res
        ),
        tap((res) =>
          res.success && res.data && res.data.length
            ? this.questionsService.cacheRecords(res.data)
            : undefined
        )
      );
  }

  edit(id: string, dto: EditQuestionDto) {
    return this.http
      .patch<FormattedResponse<Question>>(`${this.endpoint}/${id}`, dto)
      .pipe(
        map((res) =>
          res.success && res.data
            ? { ...res, data: this.questionsService.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.questionsService.cacheRecords([res.data])
            : undefined
        )
      );
  }

  remove(id: string) {
    return this.http
      .delete<FormattedResponse<void>>(`${this.endpoint}/${id}`)
      .pipe(
        tap((res) =>
          res.success
            ? this.questionsService.totalRecords.update((v) =>
                v !== undefined ? v - 1 : undefined
              )
            : undefined
        ),
        tap((res) =>
          this.questionsService.loadedRecords.update((m) => {
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
