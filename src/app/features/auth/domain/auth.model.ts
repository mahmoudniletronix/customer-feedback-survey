import { UserType } from '../../../shared/models/role.model';

export interface LoginCredentials {
  userNameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userType?: UserType | string;
  roles?: readonly string[];
  permissions?: readonly string[];
  branchId?: string;
  branchName?: string;
  branchNameEn?: string;
  branchNameAr?: string | null;
}

export interface BranchUserRoleResponse {
  roleId?: string;
  name?: string;
}

export interface BranchUserMyRolesResponse {
  applicationUserId?: string;
  branchUserId?: string;
  branchId?: string;
  branchNameEn?: string;
  branchNameAr?: string | null;
  roles?: readonly BranchUserRoleResponse[];
}
