import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { cloneDeep } from 'lodash';
import { environment } from '../../environments/environment';
import { Institution, BaseInstitution } from '../models/institution.model';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';
import { generateHash } from '../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class InstitutionsService {
  private endpoint = `${environment.apiUrl}/institutions`;
  private allLoaded = false;
  private loadedRecords = signal(new Map<string, Institution>());
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

  constructor(private http: HttpClient) {}

  private setAllLoaded(map: Map<string, Institution>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength == this.totalRecords();
  }

  private serializeRecord(record: BaseInstitution) {
    return new Institution(
      record.id,
      record.entityId,
      record.createdAt,
      record.updatedAt,
      record.name,
      record.img,
      record.thumb
    );
  }

  cacheRecords(records: (Institution | BaseInstitution)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Institution
        ? record
        : this.serializeRecord(record as BaseInstitution)
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
          .get<FormattedResponse<BaseInstitution>>(`${this.endpoint}/${id}`)
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
          regex.test(r.name)
        );
        if (foundRecords && foundRecords.length) {
          return of(foundRecords);
        }

        return this.http
          .get<FormattedResponse<BaseInstitution[]>>(
            `${this.endpoint}/search?query=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Institution[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
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
          .get<PaginatedResponse<Institution[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success ? this.totalRecords.set(res.total) : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Institution[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }
}
