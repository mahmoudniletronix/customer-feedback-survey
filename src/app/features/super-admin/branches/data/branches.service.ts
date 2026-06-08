import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toCreatedByUser } from '../../../../shared/models/audit.model';
import {
  Branch,
  BranchDetails,
  BranchDetailsApiResponse,
  BranchDetailsBranchAdmin,
  BranchDetailsBranchAdminApiResponse,
  BranchDetailsBranchUser,
  BranchDetailsBranchUserApiResponse,
  BranchDetailsDepartment,
  BranchDetailsDepartmentAdmin,
  BranchDetailsDepartmentAdminApiResponse,
  BranchDetailsDepartmentApiResponse,
  BranchDetailsQuestion,
  BranchDetailsQuestionApiResponse,
  BranchDetailsQuestionGroup,
  BranchDetailsQuestionGroupApiResponse,
  BranchDetailsSummary,
  BranchDetailsSummaryApiResponse,
  BranchDetailsTemplate,
  BranchDetailsTemplateApiResponse,
  BranchDetailsUserRole,
  BranchDetailsUserRoleApiResponse,
  BranchListQuery,
  BranchPageResult,
  BranchApiResponse,
  BranchSelection,
  BranchSelectionApiResponse,
  BranchesPageApiResponse,
  CreateBranchAdminPayload,
  CreateBranchPayload,
  UpdateBranchPayload
} from '../domain/branch.model';

