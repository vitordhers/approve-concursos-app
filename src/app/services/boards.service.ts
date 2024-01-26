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
import { environment } from '../../environments/environment';
import { Board, BaseBoard } from '../models/board.model';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { generateHash } from '../shared/functions/generate-hash.function';

@Injectable({
  providedIn: 'root',
})
export class BoardsService {
  private endpoint = `${environment.apiUrl}/boards`;
  allLoaded = false;
  loadedRecords = signal(new Map<string, Board>());
  private injector = inject(Injector);
  private paginateLoaded = computed(() =>
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
      (prev, curr) => generateHash([...prev.entries()]) === generateHash([...curr.entries()])
    )
  );

  totalRecords: WritableSignal<number | undefined> = signal(undefined);

  constructor(private http: HttpClient) {}

  private setAllLoaded(map: Map<string, Board>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength === this.totalRecords();
  }

  serializeRecord(record: BaseBoard) {
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
}
