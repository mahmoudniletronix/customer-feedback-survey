import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSession, Role, User, UserType } from '../../../shared/models/role.model';
import { LoginCredentials, LoginResponse } from '../models/auth.model';

const USER_TYPE_ROLE_MAP: Record<UserType, Role> = {
  SuperAdmin: 'SUPER_ADMIN',
  BranchAdmin: 'BRANCH_ADMIN',
  DepartmentAdmin: 'DEPARTMENT_ADMIN',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = `${environment.apiBaseUrl}/api/auth/login`;

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials).pipe(
      map((response) => this.toSession(response, credentials.userNameOrEmail)),
      catchError(() => throwError(() => new Error('auth.invalidCredentials'))),
    );
  }

  private toSession(response: LoginResponse, userNameOrEmail: string): AuthSession {
    const userType = this.resolveUserType(response);
    const role = USER_TYPE_ROLE_MAP[userType];
    const user: User = {
      id: userNameOrEmail,
      name: this.displayName(userNameOrEmail),
      email: userNameOrEmail,
      role,
    };

    return {
      token: response.token,
      userType,
      roles: response.roles,
      permissions: response.permissions,
      user,
    };
  }

  private resolveUserType(response: LoginResponse): UserType {
    if (this.isUserType(response.userType)) {
      return response.userType;
    }

    if (response.roles.includes('System Administrator')) {
      return 'SuperAdmin';
    }

    if (response.permissions.some((permission) => permission.startsWith('BranchAdmins.'))) {
      return 'BranchAdmin';
    }

    return 'DepartmentAdmin';
  }

  private isUserType(value: unknown): value is UserType {
    return value === 'SuperAdmin' || value === 'BranchAdmin' || value === 'DepartmentAdmin';
  }

  private displayName(userNameOrEmail: string): string {
    return userNameOrEmail.includes('@') ? userNameOrEmail.split('@')[0] : userNameOrEmail;
  }
}
