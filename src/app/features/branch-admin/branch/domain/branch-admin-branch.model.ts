export interface BranchAdminBranchDetails {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
  isActive: boolean;
  createdOnUtc: string;
  summary: BranchAdminBranchSummary;
  branchAdmins: readonly BranchAdminBranchAdmin[];
  departments: readonly BranchAdminDepartment[];
  branchUsers: readonly BranchAdminBranchUser[];
  templates: readonly BranchAdminTemplate[];
  questionGroups: readonly BranchAdminQuestionGroup[];
}

export interface BranchAdminBranchSummary {
  branchAdminsCount: number;
  departmentsCount: number;
  departmentAdminsCount: number;
  branchUsersCount: number;
  templatesCount: number;
  questionGroupsCount: number;
  questionsCount: number;
}

export interface BranchAdminBranchAdmin {
  branchAdminId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
}

export interface BranchAdminDepartment {
  departmentId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  isActive: boolean;
  operatorsCount: number;
  departmentAdmins: readonly BranchAdminDepartmentAdmin[];
}

export interface BranchAdminDepartmentAdmin {
  departmentAdminId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
}

export interface BranchAdminBranchUser {
  branchUserId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  roles: readonly BranchAdminUserRole[];
}

export interface BranchAdminUserRole {
  roleId: string;
  name: string;
}

export interface BranchAdminTemplate {
  templateId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  status: string;
  questionsCount: number;
}

export interface BranchAdminQuestionGroup {
  groupId: string;
  nameEn: string;
  nameAr: string;
  questions: readonly BranchAdminQuestion[];
}

export interface BranchAdminQuestion {
  questionId: string;
  textEn: string;
  textAr: string;
  type: string;
  isActive: boolean;
}

export interface BranchAdminBranchDetailsApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  code?: string;
  address?: string | null;
  isActive?: boolean;
  createdOnUtc?: string;
  summary?: BranchAdminBranchSummaryApiResponse;
  branchAdmins?: readonly BranchAdminBranchAdminApiResponse[];
  departments?: readonly BranchAdminDepartmentApiResponse[];
  branchUsers?: readonly BranchAdminBranchUserApiResponse[];
  templates?: readonly BranchAdminTemplateApiResponse[];
  questionGroups?: readonly BranchAdminQuestionGroupApiResponse[];
}

export interface BranchAdminBranchSummaryApiResponse {
  branchAdminsCount?: number;
  departmentsCount?: number;
  departmentAdminsCount?: number;
  branchUsersCount?: number;
  templatesCount?: number;
  questionGroupsCount?: number;
  questionsCount?: number;
}

export interface BranchAdminBranchAdminApiResponse {
  branchAdminId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
}

export interface BranchAdminDepartmentApiResponse {
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  code?: string;
  isActive?: boolean;
  operatorsCount?: number;
  departmentAdmins?: readonly BranchAdminDepartmentAdminApiResponse[];
}

export interface BranchAdminDepartmentAdminApiResponse {
  departmentAdminId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
}

export interface BranchAdminBranchUserApiResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  roles?: readonly BranchAdminUserRoleApiResponse[];
}

export interface BranchAdminUserRoleApiResponse {
  roleId?: string | number;
  name?: string;
}

export interface BranchAdminTemplateApiResponse {
  templateId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  status?: string;
  questionsCount?: number;
}

export interface BranchAdminQuestionGroupApiResponse {
  groupId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  questions?: readonly BranchAdminQuestionApiResponse[];
}

export interface BranchAdminQuestionApiResponse {
  questionId?: string | number;
  textEn?: string;
  textAr?: string | null;
  type?: string;
  isActive?: boolean;
}
