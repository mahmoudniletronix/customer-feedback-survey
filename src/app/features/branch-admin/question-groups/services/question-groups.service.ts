import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateQuestionGroupRequest,
  QuestionGroupApiResponse,
  QuestionGroupListItem,
  QuestionGroupSelectionApiResponse,
  QuestionGroupSelectionItem,
  QuestionGroupsFilter,
  QuestionGroupsPageApiResponse,
  QuestionGroupsPageResult,
  UpdateQuestionGroupRequest,
} from '../models/question-group.model';

@Injectable()
export class QuestionGroupsService {
  private readonly http = inject(HttpClient);
  private readonly questionGroupsUrl = `${environment.apiBaseUrl}/api/question-groups`;
  private readonly questionGroupsSelectionUrl = `${this.questionGroupsUrl}/selection`;

  list(query: QuestionGroupsFilter): Observable<QuestionGroupsPageResult> {
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
      .get<QuestionGroupsPageApiResponse | readonly QuestionGroupApiResponse[] | QuestionGroupApiResponse>(
        this.questionGroupsUrl,
        { params },
      )
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateQuestionGroupRequest): Observable<QuestionGroupListItem> {
    return this.http
      .post<QuestionGroupApiResponse>(this.questionGroupsUrl, payload)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  selection(): Observable<readonly QuestionGroupSelectionItem[]> {
    return this.http
      .get<readonly QuestionGroupSelectionApiResponse[]>(this.questionGroupsSelectionUrl)
      .pipe(
        map((response) =>
          response
            .map((group) => this.toSelectionItem(group))
            .filter((group) => group.id.length > 0),
        ),
      );
  }

  update(groupId: string, payload: UpdateQuestionGroupRequest): Observable<QuestionGroupListItem> {
    return this.http
      .put<QuestionGroupApiResponse>(`${this.questionGroupsUrl}/${groupId}`, payload)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  delete(groupId: string): Observable<QuestionGroupListItem> {
    return this.http
      .delete<QuestionGroupApiResponse>(`${this.questionGroupsUrl}/${groupId}`)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  private toPageResult(
    response: QuestionGroupsPageApiResponse | readonly QuestionGroupApiResponse[] | QuestionGroupApiResponse,
    query: QuestionGroupsFilter,
  ): QuestionGroupsPageResult {
    if (this.isGroupsArray(response)) {
      const groups = response.map((group) => this.toQuestionGroup(group));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: groups.length,
        data: groups,
      };
    }

    if (this.isPageResponse(response)) {
      const groups = (response.data ?? []).map((group) => this.toQuestionGroup(group));
      return {
        currentPage: response.currentPage ?? query.pageNumber,
        pageSize: response.pageSize ?? query.pageSize,
        totalItems: response.totalItems ?? groups.length,
        data: groups,
      };
    }

    const group = this.toQuestionGroup(response);
    return {
      currentPage: query.pageNumber,
      pageSize: query.pageSize,
      totalItems: group.groupId.length > 0 ? 1 : 0,
      data: group.groupId.length > 0 ? [group] : [],
    };
  }

  private toQuestionGroup(response: QuestionGroupApiResponse): QuestionGroupListItem {
    return {
      groupId: this.readRecordId(response.groupId),
      branchId: this.readRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? 0,
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toSelectionItem(response: QuestionGroupSelectionApiResponse): QuestionGroupSelectionItem {
    return {
      id: this.readRecordId(response.id),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
    };
  }

  private isPageResponse(
    response: QuestionGroupsPageApiResponse | QuestionGroupApiResponse,
  ): response is QuestionGroupsPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isGroupsArray(
    response: QuestionGroupsPageApiResponse | readonly QuestionGroupApiResponse[] | QuestionGroupApiResponse,
  ): response is readonly QuestionGroupApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
