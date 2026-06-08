import { AuthSession, UserType } from '../../../shared/models/role.model';

export interface LoginCredentials {
  userNameOrEmail: string;
  password: string;
}

export interface LoginBranchSelection {
  id: string;
  nameEn: string;
  nameAr: string | null;
  code: string;
}

export interface LoginResponse {
  token: string;
  applicationUserId?: string | null;
  userType?: UserType | string;
  requiresBranchSelection?: boolean;
  firstLoginFlag?: boolean;
  passwordExpiredFlag?: boolean;
  passwordChangedOnUtc?: string | null;
  passwordExpiresOnUtc?: string | null;
  activeBranchId?: string | null;
  roles?: readonly string[];
  permissions?: readonly string[];
  branchId?: string;
  branchName?: string;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branches?: readonly LoginBranchSelectionApiResponse[];
  selectedBranch?: LoginBranchSelectionApiResponse | null;
}

export interface LoginBranchSelectionApiResponse {
  id?: string | number;
  branchId?: string | number;
  nameEn?: string | null;
  nameAr?: string | null;
  branchNameEn?: string | null;
  branchNameAr?: string | null;
  code?: string | null;
  branchCode?: string | null;
}

export interface AuthenticatedLoginResult {
  kind: 'authenticated';
  session: AuthSession;
}

export interface BranchSelectionLoginResult {
  kind: 'branch-selection-required';
  token: string;
  userType: 'BranchArea';
  userNameOrEmail: string;
  branches: readonly LoginBranchSelection[];
}

export interface PasswordChangeRequiredLoginResult {
  kind: 'password-change-required';
  session: AuthSession;
  branchSelection: BranchSelectionLoginResult | null;
}

export type AuthLoginResult =
  | AuthenticatedLoginResult
  | BranchSelectionLoginResult
  | PasswordChangeRequiredLoginResult;

export interface ChangePasswordRequest {
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  applicationUserId?: string | null;
  passwordChanged?: boolean;
  firstLoginFlag?: boolean;
  passwordExpiredFlag?: boolean;
  passwordChangedOnUtc?: string | null;
  passwordExpiresOnUtc?: string | null;
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
