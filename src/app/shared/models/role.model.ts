export type Role = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'DEPARTMENT_ADMIN' | 'BRANCH_USER' | 'OPERATOR';
export type UserType =
  | 'SuperAdmin'
  | 'BranchAdmin'
  | 'BranchArea'
  | 'DepartmentAdmin'
  | 'BranchUser'
  | 'Operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  branchNameEn?: string;
  branchNameAr?: string;
  departmentId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  userType: UserType;
  roles: readonly string[];
  permissions: readonly string[];
  firstLoginFlag?: boolean;
  passwordExpiredFlag?: boolean;
  passwordChangedOnUtc?: string;
  passwordExpiresOnUtc?: string;
  expiresAt?: number;
}
