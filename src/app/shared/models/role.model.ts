export type Role = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'DEPARTMENT_ADMIN';
export type UserType = 'SuperAdmin' | 'BranchAdmin' | 'DepartmentAdmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  departmentId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  userType: UserType;
  roles: readonly string[];
  permissions: readonly string[];
}
