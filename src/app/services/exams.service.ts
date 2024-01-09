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
import {
  Observable,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { cloneDeep } from 'lodash';
import { environment } from '../../environments/environment';
import { BaseBoard } from '../models/board.model';
import { Exam, BaseExam } from '../models/exam.model';
import { BaseInstitution } from '../models/institution.model';
import { BaseQuestion } from '../models/question.model';
import { ExamType } from '../shared/enums/exam-type.enum';
import { FormattedResponse } from '../shared/interfaces/formatted-response.interface';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';
import { Relation } from '../shared/interfaces/relation.interface';
import { CacheAcessor, Entity } from '../shared/enums/entity.enum';
import { QuestionsService } from './questions.service';
import { generateHash } from '../shared/functions/generate-hash.function';
import { BaseSubject } from '../models/subject.model';
import { AnswerableQuestionsService } from './answerable-questions.service';

@Injectable({
  providedIn: 'root',
})
export class ExamsService {
  private endpoint = `${environment.apiUrl}/exams`;
  private allAssessmentLoaded = false;
  private allMockLoaded = false;

  loadedRecords = signal(new Map<string, Exam>());
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

  totalAssessmentRecords: WritableSignal<number | undefined> =
    signal(undefined);
  totalMockRecords: WritableSignal<number | undefined> = signal(undefined);

  examQuestionsLoadedMap = signal(
    new Map<string, { total: number; allLoaded: boolean }>()
  );

  loadedRelations = signal(
    new Map<
      CacheAcessor,
      (BaseInstitution | BaseBoard | BaseQuestion | BaseSubject)[]
    >()
  );

  constructor(
    private http: HttpClient,
    private questionsService: QuestionsService,
    private answerableQuestionsService: AnswerableQuestionsService
  ) {}

  private setAllLoaded(map: Map<string, Exam>) {
    const recordsLength = Array.from(map.keys()).length;
    this.allMockLoaded = recordsLength == this.totalMockRecords();
    this.allAssessmentLoaded = recordsLength == this.totalAssessmentRecords();
  }

  serializeRecord(record: BaseExam, cacheRelations = false) {
    if (cacheRelations) {
      this.cacheRelations(record);
    }

    return new Exam(
      record.id,
      record.entityId,
      record.createdAt,
      record.updatedAt,
      record.code,
      record.name,
      record.type,
      record.questionsIds,
      record.year,
      record.boardId,
      record.institutionId
    );
  }

  cacheRelations(record: {
    board?: BaseBoard;
    institution?: BaseInstitution;
    questions?: BaseQuestion[];
    answerableQuestions?: BaseQuestion[];
  }) {
    const relationsMap = new Map<
      CacheAcessor,
      (BaseInstitution | BaseBoard | BaseQuestion)[]
    >();

    const institutionRelations: BaseInstitution[] = [];
    const boardRelations: BaseInstitution[] = [];
    const questionsRelations: BaseQuestion[] = [];
    const answerableQuestionsRelations: BaseQuestion[] = [];
    const subjectRelations: BaseSubject[] = [];

    if (record && record.institution) {
      institutionRelations.push(record.institution);
    }

    if (record && record.board) {
      boardRelations.push(record.board);
    }

    if (record && record.questions && record.questions.length) {
      record.questions.forEach((q) => {
        if (q.subject) {
          subjectRelations.push(q.subject);
        }
        if (q.institution) {
          institutionRelations.push(q.institution);
        }
        if (q.board) {
          boardRelations.push(q.board);
        }
        questionsRelations.push(q);
      });
    }

    if (
      record &&
      record.answerableQuestions &&
      record.answerableQuestions.length
    ) {
      record.answerableQuestions.forEach((q) => {
        if (q.subject) {
          subjectRelations.push(q.subject);
        }
        if (q.institution) {
          institutionRelations.push(q.institution);
        }
        if (q.board) {
          boardRelations.push(q.board);
        }
        answerableQuestionsRelations.push(q);
      });
    }

    if (institutionRelations.length) {
      relationsMap.set(Entity.INSTITUTIONS, institutionRelations);
    }

    if (boardRelations.length) {
      relationsMap.set(Entity.BOARDS, boardRelations);
    }

    if (questionsRelations.length) {
      relationsMap.set(Entity.QUESTIONS, questionsRelations);
    }

    if (answerableQuestionsRelations.length) {
      relationsMap.set('answerable_questions', answerableQuestionsRelations);
    }

    if (subjectRelations.length) {
      relationsMap.set(Entity.SUBJECTS, subjectRelations);
    }

    this.loadedRelations.set(relationsMap);
  }

  cacheRecords(records: (Exam | BaseExam)[]) {
    const serializedRecords = records.map((record) =>
      record instanceof Exam ? record : this.serializeRecord(record as BaseExam)
    );

    this.loadedRecords.update((m) => {
      m = cloneDeep(m);
      serializedRecords.map((i) => m.set(i.id, i));
      this.setAllLoaded(m);
      return m;
    });
  }

  getSummary(id: string) {
    return this.http
      .get<
        FormattedResponse<
          (BaseExam & {
            questions: { subject: { name: string }[]; total: number }[];
          })[]
        >
      >(`${this.endpoint}/summary/${id}`)
      .pipe(map((res) => (res.success && res.data ? res.data[0] : undefined)));
  }

  getOne(id: string) {
    return this.loadedRecords$.pipe(
      switchMap((loadedRecords) => {
        const loadedRecord = loadedRecords.get(id);
        if (loadedRecord) {
          return of(loadedRecord);
        }

        return this.http
          .get<FormattedResponse<BaseExam>>(`${this.endpoint}/${id}`)
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
          regex.test(r.code)
        );
        if (foundRecords && foundRecords.length) {
          return of(foundRecords);
        }

        return this.http
          .get<FormattedResponse<BaseExam[]>>(
            `${this.endpoint}/search?query=${value}`
          )
          .pipe(
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record))
                : ([] as Exam[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }

  paginate(start: number = 0, end: number, pageSize: number, type: ExamType) {
    return this.paginateLoaded$.pipe(
      switchMap((paginateLoaded) => {
        const alreadyLoadedRecords = paginateLoaded.slice(start, end);

        const loadedClause =
          type === ExamType.MOCK
            ? this.allMockLoaded
            : this.allAssessmentLoaded;

        if (loadedClause || alreadyLoadedRecords.length === end - start)
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
          .get<PaginatedResponse<BaseExam[]>>(
            `${this.endpoint}/list?start=${updatedStart}&limit=${updatedEnd}&type=${type}`
          )
          .pipe(
            tap((res) => {
              if (!res.success) return;
              if (type === ExamType.MOCK) {
                this.totalMockRecords.set(res.total);
              }
              if (type === ExamType.ASSESSMENT) {
                this.totalAssessmentRecords.set(res.total);
              }
            }),
            map((res) =>
              res.success && res.data && res.data.length
                ? res.data.map((record) => this.serializeRecord(record, true))
                : ([] as Exam[])
            ),
            tap((records) => this.cacheRecords(records))
          );
      })
    );
  }

  paginateExamAnswerableQuestions(
    examId: string,
    start: number,
    end: number,
    pageSize: number
  ) {
    const alreadyLoadedExamRecord = this.examQuestionsLoadedMap().has(examId);

    let updatedStart = start;
    let updatedEnd = end;

    let obs$: Observable<PaginatedResponse<BaseExam>> | undefined = undefined;

    if (alreadyLoadedExamRecord) {
      const alreadyLoadedAllRecords =
        this.examQuestionsLoadedMap().get(examId)?.allLoaded || false;

      if (alreadyLoadedAllRecords) {
        return this.getOne(examId).pipe(
          switchMap((exam) => {
            if (!exam) return of([]);
            return this.answerableQuestionsService.getCached(exam.questionsIds);
          }),
          map((questions) => questions.slice(start, end))
        );
      }

      obs$ = this.getOne(examId).pipe(
        switchMap((exam) => {
          if (!exam) return of([]);
          return this.answerableQuestionsService.getCached(exam.questionsIds);
        }),
        switchMap((alreadyLoadedRecords) => {
          let missingRecordsNo = 0;

          if (alreadyLoadedRecords.length) {
            missingRecordsNo = pageSize - alreadyLoadedRecords.length;
            updatedStart = alreadyLoadedRecords.length;
            updatedEnd = start + missingRecordsNo;
          }

          return this.http.get<PaginatedResponse<BaseExam>>(
            `${this.endpoint}/${examId}/questions?start=${updatedStart}&limit=${updatedEnd}`
          );
        })
      );
    }

    if (!obs$) {
      obs$ = this.http.get<PaginatedResponse<BaseExam>>(
        `${this.endpoint}/${examId}/questions?start=${start}&limit=${end}`
      );
    }

    return obs$.pipe(
      map((response) => {
        if (!response || !response.success || !response.data)
          return { total: 0, record: undefined };
        const serializedRecord = this.serializeRecord(response.data, true);

        // this.examQuestionsLoadedMap.update((m) => {
        //   m = cloneDeep(m);
        //   m.set(examId, {
        //     total: response.total,
        //     allLoaded: false,
        //   });
        //   return m;
        // });

        return { total: response.total, record: serializedRecord };
      }),
      switchMap((result) => {
        if (!result.record) return of([]);

        return this.answerableQuestionsService.getCached(
          result.record.questionsIds
        );
      }),
      tap((questions) => {
        const totals = this.examQuestionsLoadedMap().get(examId);
        if (!totals) {
          return questions.slice(updatedStart, updatedEnd);
        }
        this.examQuestionsLoadedMap.update((m) => {
          m = cloneDeep(m);
          m.set(examId, {
            ...totals,
            allLoaded: totals.total === questions.length,
          });
          return m;
        });
        return questions.slice(updatedStart, updatedEnd);
      })
    );
  }
}