@Injectable()
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly branchesUrl = `${environment.apiBaseUrl}/api/branches`;

  list(query: BranchListQuery): Observable<BranchPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    return this.http
      .get<BranchesPageApiResponse | readonly BranchApiResponse[]>(this.branchesUrl, { params })
      .pipe(map((response) => this.toBranchPageResult(response, query)));
  }

  selection(): Observable<readonly BranchSelection[]> {
    return this.http
      .get<readonly BranchSelectionApiResponse[]>(`${this.branchesUrl}/selection`)
      .pipe(
        map((response) =>
          response.map((branch) => this.toBranchSelection(branch)).filter((branch) => branch.id.length > 0)
        )
      );
  }

  details(branchId: string): Observable<BranchDetails> {
    return this.http
      .get<BranchDetailsApiResponse>(`${this.branchesUrl}/${branchId}`)
      .pipe(map((response) => this.toBranchDetails(response)));
  }

  create(payload: CreateBranchPayload): Observable<void> {
    return this.http.post<void>(this.branchesUrl, payload);
  }

  update(branchId: string, payload: UpdateBranchPayload): Observable<Branch> {
    return this.http
      .put<BranchApiResponse>(`${this.branchesUrl}/${branchId}`, payload)
      .pipe(map((response) => this.toBranch(response)));
  }

  delete(branchId: string): Observable<void> {
    return this.http.delete<void>(`${this.branchesUrl}/${branchId}`);
  }

  createBranchAdmin(payload: CreateBranchAdminPayload): Observable<void> {
    return this.http.post<void>(`${this.branchesUrl}/branch-admins-create`, payload);
  }

  private toBranch(response: BranchApiResponse): Branch {
    return {
      id: this.readId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      address: response.address ?? '',
      isActive: response.isActive ?? true,
      createdBy: toCreatedByUser(response.createdBy),
      createdOnUtc: response.createdOnUtc ?? ''
    };
  }

  private toBranchSelection(response: BranchSelectionApiResponse): BranchSelection {
    return {
      id: this.readId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? ''
    };
  }

  private toBranchDetails(response: BranchDetailsApiResponse): BranchDetails {
    return {
      id: this.readId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      address: response.address ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      summary: this.toBranchDetailsSummary(response.summary),
      branchAdmins: (response.branchAdmins ?? []).map((admin) => this.toBranchDetailsBranchAdmin(admin)),
      // Departments are optional in the latest branch details response. Keep the mapper for backward compatibility.
      departments: (response.departments ?? []).map((department) => this.toBranchDetailsDepartment(department)),
      branchUsers: (response.branchUsers ?? []).map((user) => this.toBranchDetailsBranchUser(user)),
      templates: (response.templates ?? []).map((template) => this.toBranchDetailsTemplate(template)),
      questionGroups: (response.questionGroups ?? []).map((group) => this.toBranchDetailsQuestionGroup(group))
    };
  }

  private toBranchDetailsSummary(response: BranchDetailsSummaryApiResponse | undefined): BranchDetailsSummary {
    return {
      branchAdminsCount: response?.branchAdminsCount ?? 0,
      departmentsCount: response?.departmentsCount ?? 0,
      departmentAdminsCount: response?.departmentAdminsCount ?? 0,
      branchUsersCount: response?.branchUsersCount ?? 0,
      templatesCount: response?.templatesCount ?? 0,
      questionGroupsCount: response?.questionGroupsCount ?? 0,
      questionsCount: response?.questionsCount ?? 0
    };
  }

  private toBranchDetailsBranchAdmin(response: BranchDetailsBranchAdminApiResponse): BranchDetailsBranchAdmin {
    return {
      branchAdminId: this.readRecordId(response.branchAdminId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      isActive: response.isActive ?? true
    };
  }

  private toBranchDetailsDepartment(response: BranchDetailsDepartmentApiResponse): BranchDetailsDepartment {
    return {
      departmentId: this.readRecordId(response.departmentId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      isActive: response.isActive ?? true,
      operatorsCount: response.operatorsCount ?? 0,
      departmentAdmins: (response.departmentAdmins ?? []).map((admin) =>
        this.toBranchDetailsDepartmentAdmin(admin)
      )
    };
  }

  private toBranchDetailsDepartmentAdmin(
    response: BranchDetailsDepartmentAdminApiResponse
  ): BranchDetailsDepartmentAdmin {
    return {
      departmentAdminId: this.readRecordId(response.departmentAdminId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      isActive: response.isActive ?? true
    };
  }

  private toBranchDetailsBranchUser(response: BranchDetailsBranchUserApiResponse): BranchDetailsBranchUser {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      roles: (response.roles ?? []).map((role) => this.toBranchDetailsUserRole(role))
    };
  }

  private toBranchDetailsUserRole(response: BranchDetailsUserRoleApiResponse): BranchDetailsUserRole {
    return {
      roleId: this.readRecordId(response.roleId),
      name: response.name ?? ''
    };
  }

  private toBranchDetailsTemplate(response: BranchDetailsTemplateApiResponse): BranchDetailsTemplate {
    return {
      templateId: this.readRecordId(response.templateId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      status: response.status ?? '',
      questionsCount: response.questionsCount ?? 0
    };
  }

  private toBranchDetailsQuestionGroup(
    response: BranchDetailsQuestionGroupApiResponse
  ): BranchDetailsQuestionGroup {
    return {
      groupId: this.readRecordId(response.groupId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      questions: (response.questions ?? []).map((question) => this.toBranchDetailsQuestion(question))
    };
  }

  private toBranchDetailsQuestion(response: BranchDetailsQuestionApiResponse): BranchDetailsQuestion {
    return {
      questionId: this.readRecordId(response.questionId),
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type ?? '',
      isActive: response.isActive ?? true
    };
  }

  private toBranchPageResult(
    response: BranchesPageApiResponse | readonly BranchApiResponse[],
    query: BranchListQuery
  ): BranchPageResult {
    if (Array.isArray(response)) {
      const branches = response.map((branch) => this.toBranch(branch));

      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: branches.length,
        data: branches
      };
    }

    const pageResponse = response as BranchesPageApiResponse;
    const branches = (pageResponse.data ?? []).map((branch: BranchApiResponse) => this.toBranch(branch));

    return {
      currentPage: pageResponse.currentPage ?? query.pageNumber,
      pageSize: pageResponse.pageSize ?? query.pageSize,
      totalItems: pageResponse.totalItems ?? branches.length,
      data: branches
    };
  }

  private readId(response: BranchApiResponse): string {
    const id = response.id ?? response.branchId;
    return this.readRecordId(id);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
