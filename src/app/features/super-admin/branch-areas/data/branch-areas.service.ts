import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  AssignBranchAreaBranchesApiResponse,
  AssignBranchAreaBranchesPayload,
  AssignBranchAreaBranchesResult,
  BranchAreaBranch,
  BranchAreaBranchApiResponse,
  BranchAreaDetails,
  BranchAreaDetailsApiResponse,
  BranchAreaListItem,
  BranchAreaListItemApiResponse,
  BranchAreaListQuery,
  BranchAreasPageApiResponse,
  BranchAreasPageResult,
  CreateBranchAreaApiResponse,
  CreateBranchAreaPayload,
  DeactivateBranchAreaApiResponse,
  DeactivateBranchAreaResult,
  RestoreBranchAreaApiResponse,
  RestoreBranchAreaResult,
  UpdateBranchAreaApiResponse,
  UpdateBranchAreaPayload,
} from '../domain/branch-area.model';

@Injectable()
export class BranchAreasService {
  private readonly http = inject(HttpClient);
  private readonly branchAreasUrl = `${environment.apiBaseUrl}/api/branch-areas`;
  private readonly branchesSelectionUrl = `${environment.apiBaseUrl}/api/branches/selection`;

  list(query: BranchAreaListQuery): Observable<BranchAreasPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('orderSort', query.orderSort);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    return this.http
      .get<BranchAreasPageApiResponse>(this.branchAreasUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  details(branchAreaId: string): Observable<BranchAreaDetails> {
    return this.http
      .get<BranchAreaDetailsApiResponse>(
        `${this.branchAreasUrl}/${encodeURIComponent(branchAreaId)}`,
      )
      .pipe(map((response) => this.toDetails(response)));
  }

  selection(): Observable<readonly BranchAreaBranch[]> {
    return this.http
      .get<readonly BranchAreaBranchApiResponse[]>(this.branchesSelectionUrl)
      .pipe(
        map((response) =>
          response.map((branch) => this.toBranch(branch)).filter((branch) => branch.id.length > 0),
        ),
      );
  }

  create(payload: CreateBranchAreaPayload): Observable<BranchAreaDetails> {
    return this.http
      .post<CreateBranchAreaApiResponse>(this.branchAreasUrl, payload)
      .pipe(map((response) => this.toDetails(response)));
  }

  update(branchAreaId: string, payload: UpdateBranchAreaPayload): Observable<BranchAreaListItem> {
    return this.http
      .put<UpdateBranchAreaApiResponse>(
        `${this.branchAreasUrl}/${encodeURIComponent(branchAreaId)}`,
        payload,
      )
      .pipe(map((response) => this.toListItem(response)));
  }

  assignBranches(
    branchAreaId: string,
    payload: AssignBranchAreaBranchesPayload,
  ): Observable<AssignBranchAreaBranchesResult> {
    return this.http
      .put<AssignBranchAreaBranchesApiResponse>(
        `${this.branchAreasUrl}/${encodeURIComponent(branchAreaId)}/branches`,
        payload,
      )
      .pipe(map((response) => this.toAssignBranchesResult(response)));
  }

  deactivate(branchAreaId: string): Observable<DeactivateBranchAreaResult> {
    return this.http
      .delete<DeactivateBranchAreaApiResponse>(
        `${this.branchAreasUrl}/${encodeURIComponent(branchAreaId)}`,
      )
      .pipe(map((response) => this.toDeactivateResult(response)));
  }

  restore(branchAreaId: string): Observable<RestoreBranchAreaResult> {
    return this.http
      .put<RestoreBranchAreaApiResponse>(
        `${this.branchAreasUrl}/${encodeURIComponent(branchAreaId)}/restore`,
        null,
      )
      .pipe(map((response) => this.toRestoreResult(response)));
  }

  private toPageResult(
    response: BranchAreasPageApiResponse,
    query: BranchAreaListQuery,
  ): BranchAreasPageResult {
    const pageSize = response.pageSize ?? query.pageSize;
    const totalItems = response.totalItems ?? 0;
    const totalPages = response.totalPages ?? Math.ceil(totalItems / Math.max(pageSize, 1));
    const currentPage = response.currentPage ?? query.pageNumber;

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      hasPreviousPage: response.hasPreviousPage ?? currentPage > 1,
      hasNextPage: response.hasNextPage ?? currentPage < totalPages,
      data: (response.data ?? []).map((item) => this.toListItem(item)),
    };
  }

  private toListItem(response: BranchAreaListItemApiResponse): BranchAreaListItem {
    return {
      branchAreaId: this.readRecordId(response.branchAreaId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? null,
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      branches: (response.branches ?? [])
        .map((branch) => this.toBranch(branch))
        .filter((branch) => branch.id.length > 0),
    };
  }

  private toDetails(response: BranchAreaDetailsApiResponse): BranchAreaDetails {
    return this.toListItem(response);
  }

  private toDeactivateResult(response: DeactivateBranchAreaApiResponse): DeactivateBranchAreaResult {
    return {
      branchAreaId: this.readRecordId(response.branchAreaId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      isActive: response.isActive ?? false,
    };
  }

  private toRestoreResult(response: RestoreBranchAreaApiResponse): RestoreBranchAreaResult {
    return {
      branchAreaId: this.readRecordId(response.branchAreaId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      isActive: response.isActive ?? true,
    };
  }

  private toAssignBranchesResult(
    response: AssignBranchAreaBranchesApiResponse,
  ): AssignBranchAreaBranchesResult {
    return {
      branchAreaId: this.readRecordId(response.branchAreaId),
      branches: (response.branches ?? [])
        .map((branch) => this.toBranch(branch))
        .filter((branch) => branch.id.length > 0),
    };
  }

  private toBranch(response: BranchAreaBranchApiResponse): BranchAreaBranch {
    return {
      id: this.readRecordId(response.id ?? response.branchId),
      nameEn: response.nameEn ?? response.branchNameEn ?? '',
      nameAr: response.nameAr ?? response.branchNameAr ?? null,
      code: response.code ?? response.branchCode ?? '',
    };
  }

  private readRecordId(value: string | number | null | undefined): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
