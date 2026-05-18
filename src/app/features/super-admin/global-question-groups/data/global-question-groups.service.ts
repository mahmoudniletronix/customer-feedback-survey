import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  toEditableScopeState,
  toSelectableScopeState,
} from '../../../../shared/models/resource-scope.model';
import {
  CreateGlobalQuestionGroupRequest,
  GlobalQuestionGroupApiResponse,
  GlobalQuestionGroupListItem,
  GlobalQuestionGroupSelectionApiResponse,
  GlobalQuestionGroupSelectionItem,
  GlobalQuestionGroupsFilter,
  GlobalQuestionGroupsPageApiResponse,
  GlobalQuestionGroupsPageResult,
  UpdateGlobalQuestionGroupRequest,
} from '../domain/global-question-group.model';

@Injectable()
export class GlobalQuestionGroupsService {
  private readonly http = inject(HttpClient);
  private readonly globalQuestionGroupsUrl = `${environment.apiBaseUrl}/api/global-question-groups`;

  list(query: GlobalQuestionGroupsFilter): Observable<GlobalQuestionGroupsPageResult> {
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
      .get<
        | GlobalQuestionGroupsPageApiResponse
        | readonly GlobalQuestionGroupApiResponse[]
        | GlobalQuestionGroupApiResponse
      >(this.globalQuestionGroupsUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  selection(): Observable<readonly GlobalQuestionGroupSelectionItem[]> {
    return this.http
      .get<readonly GlobalQuestionGroupSelectionApiResponse[]>(
        `${this.globalQuestionGroupsUrl}/selection`,
      )
      .pipe(
        map((response) =>
          response
            .map((group) => this.toSelectionGroup(group))
            .filter((group) => group.groupId.length > 0 && group.isGlobal && group.isSelectable),
        ),
      );
  }

  create(payload: CreateGlobalQuestionGroupRequest): Observable<GlobalQuestionGroupListItem> {
    return this.http
      .post<GlobalQuestionGroupApiResponse>(this.globalQuestionGroupsUrl, payload)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  update(
    groupId: string,
    payload: UpdateGlobalQuestionGroupRequest,
  ): Observable<GlobalQuestionGroupListItem> {
    return this.http
      .put<GlobalQuestionGroupApiResponse>(`${this.globalQuestionGroupsUrl}/${groupId}`, payload)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  delete(groupId: string): Observable<GlobalQuestionGroupListItem> {
    return this.http
      .delete<GlobalQuestionGroupApiResponse>(`${this.globalQuestionGroupsUrl}/${groupId}`)
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  restore(groupId: string): Observable<GlobalQuestionGroupListItem> {
    return this.http
      .put<GlobalQuestionGroupApiResponse>(
        `${this.globalQuestionGroupsUrl}/${groupId}/restore`,
        {},
      )
      .pipe(map((response) => this.toQuestionGroup(response)));
  }

  private toPageResult(
    response:
      | GlobalQuestionGroupsPageApiResponse
      | readonly GlobalQuestionGroupApiResponse[]
      | GlobalQuestionGroupApiResponse,
    query: GlobalQuestionGroupsFilter,
  ): GlobalQuestionGroupsPageResult {
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

  private toQuestionGroup(response: GlobalQuestionGroupApiResponse): GlobalQuestionGroupListItem {
    return {
      ...toEditableScopeState(response),
      groupId: this.readRecordId(response.groupId),
      branchId: null,
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? 0,
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toSelectionGroup(
    response: GlobalQuestionGroupSelectionApiResponse,
  ): GlobalQuestionGroupSelectionItem {
    return {
      ...toSelectableScopeState(response),
      groupId: this.readRecordId(response.id),
      branchId: null,
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
    };
  }

  private isPageResponse(
    response: GlobalQuestionGroupsPageApiResponse | GlobalQuestionGroupApiResponse,
  ): response is GlobalQuestionGroupsPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isGroupsArray(
    response:
      | GlobalQuestionGroupsPageApiResponse
      | readonly GlobalQuestionGroupApiResponse[]
      | GlobalQuestionGroupApiResponse,
  ): response is readonly GlobalQuestionGroupApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
