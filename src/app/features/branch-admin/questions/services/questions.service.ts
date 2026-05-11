import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateQuestionRequest,
  QuestionApiResponse,
  QuestionListItem,
  QuestionsFilter,
  QuestionsPageApiResponse,
  QuestionsPageResult,
  UpdateQuestionRequest,
} from '../models/question.model';

@Injectable()
export class QuestionsService {
  private readonly http = inject(HttpClient);
  private readonly questionsUrl = `${environment.apiBaseUrl}/api/questions`;

  list(query: QuestionsFilter): Observable<QuestionsPageResult> {
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

    const orderSort = query.orderSort.trim();
    if (orderSort.length > 0) {
      params = params.set('orderSort', orderSort);
    }

    return this.http
      .get<QuestionsPageApiResponse | readonly QuestionApiResponse[] | QuestionApiResponse>(this.questionsUrl, {
        params,
      })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateQuestionRequest): Observable<QuestionListItem> {
    return this.http
      .post<QuestionApiResponse>(this.questionsUrl, payload)
      .pipe(map((response) => this.toQuestion(response)));
  }

  update(questionId: string, payload: UpdateQuestionRequest): Observable<QuestionListItem> {
    return this.http
      .put<QuestionApiResponse>(`${this.questionsUrl}/${questionId}`, payload)
      .pipe(map((response) => this.toQuestion(response)));
  }

  delete(questionId: string): Observable<QuestionListItem> {
    return this.http
      .delete<QuestionApiResponse>(`${this.questionsUrl}/${questionId}`)
      .pipe(map((response) => this.toQuestion(response)));
  }

  private toPageResult(
    response: QuestionsPageApiResponse | readonly QuestionApiResponse[] | QuestionApiResponse,
    query: QuestionsFilter,
  ): QuestionsPageResult {
    if (this.isQuestionsArray(response)) {
      const questions = response.map((question) => this.toQuestion(question));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: questions.length,
        data: questions,
      };
    }

    if (this.isPageResponse(response)) {
      const questions = (response.data ?? []).map((question) => this.toQuestion(question));
      return {
        currentPage: response.currentPage ?? query.pageNumber,
        pageSize: response.pageSize ?? query.pageSize,
        totalItems: response.totalItems ?? questions.length,
        data: questions,
      };
    }

    const question = this.toQuestion(response);
    return {
      currentPage: query.pageNumber,
      pageSize: query.pageSize,
      totalItems: question.questionId.length > 0 ? 1 : 0,
      data: question.questionId.length > 0 ? [question] : [],
    };
  }

  private toQuestion(response: QuestionApiResponse): QuestionListItem {
    return {
      questionId: this.readRecordId(response.questionId),
      branchId: this.readRecordId(response.branchId),
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: response.type ?? 0,
      typeName: response.typeName ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private isPageResponse(response: QuestionsPageApiResponse | QuestionApiResponse): response is QuestionsPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isQuestionsArray(
    response: QuestionsPageApiResponse | readonly QuestionApiResponse[] | QuestionApiResponse,
  ): response is readonly QuestionApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
