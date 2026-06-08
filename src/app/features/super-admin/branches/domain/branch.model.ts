import {
  CreatedByUser,
  CreatedByUserApiResponse,
} from '../../../../shared/models/audit.model';

export interface Branch {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
  isActive: boolean;
  createdBy: CreatedByUser | null;
  createdOnUtc: string;
}

export interface BranchListQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
}

export interface BranchPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly Branch[];
}

export interface BranchSelection {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
}

export interface BranchDetails {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
  isActive: boolean;
  createdOnUtc: string;
  summary: BranchDetailsSummary;
  branchAdmins: readonly BranchDetailsBranchAdmin[];
  departments: readonly BranchDetailsDepartment[];
  branchUsers: readonly BranchDetailsBranchUser[];
  templates: readonly BranchDetailsTemplate[];
  questionGroups: readonly BranchDetailsQuestionGroup[];
}

export interface BranchDetailsSummary {
  branchAdminsCount: number;
  departmentsCount: number;
  departmentAdminsCount: number;
  branchUsersCount: number;
  templatesCount: number;
  questionGroupsCount: number;
  questionsCount: number;
}

export interface BranchDetailsBranchAdmin {
  branchAdminId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface BranchDetailsDepartment {
  departmentId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  isActive: boolean;
  operatorsCount: number;
  departmentAdmins: readonly BranchDetailsDepartmentAdmin[];
}

export interface BranchDetailsDepartmentAdmin {
  departmentAdminId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface BranchDetailsBranchUser {
  branchUserId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  roles: readonly BranchDetailsUserRole[];
}

export interface BranchDetailsUserRole {
  roleId: string;
  name: string;
}

export interface BranchDetailsTemplate {
  templateId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  status: string;
  questionsCount: number;
}

export interface BranchDetailsQuestionGroup {
  groupId: string;
  nameEn: string;
  nameAr: string;
  questions: readonly BranchDetailsQuestion[];
}

export interface BranchDetailsQuestion {
  questionId: string;
  textEn: string;
  textAr: string;
  type: string;
  isActive: boolean;
}

export interface CreateBranchPayload {
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
}

export interface UpdateBranchPayload {
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
}

export interface CreateBranchAdminPayload {
  branchId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface BranchApiResponse {
  id?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string;
  code?: string;
  address?: string;
  isActive?: boolean;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string;
}

export interface BranchesPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly BranchApiResponse[];
}

export interface BranchSelectionApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string;
  code?: string;
}

export interface BranchDetailsApiResponse extends BranchApiResponse {
  summary?: BranchDetailsSummaryApiResponse;
  branchAdmins?: readonly BranchDetailsBranchAdminApiResponse[];
  departments?: readonly BranchDetailsDepartmentApiResponse[];
  branchUsers?: readonly BranchDetailsBranchUserApiResponse[];
  templates?: readonly BranchDetailsTemplateApiResponse[];
  questionGroups?: readonly BranchDetailsQuestionGroupApiResponse[];
}

export interface BranchDetailsSummaryApiResponse {
  branchAdminsCount?: number;
  departmentsCount?: number;
  departmentAdminsCount?: number;
  branchUsersCount?: number;
  templatesCount?: number;
  questionGroupsCount?: number;
  questionsCount?: number;
}

export interface BranchDetailsBranchAdminApiResponse {
  branchAdminId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  isActive?: boolean | null;
}

export interface BranchDetailsDepartmentApiResponse {
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  code?: string;
  isActive?: boolean;
  operatorsCount?: number;
  departmentAdmins?: readonly BranchDetailsDepartmentAdminApiResponse[];
}

export interface BranchDetailsDepartmentAdminApiResponse {
  departmentAdminId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  isActive?: boolean | null;
}

export interface BranchDetailsBranchUserApiResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  roles?: readonly BranchDetailsUserRoleApiResponse[];
}

export interface BranchDetailsUserRoleApiResponse {
  roleId?: string | number;
  name?: string;
}

export interface BranchDetailsTemplateApiResponse {
  templateId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  status?: string;
  questionsCount?: number;
}

export interface BranchDetailsQuestionGroupApiResponse {
  groupId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  questions?: readonly BranchDetailsQuestionApiResponse[];
}

export interface BranchDetailsQuestionApiResponse {
  questionId?: string | number;
  textEn?: string;
  textAr?: string | null;
  type?: string;
  isActive?: boolean;
}
