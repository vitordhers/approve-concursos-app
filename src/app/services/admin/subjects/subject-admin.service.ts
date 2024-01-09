import { Injectable, computed } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { first, map, of, switchMap, tap } from 'rxjs';
import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { cloneDeep } from 'lodash';
import { Subject } from '../../../models/subject.model';
import { AddSubjectDto } from './interfaces/add-subject-dto.interface';
import { EditSubjectDto } from './interfaces/edit-subject-dto.interface';
import { SubjectsService } from '../../subjects.service';

@Injectable({
  providedIn: 'root',
})
export class SubjectAdminService {
  private endpoint = `${environment.apiUrl}/subjects`;

  totalRecords = computed(() => this.subjectsService.totalRecords());

  constructor(
    private http: HttpClient,
    private subjectsService: SubjectsService
  ) {}

  getOne(id: string) {
    return this.subjectsService.getOne(id);
  }

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.subjectsService.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        if (
          this.subjectsService.allLoaded ||
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
          .get<PaginatedResponse<Subject[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success
                ? this.subjectsService.totalRecords.set(res.total)
                : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) =>
                    this.subjectsService.serializeRecord(record)
                  )
                : ([] as Subject[])
            ),
            tap((records) => {
              this.subjectsService.cacheRecords(records);
            })
          );
      })
    );
  }

  add(dto: AddSubjectDto) {
    return this.http.post<FormattedResponse<Subject>>(this.endpoint, dto).pipe(
      tap((res) =>
        res.success && res.data
          ? this.subjectsService.totalRecords.update((v) =>
              v !== undefined ? v + 1 : undefined
            )
          : undefined
      ),
      map((res) =>
        res.success && res.data
          ? { ...res, data: this.subjectsService.serializeRecord(res.data) }
          : res
      ),
      tap((res) =>
        res.success && res.data
          ? this.subjectsService.cacheRecords([res.data])
          : undefined
      )
    );
  }

  edit(id: string, dto: EditSubjectDto) {
    return this.http
      .patch<FormattedResponse<Subject>>(`${this.endpoint}/${id}`, dto)
      .pipe(
        map((res) =>
          res.success && res.data
            ? { ...res, data: this.subjectsService.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res && res.success && res.data
            ? this.subjectsService.cacheRecords([res.data])
            : undefined
        )
      );
  }

  remove(id: string) {
    return this.http
      .delete<FormattedResponse<undefined>>(`${this.endpoint}/${id}`)
      .pipe(
        tap((res) =>
          res.success
            ? this.subjectsService.totalRecords.update((v) =>
                v !== undefined ? v - 1 : undefined
              )
            : undefined
        ),
        tap((res) =>
          this.subjectsService.loadedRecords.update((m) => {
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
