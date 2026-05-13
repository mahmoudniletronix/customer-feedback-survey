import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  AssignBranchUserRolesPayload,
  AssignBranchUserRolesResponse,
  BranchUser,
  BranchUserApiResponse,
  BranchUserRole,
  BranchUserRoleApiResponse,
  BranchUsersPageApiResponse,
  BranchUsersPageResult,
  BranchUsersQuery,
  CreateBranchUserPayload,
  CreateBranchUserResponse,
  ResetBranchUserPasswordPayload,
  RoleSelection,
  RoleSelectionApiResponse,
  UpdateBranchUserPayload,
} from '../models/branch-user.model';

@Injectable()
export class BranchUsersService {
  private readonly http = inject(HttpClient);
  private readonly branchUsersUrl = `${environment.apiBaseUrl}/api/branch-users`;
  private readonly rolesSelectionUrl = `${environment.apiBaseUrl}/api/roles/selection`;

  list(query: BranchUsersQuery): Observable<BranchUsersPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return this.http
      .get<BranchUsersPageApiResponse | readonly BranchUserApiResponse[]>(this.branchUsersUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  rolesSelection(): Observable<readonly RoleSelection[]> {
    return this.http
      .get<readonly RoleSelectionApiResponse[]>(this.rolesSelectionUrl)
      .pipe(map((response) => response.map((role) => this.toRoleSelection(role)).filter((role) => role.id.length > 0)));
  }

  create(payload: CreateBranchUserPayload): Observable<CreateBranchUserResponse> {
    return this.http
      .post<BranchUserApiResponse>(this.branchUsersUrl, payload)
      .pipe(map((response) => this.toBranchUser(response)));
  }

  update(applicationUserId: string, payload: UpdateBranchUserPayload): Observable<void> {
    return this.http.put<void>(`${this.branchUsersUrl}/${applicationUserId}`, payload);
  }

  delete(applicationUserId: string): Observable<void> {
    return this.http.delete<void>(`${this.branchUsersUrl}/${applicationUserId}`);
  }

  restore(applicationUserId: string): Observable<void> {
    return this.http.put<void>(`${this.branchUsersUrl}/${applicationUserId}/restore`, {});
  }

  resetPassword(applicationUserId: string, payload: ResetBranchUserPasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.branchUsersUrl}/${applicationUserId}/reset-password`, payload);
  }

  assignRoles(applicationUserId: string, payload: AssignBranchUserRolesPayload): Observable<AssignBranchUserRolesResponse> {
    return this.http.put<AssignBranchUserRolesResponse>(`${this.branchUsersUrl}/${applicationUserId}/roles`, payload);
  }

  private toPageResult(
    response: BranchUsersPageApiResponse | readonly BranchUserApiResponse[],
    query: BranchUsersQuery
  ): BranchUsersPageResult {
    if (Array.isArray(response)) {
      const users = response.map((user) => this.toBranchUser(user));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: users.length,
        data: users,
      };
    }

    const pageResponse = response as BranchUsersPageApiResponse;
    const users = (pageResponse.data ?? []).map((user: BranchUserApiResponse) => this.toBranchUser(user));
    return {
      currentPage: pageResponse.currentPage ?? query.pageNumber,
      pageSize: pageResponse.pageSize ?? query.pageSize,
      totalItems: pageResponse.totalItems ?? users.length,
      data: users,
    };
  }

  private toBranchUser(response: BranchUserApiResponse): BranchUser {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      branchId: this.readRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      roles: (response.roles ?? []).map((role) => this.toBranchUserRole(role)),
    };
  }

  private toBranchUserRole(response: BranchUserRoleApiResponse): BranchUserRole {
    return {
      roleId: this.readRecordId(response.roleId ?? response.id),
      name: response.name ?? '',
    };
  }

  private toRoleSelection(response: RoleSelectionApiResponse): RoleSelection {
    return {
      id: this.readRecordId(response.id ?? response.roleId),
      name: response.name ?? '',
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
