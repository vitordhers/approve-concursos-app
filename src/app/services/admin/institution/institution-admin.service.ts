import { Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../../../environments/environment';
import { Institution } from '../../../models/institution.model';
import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { AddInstitutionDto } from './interfaces/add-institution-dto.interface';
import { EditInstitutionDto } from './interfaces/edit-institution-dto.interface';
import { InstitutionsService } from '../../institutions.service';

@Injectable({
  providedIn: 'root',
})
export class InstitutionAdminService {
  private endpoint = `${environment.apiUrl}/institutions`;

  totalRecords = computed(() => this.institutionsService.totalRecords());

  constructor(
    private http: HttpClient,
    private institutionsService: InstitutionsService
  ) {}

  getOne(id: string) {
    return this.institutionsService.getOne(id);
  }

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.institutionsService.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);
        // console.log(
        //   'RUNNED paginate',
        //   cloneDeep({
        //     alreadyLoadedRecords,
        //     length: alreadyLoadedRecords.length,
        //     initalStart: start,
        //     initialEnd: end,
        //     pageSize,
        //     allLoaded: this.allLoaded,
        //   })
        // );

        if (
          this.institutionsService.allLoaded ||
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
          .get<PaginatedResponse<Institution[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success
                ? this.institutionsService.totalRecords.set(res.total)
                : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) =>
                    this.institutionsService.serializeRecord(record)
                  )
                : ([] as Institution[])
            ),
            tap((records) => this.institutionsService.cacheRecords(records))
          );
      })
    );
  }

  add(dto: AddInstitutionDto) {
    return this.http
      .post<FormattedResponse<Institution>>(this.endpoint, dto)
      .pipe(
        tap((res) =>
          res.success && res.data
            ? this.institutionsService.totalRecords.update((v) =>
                v !== undefined ? v + 1 : undefined
              )
            : undefined
        ),
        map((res) =>
          res.success && res.data
            ? {
                ...res,
                data: this.institutionsService.serializeRecord(res.data),
              }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.institutionsService.cacheRecords([res.data])
            : undefined
        )
      );
  }

  edit(id: string, dto: EditInstitutionDto) {
    return this.http
      .patch<FormattedResponse<Institution>>(`${this.endpoint}/${id}`, dto)
      .pipe(
        map((res) =>
          res.success && res.data
            ? {
                ...res,
                data: this.institutionsService.serializeRecord(res.data),
              }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.institutionsService.cacheRecords([res.data])
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
            ? this.institutionsService.totalRecords.update((v) =>
                v !== undefined ? v - 1 : undefined
              )
            : undefined
        ),
        tap((res) =>
          this.institutionsService.loadedRecords.update((m) => {
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
