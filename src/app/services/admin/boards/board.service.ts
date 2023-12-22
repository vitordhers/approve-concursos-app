import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../../../environments/environment';
import { Board, BaseBoard } from '../../../models/board.model';
import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { AddBoardDto } from './interfaces/add-board-dto.interface';
import { EditBoardDto } from './interfaces/edit-board-dto.interface';
import { generateHash } from '../../../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class BoardAdminService {
  private endpoint = `${environment.apiUrl}/boards`;
  private allLoaded = false;
  private loadedRecords = signal(new Map<string, Board>());
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

  private setAllLoaded(map: Map<string, Board>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength == this.totalRecords();
  }

  private serializeRecord(record: BaseBoard) {
    return new Board(
      record.id,
      record.entityId,
      record.createdAt,
      record.updatedAt,
      record.name,
      record.img,
      record.thumb
    );
  }

  cacheRecords(records: (Board | BaseBoard)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Board
        ? record
        : this.serializeRecord(record as BaseBoard)
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
          .get<FormattedResponse<Board>>(`${this.endpoint}/${id}`)
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
          .get<FormattedResponse<Board[]>>(
            `${this.endpoint}/search?query=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Board[])
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
          .get<PaginatedResponse<Board[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success ? this.totalRecords.set(res.total) : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Board[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }

  add(dto: AddBoardDto) {
    return this.http.post<FormattedResponse<Board>>(this.endpoint, dto).pipe(
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

  edit(id: string, dto: EditBoardDto) {
    return this.http
      .patch<FormattedResponse<Board>>(`${this.endpoint}/${id}`, dto)
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
      .delete<FormattedResponse<undefined>>(`${this.endpoint}/${id}`)
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
