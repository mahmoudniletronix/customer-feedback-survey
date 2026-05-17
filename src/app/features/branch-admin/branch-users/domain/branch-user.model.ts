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
  createdOnUtc: string;
  roles: readonly BranchUserRole[];
}

export interface BranchUsersQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  isActive: boolean | null;
}

export interface BranchUsersPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly BranchUser[];
}

export interface RoleSelection {
  id: string;
  name: string;
}

export interface CreateBranchUserPayload {
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleIds: readonly string[];
}

export interface UpdateBranchUserPayload {
  nameEn: string;
  nameAr: string;
  email: string;
  phoneNumber: string;
}

export interface ResetBranchUserPasswordPayload {
  newPassword: string;
}

export interface AssignBranchUserRolesPayload {
  roleIds: readonly string[];
}

export interface CreateBranchUserResponse extends BranchUser {}

export interface AssignBranchUserRolesResponse {
  branchUserId?: string | number;
  applicationUserId?: string | number;
  branchId?: string | number;
  roles?: readonly BranchUserRoleApiResponse[];
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
  totalItems?: number;
  data?: readonly BranchUserApiResponse[];
}

export interface RoleSelectionApiResponse {
  id?: string | number;
  roleId?: string | number;
  name?: string;
}
