import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthSession, Role, User, UserType } from '../../shared/models/role.model';

const TOKEN_KEY = 'cfs_token';
const SESSION_KEY = 'cfs_session';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly document = inject(DOCUMENT);

  getToken(): string | null {
    return this.window?.localStorage.getItem(TOKEN_KEY) ?? null;
  }

  setToken(token: string): void {
    this.window?.localStorage.setItem(TOKEN_KEY, token);
  }

  getSession(): AuthSession | null {
    const rawSession = this.window?.localStorage.getItem(SESSION_KEY);

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as unknown;
        if (this.isAuthSession(parsed)) {
          return parsed;
        }
      } catch {
        return this.getSessionFromToken();
      }
    }

    return this.getSessionFromToken();
  }

  setSession(session: AuthSession): void {
    this.window?.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.setToken(session.token);
  }

  clear(): void {
    this.window?.localStorage.removeItem(TOKEN_KEY);
    this.window?.localStorage.removeItem(SESSION_KEY);
  }

  private get window(): Window | null {
    return this.document.defaultView;
  }

  private isAuthSession(value: unknown): value is AuthSession {
    if (!this.isRecord(value)) {
      return false;
    }

    const user = value['user'];
    return (
      typeof value['token'] === 'string' &&
      this.isUserType(value['userType']) &&
      Array.isArray(value['roles']) &&
      value['roles'].every((role) => typeof role === 'string') &&
      Array.isArray(value['permissions']) &&
      value['permissions'].every((permission) => typeof permission === 'string') &&
      this.isRecord(user) &&
      typeof user['id'] === 'string' &&
      typeof user['name'] === 'string' &&
      typeof user['email'] === 'string' &&
      this.isRole(user['role'])
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isRole(value: unknown): value is Role {
    return value === 'SUPER_ADMIN' || value === 'BRANCH_ADMIN' || value === 'DEPARTMENT_ADMIN';
  }

  private isUserType(value: unknown): value is UserType {
    return value === 'SuperAdmin' || value === 'BranchAdmin' || value === 'DepartmentAdmin';
  }

  private getSessionFromToken(): AuthSession | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeJwtPayload(token);
    if (!payload || this.isExpired(payload)) {
      this.clear();
      return null;
    }

    const userType = this.resolveUserType(payload);
    if (!userType) {
      return null;
    }

    const role = this.toRole(userType);
    const roles = this.readStringArray(payload, 'roles', 'role');
    const permissions = this.readStringArray(payload, 'permissions', 'permission');
    const user = this.resolveUser(payload, role);
    const session: AuthSession = {
      token,
      userType,
      roles,
      permissions,
      user
    };

    this.setSession(session);
    return session;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const payload = token.split('.')[1];
    if (!payload || !this.window) {
      return null;
    }

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = this.window.atob(padded);
      const parsed = JSON.parse(decoded) as unknown;
      return this.isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private isExpired(payload: Record<string, unknown>): boolean {
    const exp = payload['exp'];
    if (typeof exp !== 'number') {
      return false;
    }

    return exp * 1000 <= Date.now();
  }

  private resolveUserType(payload: Record<string, unknown>): UserType | null {
    const explicitUserType = payload['userType'] ?? payload['UserType'];
    if (this.isUserType(explicitUserType)) {
      return explicitUserType;
    }

    const roles = this.readStringArray(
      payload,
      'roles',
      'role',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    );

    if (roles.some((role) => role === 'System Administrator' || role === 'SuperAdmin')) {
      return 'SuperAdmin';
    }
    if (roles.some((role) => role === 'BranchAdmin' || role === 'Branch Administrator')) {
      return 'BranchAdmin';
    }
    if (roles.some((role) => role === 'DepartmentAdmin' || role === 'Department Administrator')) {
      return 'DepartmentAdmin';
    }

    return null;
  }

  private toRole(userType: UserType): Role {
    if (userType === 'SuperAdmin') {
      return 'SUPER_ADMIN';
    }
    if (userType === 'BranchAdmin') {
      return 'BRANCH_ADMIN';
    }
    return 'DEPARTMENT_ADMIN';
  }

  private resolveUser(payload: Record<string, unknown>, role: Role): User {
    const userName =
      this.readString(payload, 'name') ??
      this.readString(payload, 'unique_name') ??
      this.readString(payload, 'sub') ??
      'User';
    const email =
      this.readString(payload, 'email') ??
      this.readString(payload, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ??
      userName;

    return {
      id: this.readString(payload, 'sub') ?? email,
      name: userName,
      email,
      role,
      branchId: this.readString(payload, 'branchId') ?? this.readString(payload, 'BranchId') ?? this.readString(payload, 'branch_id') ?? undefined,
      departmentId:
        this.readString(payload, 'departmentId') ??
        this.readString(payload, 'DepartmentId') ??
        this.readString(payload, 'department_id') ??
        undefined
    };
  }

  private readString(payload: Record<string, unknown>, key: string): string | null {
    const value = payload[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private readStringArray(payload: Record<string, unknown>, ...keys: readonly string[]): readonly string[] {
    const values = keys.flatMap((key) => {
      const value = payload[key];
      if (typeof value === 'string') {
        return [value];
      }
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
      }
      return [];
    });

    return [...new Set(values)];
  }
}
