import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchAdminBranchDetails,
  BranchAdminBranchDetailsApiResponse,
  BranchAdminBranchSummary,
  BranchAdminBranchSummaryApiResponse,
  BranchAdminBranchAdmin,
  BranchAdminBranchAdminApiResponse,
  BranchAdminBranchUser,
  BranchAdminBranchUserApiResponse,
  BranchAdminDepartment,
  BranchAdminDepartmentAdmin,
  BranchAdminDepartmentAdminApiResponse,
  BranchAdminDepartmentApiResponse,
  BranchAdminQuestion,
  BranchAdminQuestionApiResponse,
  BranchAdminQuestionGroup,
  BranchAdminQuestionGroupApiResponse,
  BranchAdminTemplate,
  BranchAdminTemplateApiResponse,
  BranchAdminUserRole,
  BranchAdminUserRoleApiResponse,
} from '../models/branch-admin-branch.model';

@Injectable()
export class BranchAdminBranchService {
  private readonly http = inject(HttpClient);
  private readonly branchesUrl = `${environment.apiBaseUrl}/api/branches`;

  myBranch(): Observable<BranchAdminBranchDetails> {
    return this.http
      .get<BranchAdminBranchDetailsApiResponse>(`${this.branchesUrl}/my-branch`)
      .pipe(map((response) => this.toBranchDetails(response)));
  }

  private toBranchDetails(response: BranchAdminBranchDetailsApiResponse): BranchAdminBranchDetails {
    return {
      id: this.readRecordId(response.id),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      address: response.address ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      summary: this.toSummary(response.summary),
      branchAdmins: (response.branchAdmins ?? []).map((admin) => this.toBranchAdmin(admin)),
      departments: (response.departments ?? []).map((department) => this.toDepartment(department)),
      branchUsers: (response.branchUsers ?? []).map((user) => this.toBranchUser(user)),
      templates: (response.templates ?? []).map((template) => this.toTemplate(template)),
      questionGroups: (response.questionGroups ?? []).map((group) => this.toQuestionGroup(group)),
    };
  }

  private toSummary(
    response: BranchAdminBranchSummaryApiResponse | undefined,
  ): BranchAdminBranchSummary {
    return {
      branchAdminsCount: response?.branchAdminsCount ?? 0,
      departmentsCount: response?.departmentsCount ?? 0,
      departmentAdminsCount: response?.departmentAdminsCount ?? 0,
      branchUsersCount: response?.branchUsersCount ?? 0,
      templatesCount: response?.templatesCount ?? 0,
      questionGroupsCount: response?.questionGroupsCount ?? 0,
      questionsCount: response?.questionsCount ?? 0,
    };
  }

  private toBranchAdmin(response: BranchAdminBranchAdminApiResponse): BranchAdminBranchAdmin {
    return {
      branchAdminId: this.readRecordId(response.branchAdminId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
    };
  }

  private toDepartment(response: BranchAdminDepartmentApiResponse): BranchAdminDepartment {
    return {
      departmentId: this.readRecordId(response.departmentId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      isActive: response.isActive ?? true,
      operatorsCount: response.operatorsCount ?? 0,
      departmentAdmins: (response.departmentAdmins ?? []).map((admin) =>
        this.toDepartmentAdmin(admin),
      ),
    };
  }

  private toDepartmentAdmin(
    response: BranchAdminDepartmentAdminApiResponse,
  ): BranchAdminDepartmentAdmin {
    return {
      departmentAdminId: this.readRecordId(response.departmentAdminId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
    };
  }

  private toBranchUser(response: BranchAdminBranchUserApiResponse): BranchAdminBranchUser {
    return {
      branchUserId: this.readRecordId(response.branchUserId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      roles: (response.roles ?? []).map((role) => this.toUserRole(role)),
    };
  }

  private toUserRole(response: BranchAdminUserRoleApiResponse): BranchAdminUserRole {
    return {
      roleId: this.readRecordId(response.roleId),
      name: response.name ?? '',
    };
  }

  private toTemplate(response: BranchAdminTemplateApiResponse): BranchAdminTemplate {
    return {
      templateId: this.readRecordId(response.templateId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      status: response.status ?? '',
      questionsCount: response.questionsCount ?? 0,
    };
  }

  private toQuestionGroup(response: BranchAdminQuestionGroupApiResponse): BranchAdminQuestionGroup {
    return {
      groupId: this.readRecordId(response.groupId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      questions: (response.questions ?? []).map((question) => this.toQuestion(question)),
    };
  }

  private toQuestion(response: BranchAdminQuestionApiResponse): BranchAdminQuestion {
    return {
      questionId: this.readRecordId(response.questionId),
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type ?? '',
      isActive: response.isActive ?? true,
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
