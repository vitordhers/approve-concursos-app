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
import { distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../environments/environment';
import { BaseBoard } from '../models/board.model';
import { BaseExam } from '../models/exam.model';
import { BaseInstitution } from '../models/institution.model';
import { Question, BaseQuestion } from '../models/question.model';
import { BaseSubject } from '../models/subject.model';
import { Entity } from '../shared/enums/entity.enum';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { generateHash } from '../shared/functions/generate-hash.function';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  private endpoint = `${environment.apiUrl}/questions`;
  allLoaded = false;
  loadedRecords = signal(new Map<string, Question>());
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

  loadedRecords$ = toObservable(this.loadedRecords, {
    injector: this.injector,
  }).pipe(
    distinctUntilChanged(
      (prev, curr) =>
        generateHash([...prev.entries()]) === generateHash([...curr.entries()])
    )
  );

  totalRecords: WritableSignal<number | undefined> = signal(undefined);

  loadedRelations = signal(
    new Map<Entity, (BaseSubject | BaseInstitution | BaseBoard | BaseExam)[]>()
  );

  constructor(private http: HttpClient) {}

  setAllLoaded(map: Map<string, Question>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allLoaded = recordsLength === this.totalRecords();
  }

  serializeRecord(record: BaseQuestion) {
    if (
      !record.id ||
      !record.entityId ||
      !record.code ||
      !record.createdAt ||
      !record.updatedAt
    ) {
      console.error({
        id: record?.id,
        entity: record?.entityId,
        code: record?.code,
        createdAt: record?.createdAt,
        updatedAt: record?.updatedAt,
      });
      throw new Error(
        `QuestionsService -> serializeRecord missing: ${{
          id: record?.id,
          entity: record?.entityId,
          code: record?.code,
          createdAt: record?.createdAt,
          updatedAt: record?.updatedAt,
        }}`
      );
    }

    return new Question(
      record.id,
      record.entityId,
      record.code,
      record.prompt,
      record.correctIndex as number,
      record.subjectId,
      record.alternatives,
      record.createdAt,
      record.updatedAt,
      record.answerExplanation,
      record.illustration,
      record.year,
      record.institutionId,
      record.boardId,
      record.examId,
      record.educationStage
    );
  }

  cacheRelations(
    records: {
      subject?: BaseSubject;
      institution?: BaseInstitution;
      board?: BaseBoard;
      exam?: BaseExam;
    }[]
  ) {
    const relationsMap = new Map<
      Entity,
      (BaseSubject | BaseInstitution | BaseBoard | BaseExam)[]
    >();

    const subjectRelations: BaseSubject[] = [];
    const institutionRelations: BaseInstitution[] = [];
    const boardRelations: BaseInstitution[] = [];
    const examRelations: BaseExam[] = [];

    records.forEach((record) => {
      if (!record) return;
      if (record.subject) {
        subjectRelations.push(record.subject);
      }

      if (record.institution) {
        institutionRelations.push(record.institution);
      }

      if (record.board) {
        boardRelations.push(record.board);
      }
      if (record.exam) {
        examRelations.push(record.exam);
      }
    });

    if (subjectRelations.length) {
      relationsMap.set(Entity.SUBJECTS, subjectRelations);
    }

    if (institutionRelations.length) {
      relationsMap.set(Entity.INSTITUTIONS, institutionRelations);
    }

    if (boardRelations.length) {
      relationsMap.set(Entity.BOARDS, boardRelations);
    }

    if (examRelations.length) {
      relationsMap.set(Entity.EXAMS, examRelations);
    }

    this.loadedRelations.set(relationsMap);
  }

  cacheRecords(records: (Question | BaseQuestion)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Question
        ? record
        : this.serializeRecord(record as BaseQuestion)
    );

    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      serializedRecords.map((i) => m.set(i.id, i));
      this.setAllLoaded(m);
      return m;
    });
  }

  getOne(id: string, withRelations = false) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const loadedRecord = loadedRecords.get(id);
        if (loadedRecord) {
          return of(loadedRecord);
        }

        return this.http
          .get<FormattedResponse<BaseQuestion>>(
            `${this.endpoint}/${id}?withRelations=${withRelations}`
          )
          .pipe(
            tap((res) =>
              res.success && res.data
                ? this.cacheRelations([res.data])
                : undefined
            ),
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

  getOneFromCache(id: string) {
    return this.loadedRecords().get(id);
  }

  getCached(questionsIds: string[]) {
    return this.loadedRecords$.pipe(
      map((m) => [...m.values()]),
      map((questions) => questions.filter((q) => questionsIds.includes(q.id)))
    );
  }
}
