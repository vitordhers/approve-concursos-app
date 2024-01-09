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
import { BaseSubject, Subject } from '../models/subject.model';
import { environment } from '../../environments/environment';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';
import { generateHash } from '../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class SubjectsService {
  private endpoint = `${environment.apiUrl}/subjects`;
  allLoaded = false;
  loadedRecords = signal(new Map<string, Subject>());
  private injector = inject(Injector);

  paginateLoaded = computed(() =>
    Array.from(this.loadedRecords().values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    )
  );

  paginateLoaded$ = toObservable(this.paginateLoaded, {
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

  totalRecords: WritableSignal<number | undefined> = signal(undefined);

  constructor(private http: HttpClient) {}

  private setAllLoaded(map: Map<string, Subject>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength === this.totalRecords();
  }

  serializeRecord(record: BaseSubject) {
    return new Subject(
      record.id,
      record.entityId,
      record.createdAt,
      record.updatedAt,
      record.name,
      record.img,
      record.thumb
    );
  }

  cacheRecords(records: (Subject | BaseSubject)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Subject
        ? record
        : this.serializeRecord(record as BaseSubject)
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
          .get<FormattedResponse<Subject>>(`${this.endpoint}/${id}`)
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
          .get<FormattedResponse<Subject[]>>(
            `${this.endpoint}/search?query=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Subject[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }
}
