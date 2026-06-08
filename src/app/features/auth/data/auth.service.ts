import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SKIP_AUTH } from '../../../core/interceptors/auth.interceptor';
import { AuthSession, Role, User, UserType } from '../../../shared/models/role.model';
import {
  AuthLoginResult,
  BranchUserMyRolesResponse,
  BranchSelectionLoginResult,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginBranchSelection,
  LoginBranchSelectionApiResponse,
  LoginCredentials,
  LoginResponse,
} from '../domain/auth.model';

const USER_TYPE_ROLE_MAP: Record<UserType, Role> = {
  SuperAdmin: 'SUPER_ADMIN',
  BranchAdmin: 'BRANCH_ADMIN',
  BranchArea: 'BRANCH_ADMIN',
  DepartmentAdmin: 'DEPARTMENT_ADMIN',
  BranchUser: 'BRANCH_USER',
  Operator: 'OPERATOR',
};

const AUTH_ERROR_KEYS: Record<string, string> = {
  'Auth.Login.InvalidCredentials': 'auth.invalidCredentials',
  'Auth.Login.UserHasNoRoles': 'auth.userHasNoRoles',
  'Auth.Login.BranchAreaProfileNotFound': 'auth.branchAreaProfileNotFound',
  'Auth.Login.BranchAreaNoBranchesAssigned': 'auth.branchAreaNoBranchesAssigned',
  'Validation.SelectBranch_BranchId_Required': 'auth.selectBranchBranchIdRequired',
  'Auth.SelectBranch.Unauthenticated': 'auth.selectBranchTokenMissing',
  'Auth.SelectBranch.CurrentUserNotBranchArea': 'auth.selectBranchCurrentUserNotBranchArea',
  'Auth.SelectBranch.BranchAreaProfileNotFound': 'auth.branchAreaProfileNotFound',
  'Auth.SelectBranch.BranchAreaNoBranchesAssigned': 'auth.branchAreaNoBranchesAssigned',
  'Auth.SelectBranch.BranchNotFound': 'auth.selectBranchNotFound',
  'Auth.SelectBranch.SelectedBranchNotAllowed': 'auth.selectBranchNotAllowed',
  'Auth.TokenMissing': 'auth.tokenMissing',
  'ChangePassword.UserIdMismatch': 'auth.changePasswordUserIdMismatch',
  'ChangePassword.UserNotFound': 'auth.changePasswordUserNotFound',
  'ChangePassword.UserInactive': 'auth.changePasswordUserInactive',
  'ChangePassword_NewPassword_Required': 'auth.changePasswordNewPasswordRequired',
  'ChangePassword_ConfirmNewPassword_Required': 'auth.changePasswordConfirmPasswordRequired',
  'ChangePassword_ConfirmNewPassword_NotMatched': 'auth.changePasswordConfirmPasswordNotMatched',
  'ChangePassword_NewPassword_MinLength': 'auth.changePasswordNewPasswordMinLength',
  'ChangePassword_NewPassword_MaxLength': 'auth.changePasswordNewPasswordMaxLength',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = `${environment.apiBaseUrl}/api/auth/login`;
  private readonly selectBranchUrl = `${environment.apiBaseUrl}/api/auth/select-branch`;
  private readonly branchUserMyRolesUrl = `${environment.apiBaseUrl}/api/branch-users/my-roles`;
  private readonly usersUrl = `${environment.apiBaseUrl}/api/auth/users`;

  login(credentials: LoginCredentials): Observable<AuthLoginResult> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials, {
      context: new HttpContext().set(SKIP_AUTH, true),
    }).pipe(
      switchMap((response) => {
        const branchSelection =
          response.requiresBranchSelection === true
            ? this.toBranchSelectionResult(response, credentials.userNameOrEmail)
            : null;

        if (this.requiresPasswordChange(response)) {
          return of({
            kind: 'password-change-required' as const,
            session: this.toSession(response, credentials.userNameOrEmail, null),
            branchSelection,
          });
        }

        if (branchSelection) {
          return of(branchSelection);
        }

        return this.resolveBranchUserRoles(response).pipe(
          map(({ response: loginResponse, branchUserRoles }) => ({
            kind: 'authenticated' as const,
            session: this.toSession(loginResponse, credentials.userNameOrEmail, branchUserRoles),
          })),
        );
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(this.resolveAuthErrorKey(error, 'auth.invalidCredentials'))),
      ),
    );
  }

  changePassword(
    applicationUserId: string,
    token: string,
    request: ChangePasswordRequest,
  ): Observable<ChangePasswordResponse> {
    return this.http
      .put<ChangePasswordResponse>(
        `${this.usersUrl}/${encodeURIComponent(applicationUserId)}/change-password`,
        request,
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() =>
            new Error(this.resolveAuthErrorKey(error, 'auth.changePasswordError')),
          ),
        ),
      );
  }

  selectBranch(
    token: string,
    branch: LoginBranchSelection,
    userNameOrEmail: string,
  ): Observable<AuthSession> {
    return this.http
      .post<LoginResponse>(
        this.selectBranchUrl,
        { branchId: branch.id },
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
      )
      .pipe(
        map((response) =>
          this.toSession(
            response,
            userNameOrEmail,
            null,
            this.resolveSelectedBranch(response, branch),
          ),
        ),
        catchError((error: unknown) =>
          throwError(() => new Error(this.resolveAuthErrorKey(error, 'auth.selectBranchError'))),
        ),
      );
  }

  private resolveBranchUserRoles(
    response: LoginResponse,
  ): Observable<{ response: LoginResponse; branchUserRoles: BranchUserMyRolesResponse | null }> {
    const userType = this.resolveUserType(response);
    if (userType !== 'BranchUser') {
      return of({ response, branchUserRoles: null });
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
    selectedBranch: LoginBranchSelection | null = null,
  ): AuthSession {
    const userType = this.resolveUserType(response);
    const role = USER_TYPE_ROLE_MAP[userType];
    const tokenPayload = this.decodeJwtPayload(response.token);
    const user: User = {
      id: this.resolveApplicationUserId(response, tokenPayload, branchUserRoles, userNameOrEmail),
      name: this.readString(tokenPayload, 'name') ?? this.displayName(userNameOrEmail),
      email: this.readString(tokenPayload, 'email') ?? userNameOrEmail,
      role,
      branchId:
        branchUserRoles?.branchId ??
        this.toNonEmptyString(response.activeBranchId) ??
        this.toNonEmptyString(response.branchId) ??
        this.readString(tokenPayload, 'branchId') ??
        this.readString(tokenPayload, 'BranchId') ??
        this.readString(tokenPayload, 'activeBranchId') ??
        this.readString(tokenPayload, 'ActiveBranchId') ??
        this.readString(tokenPayload, 'branch_id') ??
        this.toNonEmptyString(selectedBranch?.id) ??
        undefined,
      branchNameEn: this.resolveBranchNameEn(
        response,
        tokenPayload,
        branchUserRoles,
        selectedBranch,
      ),
      branchNameAr: this.resolveBranchNameAr(
        response,
        tokenPayload,
        branchUserRoles,
        selectedBranch,
      ),
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
      permissions: this.resolvePermissions(response, tokenPayload),
      user,
      firstLoginFlag: this.resolveBoolean(
        response.firstLoginFlag,
        tokenPayload,
        'firstLoginFlag',
        'FirstLoginFlag',
      ),
      passwordExpiredFlag: this.resolveBoolean(
        response.passwordExpiredFlag,
        tokenPayload,
        'passwordExpiredFlag',
        'PasswordExpiredFlag',
      ),
      passwordChangedOnUtc: this.resolveOptionalString(
        response.passwordChangedOnUtc,
        tokenPayload,
        'passwordChangedOnUtc',
        'PasswordChangedOnUtc',
      ),
      passwordExpiresOnUtc: this.resolveOptionalString(
        response.passwordExpiresOnUtc,
        tokenPayload,
        'passwordExpiresOnUtc',
        'PasswordExpiresOnUtc',
      ),
    };
  }

  private resolveApplicationUserId(
    response: LoginResponse,
    tokenPayload: Record<string, unknown> | null,
    branchUserRoles: BranchUserMyRolesResponse | null,
    fallbackUserNameOrEmail: string,
  ): string {
    return (
      this.toNonEmptyString(response.applicationUserId) ??
      this.toNonEmptyString(branchUserRoles?.applicationUserId) ??
      this.readString(tokenPayload, 'applicationUserId') ??
      this.readString(tokenPayload, 'ApplicationUserId') ??
      this.readString(tokenPayload, 'application_user_id') ??
      this.readString(tokenPayload, 'userId') ??
      this.readString(tokenPayload, 'UserId') ??
      this.readString(tokenPayload, 'sub') ??
      fallbackUserNameOrEmail
    );
  }

  private requiresPasswordChange(response: LoginResponse): boolean {
    const tokenPayload = this.decodeJwtPayload(response.token);
    return (
      this.resolveBoolean(response.firstLoginFlag, tokenPayload, 'firstLoginFlag', 'FirstLoginFlag') ||
      this.resolveBoolean(
        response.passwordExpiredFlag,
        tokenPayload,
        'passwordExpiredFlag',
        'PasswordExpiredFlag',
      )
    );
  }

  private resolveBoolean(
    responseValue: unknown,
    tokenPayload: Record<string, unknown> | null,
    ...claimKeys: readonly string[]
  ): boolean {
    return this.toBoolean(responseValue) ?? this.readBoolean(tokenPayload, ...claimKeys) ?? false;
  }

  private resolveOptionalString(
    responseValue: string | null | undefined,
    tokenPayload: Record<string, unknown> | null,
    ...claimKeys: readonly string[]
  ): string | undefined {
    return (
      this.toNonEmptyString(responseValue) ??
      claimKeys
        .map((key) => this.readString(tokenPayload, key))
        .find((value): value is string => value !== null) ??
      undefined
    );
  }

  private resolveUserType(response: LoginResponse): UserType {
    if (this.isUserType(response.userType)) {
      return response.userType;
    }

    if (response.requiresBranchSelection === true) {
      return 'BranchArea';
    }

    const roles = response.roles ?? [];
    const tokenPayload = this.decodeJwtPayload(response.token);
    const permissions = this.resolvePermissions(response, tokenPayload);

    if (roles.some((role) => this.normalizeRole(role) === 'systemadministrator')) {
      return 'SuperAdmin';
    }

    if (roles.some((role) => this.normalizeRole(role) === 'brancharea')) {
      return 'BranchArea';
    }

    if (permissions.some((permission) => permission.startsWith('BranchAdmins.'))) {
      return 'BranchAdmin';
    }

    if (roles.some((role) => this.normalizeRole(role).includes('operator'))) {
      return 'Operator';
    }

    return 'DepartmentAdmin';
  }

  private isUserType(value: unknown): value is UserType {
    return (
      value === 'SuperAdmin' ||
      value === 'BranchAdmin' ||
      value === 'BranchArea' ||
      value === 'DepartmentAdmin' ||
      value === 'BranchUser' ||
      value === 'Operator'
    );
  }

  private resolveApiRoles(
    response: LoginResponse,
    branchUserRoles: BranchUserMyRolesResponse | null,
  ): readonly string[] {
    const responseRoles = response.roles ?? [];
    const assignedRoles =
      branchUserRoles?.roles?.map((role) => role.name ?? '').filter((role) => role.length > 0) ??
      [];
    return [...new Set([...responseRoles, ...assignedRoles])];
  }

  private resolvePermissions(
    response: LoginResponse,
    tokenPayload: Record<string, unknown> | null,
  ): readonly string[] {
    const responsePermissions = response.permissions ?? [];
    const tokenPermissions = this.readStringArray(
      tokenPayload,
      'permissions',
      'permission',
      'Permissions',
      'Permission',
      'permissions[]',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/permission',
    );

    return [...new Set([...responsePermissions, ...tokenPermissions])];
  }

  private displayName(userNameOrEmail: string): string {
    return userNameOrEmail.includes('@') ? userNameOrEmail.split('@')[0] : userNameOrEmail;
  }

  private normalizeRole(role: string): string {
    return role.replace(/[\s_-]/g, '').toLowerCase();
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
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private readString(payload: Record<string, unknown> | null, key: string): string | null {
    const value = payload?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private readBoolean(
    payload: Record<string, unknown> | null,
    ...keys: readonly string[]
  ): boolean | null {
    if (!payload) {
      return null;
    }

    for (const key of keys) {
      const value = this.toBoolean(payload[key]);
      if (value !== null) {
        return value;
      }
    }

    return null;
  }

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }

    return null;
  }

  private readStringArray(
    payload: Record<string, unknown> | null,
    ...keys: readonly string[]
  ): readonly string[] {
    if (!payload) {
      return [];
    }

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

  private resolveBranchNameEn(
    response: LoginResponse,
    tokenPayload: Record<string, unknown> | null,
    branchUserRoles: BranchUserMyRolesResponse | null,
    selectedBranch: LoginBranchSelection | null,
  ): string | undefined {
    return (
      this.toNonEmptyString(branchUserRoles?.branchNameEn) ??
      this.toNonEmptyString(response.branchNameEn) ??
      this.toNonEmptyString(response.branchName) ??
      this.toNonEmptyString(selectedBranch?.nameEn) ??
      this.readString(tokenPayload, 'branchNameEn') ??
      this.readString(tokenPayload, 'BranchNameEn') ??
      this.readString(tokenPayload, 'branch_name_en') ??
      this.readString(tokenPayload, 'branchName') ??
      this.readString(tokenPayload, 'BranchName') ??
      this.readString(tokenPayload, 'branch_name') ??
      undefined
    );
  }

  private resolveBranchNameAr(
    response: LoginResponse,
    tokenPayload: Record<string, unknown> | null,
    branchUserRoles: BranchUserMyRolesResponse | null,
    selectedBranch: LoginBranchSelection | null,
  ): string | undefined {
    return (
      this.toNonEmptyString(branchUserRoles?.branchNameAr) ??
      this.toNonEmptyString(response.branchNameAr) ??
      this.toNonEmptyString(selectedBranch?.nameAr) ??
      this.readString(tokenPayload, 'branchNameAr') ??
      this.readString(tokenPayload, 'BranchNameAr') ??
      this.readString(tokenPayload, 'branch_name_ar') ??
      undefined
    );
  }

  private toNonEmptyString(value: string | null | undefined): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private toBranchSelectionResult(
    response: LoginResponse,
    userNameOrEmail: string,
  ): BranchSelectionLoginResult {
    return {
      kind: 'branch-selection-required',
      token: response.token,
      userType: 'BranchArea',
      userNameOrEmail,
      branches: (response.branches ?? [])
        .map((branch) => this.toLoginBranchSelection(branch))
        .filter((branch) => branch.id.length > 0),
    };
  }

  private toLoginBranchSelection(
    response: LoginBranchSelectionApiResponse,
  ): LoginBranchSelection {
    return {
      id: this.readRecordId(response.id ?? response.branchId),
      nameEn:
        this.toNonEmptyString(response.nameEn) ??
        this.toNonEmptyString(response.branchNameEn) ??
        '',
      nameAr: this.toNonEmptyString(response.nameAr) ?? this.toNonEmptyString(response.branchNameAr),
      code: this.toNonEmptyString(response.code) ?? this.toNonEmptyString(response.branchCode) ?? '',
    };
  }

  private resolveSelectedBranch(
    response: LoginResponse,
    fallbackBranch: LoginBranchSelection,
  ): LoginBranchSelection {
    if (!response.selectedBranch) {
      return fallbackBranch;
    }

    const selectedBranch = this.toLoginBranchSelection(response.selectedBranch);
    return selectedBranch.id.length > 0 ? selectedBranch : fallbackBranch;
  }

  private readRecordId(value: string | number | null | undefined): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  private resolveAuthErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.firstApiErrorCode(error.error);
    return code ? AUTH_ERROR_KEYS[code] ?? fallbackKey : fallbackKey;
  }

  private firstApiErrorCode(errorBody: unknown): string | null {
    if (!this.isRecord(errorBody)) {
      return null;
    }

    const directCode = errorBody['code'];
    if (typeof directCode === 'string') {
      return directCode;
    }

    const errors = errorBody['errors'];
    if (Array.isArray(errors)) {
      const firstError = errors.find((error): error is Record<string, unknown> =>
        this.isRecord(error) && typeof error['code'] === 'string',
      );

      if (typeof firstError?.['code'] === 'string') {
        return firstError['code'];
      }

      const firstStringError = errors.find((error): error is string => typeof error === 'string');
      return firstStringError ?? null;
    }

    if (this.isRecord(errors)) {
      const firstNestedError = Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value): value is string => typeof value === 'string');

      return firstNestedError ?? null;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
