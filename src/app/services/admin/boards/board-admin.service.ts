import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../../../environments/environment';
import { Board } from '../../../models/board.model';
import { FormattedResponse } from '../../../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../../../shared/interfaces/paginated-response.interface';
import { AddBoardDto } from './interfaces/add-board-dto.interface';
import { EditBoardDto } from './interfaces/edit-board-dto.interface';
import { BoardsService } from '../../boards.service';

@Injectable({
  providedIn: 'root',
})
export class BoardAdminService {
  private endpoint = `${environment.apiUrl}/boards`;

  totalRecords = computed(() => this.boardsService.totalRecords());

  constructor(private http: HttpClient, private boardsService: BoardsService) {}

  getOne(id: string) {
    return this.boardsService.getOne(id);
  }

  paginate(start: number = 0, end: number, pageSize: number) {
    return this.boardsService.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        if (
          this.boardsService.allLoaded ||
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
          .get<PaginatedResponse<Board[]>>(
            `${this.endpoint}?start=${updatedStart}&limit=${updatedEnd}`
          )
          .pipe(
            tap((res) =>
              res.success
                ? this.boardsService.totalRecords.set(res.total)
                : undefined
            ),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) =>
                    this.boardsService.serializeRecord(record)
                  )
                : ([] as Board[])
            ),
            tap((records) => this.boardsService.cacheRecords(records))
          );
      })
    );
  }

  add(dto: AddBoardDto) {
    return this.http.post<FormattedResponse<Board>>(this.endpoint, dto).pipe(
      tap((res) =>
        res.success && res.data
          ? this.boardsService.totalRecords.update((v) =>
              v !== undefined ? v + 1 : undefined
            )
          : undefined
      ),
      map((res) =>
        res.success && res.data
          ? { ...res, data: this.boardsService.serializeRecord(res.data) }
          : res
      ),
      tap((res) =>
        res.success && res.data
          ? this.boardsService.cacheRecords([res.data])
          : undefined
      )
    );
  }

  edit(id: string, dto: EditBoardDto) {
    return this.http
      .patch<FormattedResponse<Board>>(`${this.endpoint}/${id}`, dto)
      .pipe(
        map((res) =>
          res.success && res.data
            ? { ...res, data: this.boardsService.serializeRecord(res.data) }
            : res
        ),
        tap((res) =>
          res.success && res.data
            ? this.boardsService.cacheRecords([res.data])
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
            ? this.boardsService.totalRecords.update((v) =>
                v !== undefined ? v - 1 : undefined
              )
            : undefined
        ),
        tap((res) =>
          this.boardsService.loadedRecords.update((m) => {
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
