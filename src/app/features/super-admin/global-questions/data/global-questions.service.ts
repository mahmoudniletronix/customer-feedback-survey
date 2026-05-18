import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  QuestionAnswerOptionApiResponse,
  toQuestionAnswerOption,
} from '../../../../shared/models/question-answer.model';
import { toEditableScopeState } from '../../../../shared/models/resource-scope.model';
import {
  CreateGlobalQuestionRequest,
  GLOBAL_QUESTION_TYPE,
  GlobalQuestionApiResponse,
  GlobalQuestionListItem,
  GlobalQuestionType,
  GlobalQuestionsFilter,
  GlobalQuestionsPageApiResponse,
  GlobalQuestionsPageResult,
  UpdateGlobalQuestionRequest,
  toGlobalQuestionType,
} from '../domain/global-question.model';

@Injectable()
export class GlobalQuestionsService {
  private readonly http = inject(HttpClient);
  private readonly globalQuestionsUrl = `${environment.apiBaseUrl}/api/global-questions`;

  list(query: GlobalQuestionsFilter): Observable<GlobalQuestionsPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    const groupId = query.groupId.trim();
    if (groupId.length > 0) {
      params = params.set('groupId', groupId);
    }

    const orderSort = query.orderSort.trim();
    if (orderSort.length > 0) {
      params = params.set('orderSort', orderSort);
    }

    return this.http
      .get<
        | GlobalQuestionsPageApiResponse
        | readonly GlobalQuestionApiResponse[]
        | GlobalQuestionApiResponse
      >(this.globalQuestionsUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateGlobalQuestionRequest): Observable<GlobalQuestionListItem> {
    return this.http
      .post<GlobalQuestionApiResponse>(this.globalQuestionsUrl, payload)
      .pipe(map((response) => this.toGlobalQuestion(response)));
  }

  getById(questionId: string): Observable<GlobalQuestionListItem> {
    return this.http
      .get<GlobalQuestionApiResponse>(`${this.globalQuestionsUrl}/${questionId}`)
      .pipe(map((response) => this.toGlobalQuestion(response)));
  }

  update(
    questionId: string,
    payload: UpdateGlobalQuestionRequest,
  ): Observable<GlobalQuestionListItem> {
    return this.http
      .put<GlobalQuestionApiResponse>(`${this.globalQuestionsUrl}/${questionId}`, payload)
      .pipe(map((response) => this.toGlobalQuestion(response)));
  }

  delete(questionId: string): Observable<GlobalQuestionListItem> {
    return this.http
      .delete<GlobalQuestionApiResponse>(`${this.globalQuestionsUrl}/${questionId}`)
      .pipe(map((response) => this.toGlobalQuestion(response)));
  }

  restore(questionId: string): Observable<GlobalQuestionListItem> {
    return this.http
      .put<GlobalQuestionApiResponse>(`${this.globalQuestionsUrl}/${questionId}/restore`, null)
      .pipe(map((response) => this.toGlobalQuestion(response)));
  }

  private toPageResult(
    response:
      | GlobalQuestionsPageApiResponse
      | readonly GlobalQuestionApiResponse[]
      | GlobalQuestionApiResponse,
    query: GlobalQuestionsFilter,
  ): GlobalQuestionsPageResult {
    if (this.isQuestionsArray(response)) {
      const questions = response.map((question) => this.toGlobalQuestion(question));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: questions.length,
        data: questions,
      };
    }

    if (this.isPageResponse(response)) {
      const questions = (response.data ?? []).map((question) => this.toGlobalQuestion(question));
      return {
        currentPage: response.currentPage ?? query.pageNumber,
        pageSize: response.pageSize ?? query.pageSize,
        totalItems: response.totalItems ?? questions.length,
        data: questions,
      };
    }

    const question = this.toGlobalQuestion(response);
    return {
      currentPage: query.pageNumber,
      pageSize: query.pageSize,
      totalItems: question.questionId.length > 0 ? 1 : 0,
      data: question.questionId.length > 0 ? [question] : [],
    };
  }

  private toGlobalQuestion(response: GlobalQuestionApiResponse): GlobalQuestionListItem {
    const questionId = this.readRecordId(response.questionId);

    return {
      ...toEditableScopeState(response),
      questionId,
      branchId: null,
      groupId: this.readRecordId(response.groupId),
      groupBranchId: null,
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: this.readGlobalQuestionType(response.type, response.typeName),
      typeName: response.typeName ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      options: (response.options ?? []).map((option) =>
        this.toGlobalQuestionOption(option, questionId),
      ),
    };
  }

  private toGlobalQuestionOption(
    option: QuestionAnswerOptionApiResponse,
    questionId: string,
  ): ReturnType<typeof toQuestionAnswerOption> {
    return toQuestionAnswerOption(option, questionId);
  }

  private readGlobalQuestionType(
    type: number | undefined,
    typeName: string | null | undefined,
  ): GlobalQuestionType {
    return (
      toGlobalQuestionType(type) ??
      this.readGlobalQuestionTypeName(typeName) ??
      GLOBAL_QUESTION_TYPE.SingleChoice
    );
  }

  private readGlobalQuestionTypeName(
    typeName: string | null | undefined,
  ): GlobalQuestionType | null {
    const normalized =
      typeof typeName === 'string' ? typeName.replace(/[\s_-]/g, '').toLowerCase() : '';

    if (
      normalized === 'singlechoice' ||
      normalized === 'multichoice' ||
      normalized === 'multiplechoice'
    ) {
      return GLOBAL_QUESTION_TYPE.SingleChoice;
    }
    if (normalized === 'starrating' || normalized === 'rating') {
      return GLOBAL_QUESTION_TYPE.StarRating;
    }
    if (normalized === 'smiles' || normalized === 'smile') {
      return GLOBAL_QUESTION_TYPE.Smiles;
    }
    if (
      normalized === 'complain' ||
      normalized === 'complaint' ||
      normalized === 'freetext' ||
      normalized === 'textarea'
    ) {
      return GLOBAL_QUESTION_TYPE.Complain;
    }
    if (normalized === 'voice') {
      return GLOBAL_QUESTION_TYPE.Voice;
    }

    return null;
  }

  private isPageResponse(
    response: GlobalQuestionsPageApiResponse | GlobalQuestionApiResponse,
  ): response is GlobalQuestionsPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isQuestionsArray(
    response:
      | GlobalQuestionsPageApiResponse
      | readonly GlobalQuestionApiResponse[]
      | GlobalQuestionApiResponse,
  ): response is readonly GlobalQuestionApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
