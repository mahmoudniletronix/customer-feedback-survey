import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSession, Role, User, UserType } from '../../../shared/models/role.model';
import { BranchUserMyRolesResponse, LoginCredentials, LoginResponse } from '../models/auth.model';

const USER_TYPE_ROLE_MAP: Record<UserType, Role> = {
  SuperAdmin: 'SUPER_ADMIN',
  BranchAdmin: 'BRANCH_ADMIN',
  DepartmentAdmin: 'DEPARTMENT_ADMIN',
  BranchUser: 'BRANCH_USER',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = `${environment.apiBaseUrl}/api/auth/login`;
  private readonly branchUserMyRolesUrl = `${environment.apiBaseUrl}/api/branch-users/my-roles`;

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials).pipe(
      switchMap((response) => this.resolveBranchUserRoles(response)),
      map(({ response, branchUserRoles }) => this.toSession(response, credentials.userNameOrEmail, branchUserRoles)),
      catchError(() => throwError(() => new Error('auth.invalidCredentials'))),
    );
  }

  private resolveBranchUserRoles(
    response: LoginResponse,
  ): Observable<{ response: LoginResponse; branchUserRoles: BranchUserMyRolesResponse | null }> {
    const userType = this.resolveUserType(response);
    if (userType !== 'BranchUser') {
      return new Observable((subscriber) => {
        subscriber.next({ response, branchUserRoles: null });
        subscriber.complete();
      });
    }

    return this.http
      .get<BranchUserMyRolesResponse>(this.branchUserMyRolesUrl, {
        headers: new HttpHeaders({ Authorization: `Bearer ${response.token}` }),
      })
      .pipe(map((branchUserRoles) => ({ response, branchUserRoles })));
  }

  private toSession(
    response: LoginResponse,
    userNameOrEmail: string,
    branchUserRoles: BranchUserMyRolesResponse | null,
  ): AuthSession {
    const userType = this.resolveUserType(response);
    const role = USER_TYPE_ROLE_MAP[userType];
    const tokenPayload = this.decodeJwtPayload(response.token);
    const user: User = {
      id: branchUserRoles?.applicationUserId ?? this.readString(tokenPayload, 'sub') ?? userNameOrEmail,
      name: this.readString(tokenPayload, 'name') ?? this.displayName(userNameOrEmail),
      email: this.readString(tokenPayload, 'email') ?? userNameOrEmail,
      role,
      branchId:
        branchUserRoles?.branchId ??
        this.readString(tokenPayload, 'branchId') ??
        this.readString(tokenPayload, 'BranchId') ??
        this.readString(tokenPayload, 'branch_id') ??
        undefined,
      departmentId:
        this.readString(tokenPayload, 'departmentId') ??
        this.readString(tokenPayload, 'DepartmentId') ??
        this.readString(tokenPayload, 'department_id') ??
        undefined,
    };

    return {
      token: response.token,
      userType,
      roles: this.resolveApiRoles(response, branchUserRoles),
      permissions: response.permissions ?? [],
      user,
    };
  }

  private resolveUserType(response: LoginResponse): UserType {
    if (this.isUserType(response.userType)) {
      return response.userType;
    }

    const roles = response.roles ?? [];
    const permissions = response.permissions ?? [];

    if (roles.includes('System Administrator')) {
      return 'SuperAdmin';
    }

    if (permissions.some((permission) => permission.startsWith('BranchAdmins.'))) {
      return 'BranchAdmin';
    }

    return 'DepartmentAdmin';
  }

  private isUserType(value: unknown): value is UserType {
    return value === 'SuperAdmin' || value === 'BranchAdmin' || value === 'DepartmentAdmin' || value === 'BranchUser';
  }

  private resolveApiRoles(
    response: LoginResponse,
    branchUserRoles: BranchUserMyRolesResponse | null,
  ): readonly string[] {
    const responseRoles = response.roles ?? [];
    const assignedRoles = branchUserRoles?.roles?.map((role) => role.name ?? '').filter((role) => role.length > 0) ?? [];
    return [...new Set([...responseRoles, ...assignedRoles])];
  }

  private displayName(userNameOrEmail: string): string {
    return userNameOrEmail.includes('@') ? userNameOrEmail.split('@')[0] : userNameOrEmail;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = globalThis.atob(padded);
      const parsed = JSON.parse(decoded) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private readString(payload: Record<string, unknown> | null, key: string): string | null {
    const value = payload?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
