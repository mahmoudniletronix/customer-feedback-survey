import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toCreatedByUser } from '../../../../shared/models/audit.model';
import {
  AssignBranchUserRolesApiResponse,
  AssignBranchUserRolesPayload,
  AssignBranchUserRolesResult,
  BranchUser,
  BranchUserApiResponse,
  BranchUserPasswordResetApiResponse,
  BranchUserPasswordResetResult,
  BranchUserRole,
  BranchUserRoleApiResponse,
  BranchUserStateChangeResult,
  BranchUsersPageApiResponse,
  BranchUsersPageResult,
  BranchUsersQuery,
  CreateBranchUserPayload,
  CreateBranchUserResponse,
  ResetBranchUserPasswordPayload,
  RoleSelection,
  RoleSelectionApiResponse,
  UpdateBranchUserPayload,
  UpdateBranchUserResponse,
} from '../domain/branch-user.model';

@Injectable()
export class BranchUsersService {
  private readonly http = inject(HttpClient);
  private readonly branchUsersUrl = `${environment.apiBaseUrl}/api/branch-users`;
  private readonly rolesSelectionUrl = `${environment.apiBaseUrl}/api/roles/selection`;
  private readonly allowedBranchUserRoles = new Set([
    'templateeditor',
    'questioneditor',
    'reportviewer',
  ]);

  list(query: BranchUsersQuery): Observable<BranchUsersPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('orderSort', query.orderSort);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    return this.http
      .get<BranchUsersPageApiResponse | readonly BranchUserApiResponse[]>(this.branchUsersUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  rolesSelection(): Observable<readonly RoleSelection[]> {
    return this.http
      .get<readonly RoleSelectionApiResponse[]>(this.rolesSelectionUrl)
      .pipe(
        map((response) =>
          response
            .map((role) => this.toRoleSelection(role))
            .filter((role) => this.isAllowedBranchUserRole(role)),
        ),
      );
  }

  create(payload: CreateBranchUserPayload): Observable<CreateBranchUserResponse> {
    return this.http
      .post<BranchUserApiResponse>(this.branchUsersUrl, payload)
      .pipe(map((response) => this.toBranchUser(response)));
  }

  update(applicationUserId: string, payload: UpdateBranchUserPayload): Observable<UpdateBranchUserResponse> {
    return this.http
      .put<BranchUserApiResponse>(`${this.branchUsersUrl}/${applicationUserId}`, payload)
      .pipe(map((response) => this.toBranchUser(response)));
  }

  delete(applicationUserId: string): Observable<BranchUserStateChangeResult> {
    return this.http
      .delete<BranchUserApiResponse>(`${this.branchUsersUrl}/${applicationUserId}`)
      .pipe(map((response) => this.toStateChange(response, applicationUserId, false)));
  }

  restore(applicationUserId: string): Observable<BranchUserStateChangeResult> {
    return this.http
      .put<BranchUserApiResponse>(`${this.branchUsersUrl}/${applicationUserId}/restore`, null)
      .pipe(map((response) => this.toStateChange(response, applicationUserId, true)));
  }

  resetPassword(
    applicationUserId: string,
    payload: ResetBranchUserPasswordPayload,
  ): Observable<BranchUserPasswordResetResult> {
    return this.http
      .put<BranchUserPasswordResetApiResponse>(
        `${this.branchUsersUrl}/${applicationUserId}/reset-password`,
        payload,
      )
      .pipe(map((response) => this.toPasswordResetResult(response, applicationUserId)));
  }

  assignRoles(
    applicationUserId: string,
    payload: AssignBranchUserRolesPayload,
  ): Observable<AssignBranchUserRolesResult> {
    return this.http
      .put<AssignBranchUserRolesApiResponse>(
        `${this.branchUsersUrl}/${applicationUserId}/roles`,
        payload,
      )
      .pipe(map((response) => this.toAssignRolesResult(response, applicationUserId)));
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
        totalPages: Math.ceil(users.length / Math.max(query.pageSize, 1)),
        totalItems: users.length,
        hasPreviousPage: query.pageNumber > 1,
        hasNextPage: false,
        data: users,
      };
    }

    const pageResponse = response as BranchUsersPageApiResponse;
    const users = (pageResponse.data ?? []).map((user: BranchUserApiResponse) => this.toBranchUser(user));
    const pageSize = pageResponse.pageSize ?? query.pageSize;
    const totalItems = pageResponse.totalItems ?? users.length;
    const totalPages = pageResponse.totalPages ?? Math.ceil(totalItems / Math.max(pageSize, 1));
    const currentPage = pageResponse.currentPage ?? query.pageNumber;

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      hasPreviousPage: pageResponse.hasPreviousPage ?? currentPage > 1,
      hasNextPage: pageResponse.hasNextPage ?? currentPage < totalPages,
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
      createdBy: toCreatedByUser(response.createdBy),
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

  private toStateChange(
    response: BranchUserApiResponse,
    fallbackApplicationUserId: string,
    fallbackIsActive: boolean,
  ): BranchUserStateChangeResult {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId) || fallbackApplicationUserId,
      branchId: this.readRecordId(response.branchId),
      isActive: response.isActive ?? fallbackIsActive,
    };
  }

  private toPasswordResetResult(
    response: BranchUserPasswordResetApiResponse,
    fallbackApplicationUserId: string,
  ): BranchUserPasswordResetResult {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId) || fallbackApplicationUserId,
      branchId: this.readRecordId(response.branchId),
      passwordReset: response.passwordReset ?? true,
    };
  }

  private toAssignRolesResult(
    response: AssignBranchUserRolesApiResponse,
    fallbackApplicationUserId: string,
  ): AssignBranchUserRolesResult {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId) || fallbackApplicationUserId,
      branchId: this.readRecordId(response.branchId),
      roles: (response.roles ?? []).map((role) => this.toBranchUserRole(role)),
    };
  }

  private toRoleSelection(response: RoleSelectionApiResponse): RoleSelection {
    return {
      id: this.readRecordId(response.id ?? response.roleId),
      name: response.name ?? '',
    };
  }

  private isAllowedBranchUserRole(role: RoleSelection): boolean {
    return role.id.length > 0 && this.allowedBranchUserRoles.has(this.normalizeRole(role.name));
  }

  private normalizeRole(role: string): string {
    return role.replace(/[\s_-]/g, '').toLowerCase();
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
