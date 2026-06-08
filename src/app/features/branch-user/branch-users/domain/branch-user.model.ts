import { CreatedByUser, CreatedByUserApiResponse } from '../../../../shared/models/audit.model';

export type BranchUsersOrderSort = 'Newest' | 'Oldest';

export interface BranchUserRole {
  roleId: string;
  name: string;
}

export interface BranchUser {
  branchUserId: string;
  applicationUserId: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdBy: CreatedByUser | null;
  createdOnUtc: string;
  roles: readonly BranchUserRole[];
}

export interface BranchUsersQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  orderSort: BranchUsersOrderSort;
}

export interface BranchUsersPageResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: readonly BranchUser[];
}

export interface RoleSelection {
  id: string;
  name: string;
}

export interface CreateBranchUserPayload {
  nameEn: string;
  nameAr: string | null;
  userName: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  roleIds: readonly string[];
}

export interface UpdateBranchUserPayload {
  nameEn: string;
  nameAr: string | null;
  email: string;
  phoneNumber: string | null;
}

export interface ResetBranchUserPasswordPayload {
  newPassword: string;
}

export interface AssignBranchUserRolesPayload {
  roleIds: readonly string[];
}

export interface CreateBranchUserResponse extends BranchUser {}

export interface UpdateBranchUserResponse extends BranchUser {}

export interface BranchUserStateChangeResult {
  branchUserId: string;
  applicationUserId: string;
  branchId: string;
  isActive: boolean;
}

export interface BranchUserPasswordResetResult {
  branchUserId: string;
  applicationUserId: string;
  branchId: string;
  passwordReset: boolean;
}

export interface AssignBranchUserRolesResult {
  branchUserId: string;
  applicationUserId: string;
  branchId: string;
  roles: readonly BranchUserRole[];
}

export interface AssignBranchUserRolesApiResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  branchId?: string | number;
  roles?: readonly BranchUserRoleApiResponse[];
}

export interface BranchUserPasswordResetApiResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  branchId?: string | number;
  passwordReset?: boolean;
}

export interface BranchUserApiResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  isActive?: boolean;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string;
  roles?: readonly BranchUserRoleApiResponse[];
}

export interface BranchUserRoleApiResponse {
  roleId?: string | number;
  id?: string | number;
  name?: string;
}

export interface BranchUsersPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  data?: readonly BranchUserApiResponse[];
}

export interface RoleSelectionApiResponse {
  id?: string | number;
  roleId?: string | number;
  name?: string;
}
