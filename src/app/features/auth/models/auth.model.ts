import { UserType } from '../../../shared/models/role.model';

export interface LoginCredentials {
  userNameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userType?: UserType | string;
  roles: readonly string[];
  permissions: readonly string[];
}
