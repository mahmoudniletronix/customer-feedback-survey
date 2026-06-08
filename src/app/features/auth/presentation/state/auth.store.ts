import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { AuthSession, Role, User } from '../../../../shared/models/role.model';
import {
  BranchSelectionLoginResult,
  ChangePasswordRequest,
  LoginCredentials,
} from '../../domain/auth.model';
import { AuthBranchSelectionStorageService } from '../../data/auth-branch-selection-storage.service';
import { AuthService } from '../../data/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly branchSelectionStorage = inject(AuthBranchSelectionStorageService);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<AuthSession | null>(null);
  private readonly branchSelectionSignal = signal<BranchSelectionLoginResult | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private expirationTimeoutId: number | null = null;

  readonly session = this.sessionSignal.asReadonly();
  readonly branchSelection = this.branchSelectionSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly user = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  readonly token = computed<string | null>(() => this.sessionSignal()?.token ?? null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly userType = computed(() => this.sessionSignal()?.userType ?? null);
  readonly permissions = computed(() => this.sessionSignal()?.permissions ?? []);
  readonly apiRoles = computed(() => this.sessionSignal()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly passwordChangeRequired = computed(() => this.hasPasswordChangeRequirement());
  readonly passwordChangeReason = computed<'first-login' | 'expired' | null>(() => {
    const session = this.sessionSignal();
    if (session?.firstLoginFlag === true) {
      return 'first-login';
    }
    if (session?.passwordExpiredFlag === true) {
      return 'expired';
    }

    return null;
  });
  readonly branchSelectionRequired = computed(() => this.branchSelectionSignal() !== null);
  readonly branchSelectionBranches = computed(() => this.branchSelectionSignal()?.branches ?? []);

  constructor() {
    const storedSession = this.tokenStorage.getSession();
    this.sessionSignal.set(storedSession);
    this.branchSelectionSignal.set(storedSession ? this.branchSelectionStorage.get() : null);

    effect(() => {
      const session = this.sessionSignal();
      if (session) {
        this.tokenStorage.setSession(session);
        this.scheduleSessionExpiration();
      } else {
        this.tokenStorage.clear();
        this.clearSessionExpiration();
      }
    });

    effect(() => {
      const session = this.sessionSignal();
      const branchSelection = this.branchSelectionSignal();
      if (session && branchSelection) {
        this.branchSelectionStorage.set(branchSelection);
      } else {
        this.branchSelectionStorage.clear();
      }
    });
  }

  login(credentials: LoginCredentials): void {
    this.tokenStorage.clear();
    this.branchSelectionStorage.clear();
    this.sessionSignal.set(null);
    this.branchSelectionSignal.set(null);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authService
      .login(credentials)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          if (result.kind === 'branch-selection-required') {
            this.branchSelectionSignal.set(result);
            return;
          }

          if (result.kind === 'password-change-required') {
            this.sessionSignal.set(result.session);
            this.branchSelectionSignal.set(result.branchSelection);
            void this.router.navigateByUrl('/auth/change-password', { replaceUrl: true });
            return;
          }

          this.sessionSignal.set(result.session);
          void this.router.navigateByUrl(this.redirectPath());
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
        },
      });
  }

  selectBranch(branchId: string): void {
    const branchSelection = this.branchSelectionSignal();
    const branch = branchSelection?.branches.find((item) => item.id === branchId);
    if (!branchSelection || !branch || this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authService
      .selectBranch(branchSelection.token, branch, branchSelection.userNameOrEmail)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (session) => {
          this.branchSelectionSignal.set(null);
          this.sessionSignal.set(session);
          if (this.hasPasswordChangeRequirement(session)) {
            void this.router.navigateByUrl('/auth/change-password', { replaceUrl: true });
            return;
          }

          void this.router.navigateByUrl(this.redirectPath());
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
        },
      });
  }

  changePassword(request: ChangePasswordRequest): void {
    const session = this.sessionSignal();
    if (!session || this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authService
      .changePassword(session.user.id, session.token, request)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (response) => {
          const updatedSession: AuthSession = {
            ...session,
            user: {
              ...session.user,
              id: this.toNonEmptyString(response.applicationUserId) ?? session.user.id,
            },
            firstLoginFlag: response.firstLoginFlag ?? false,
            passwordExpiredFlag: response.passwordExpiredFlag ?? false,
            passwordChangedOnUtc:
              this.toNonEmptyString(response.passwordChangedOnUtc) ??
              session.passwordChangedOnUtc,
            passwordExpiresOnUtc:
              this.toNonEmptyString(response.passwordExpiresOnUtc) ??
              session.passwordExpiresOnUtc,
          };

          this.sessionSignal.set(updatedSession);

          if (this.branchSelectionSignal()) {
            void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
            return;
          }

          void this.router.navigateByUrl(this.redirectPath(), { replaceUrl: true });
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
        },
      });
  }

  cancelBranchSelection(): void {
    this.branchSelectionSignal.set(null);
    this.branchSelectionStorage.clear();
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
    this.tokenStorage.clear();
    this.sessionSignal.set(null);
  }

  logout(): void {
    this.tokenStorage.clear();
    this.branchSelectionStorage.clear();
    this.sessionSignal.set(null);
    this.branchSelectionSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  redirectPath(): string {
    const role = this.role();
    if (this.canAccessSurveyDashboard()) {
      return '/reports/survey-dashboard';
    }
    if (this.canAccessBranchDashboard()) {
      return '/branch-admin/templates/dashboard';
    }
    if (this.canAccessDepartmentReports()) {
      return '/reports/department/dashboard';
    }
    if (role === 'OPERATOR') {
      return '/operator/templates';
    }
    if (this.canAccessTemplates()) {
      return '/branch-admin/templates';
    }
    if (this.canAccessQuestions()) {
      return '/branch-admin/questions';
    }
    if (this.canAccessQuestionGroups()) {
      return '/branch-admin/question-groups';
    }
    if (this.canAccessBranchUsers()) {
      return '/branch-admin/users';
    }
    if (this.canAccessSystemReports()) {
      return '/reports/system-dashboard';
    }
    if (role === 'DEPARTMENT_ADMIN') {
      return '/survey';
    }
    return '/dashboard';
  }

  canAccessTemplates(): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Template Editor') ||
          this.hasPermission('Templates.Create') ||
          this.hasPermission('Templates.Update') ||
          this.hasPermission('Templates.Delete') ||
          this.hasPermission('Templates.ViewAll') ||
          this.hasPermission('Templates.ViewSelection') ||
          this.hasPermission('Templates.ViewDetails') ||
          this.hasPermission('Templates.AssignQuestions') ||
          this.hasPermission('Templates.ManageQuestionConditions') ||
          this.hasPermission('AnonymousTemplates.ViewAll') ||
          this.hasPermission('AnonymousTemplates.ViewDetails')))
    );
  }

  canManageTemplates(
    action:
      | 'Create'
      | 'Update'
      | 'Delete'
      | 'ViewAll'
      | 'ViewDetails'
      | 'AssignQuestions'
      | 'ManageQuestionConditions',
  ): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Template Editor') || this.hasPermission(`Templates.${action}`)))
    );
  }

  canAccessQuestionGroups(): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Question Editor') || this.hasPermission('QuestionGroups.ViewAll')))
    );
  }

  canManageQuestionGroups(action: 'Create' | 'Update' | 'Delete' | 'ViewAll'): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Question Editor') || this.hasPermission(`QuestionGroups.${action}`)))
    );
  }

  canAccessQuestions(): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Question Editor') || this.hasPermission('Questions.ViewAll')))
    );
  }

  canManageQuestions(action: 'Create' | 'Update' | 'Delete' | 'ViewAll'): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Question Editor') || this.hasPermission(`Questions.${action}`)))
    );
  }

  canAccessGlobalQuestionGroups(): boolean {
    return this.role() === 'SUPER_ADMIN' || this.hasPermission('GlobalQuestionGroups.ViewAll');
  }

  canManageGlobalQuestionGroups(
    action: 'Create' | 'Update' | 'Delete' | 'ViewAll' | 'Restore',
  ): boolean {
    return this.role() === 'SUPER_ADMIN' || this.hasPermission(`GlobalQuestionGroups.${action}`);
  }

  canAccessGlobalQuestions(): boolean {
    return this.role() === 'SUPER_ADMIN' || this.hasPermission('GlobalQuestions.ViewAll');
  }

  canAccessBranchAreas(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.ViewAll');
  }

  canViewBranchAreaDetails(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.ViewDetails');
  }

  canCreateBranchAreas(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.Create');
  }

  canUpdateBranchAreas(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.Update');
  }

  canDeactivateBranchAreas(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.Delete');
  }

  canAssignBranchAreaBranches(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.AssignBranches');
  }

  canRestoreBranchAreas(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAreas.Restore');
  }

  canDeactivateBranchAdmins(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAdmins.Deactivate');
  }

  canRestoreBranchAdmins(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('BranchAdmins.Restore');
  }

  canDeactivateDepartmentAdmins(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('DepartmentAdmins.Deactivate');
  }

  canRestoreDepartmentAdmins(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('DepartmentAdmins.Restore');
  }

  canRestoreDepartments(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('Departments.Restore');
  }

  canCreateSuperAdmins(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('SuperAdmins.Create');
  }

  canDeactivateOperators(): boolean {
    return (
      (this.role() === 'SUPER_ADMIN' || this.role() === 'DEPARTMENT_ADMIN') &&
      this.hasPermission('Operators.Deactivate')
    );
  }

  canRestoreOperators(): boolean {
    return (
      (this.role() === 'SUPER_ADMIN' || this.role() === 'DEPARTMENT_ADMIN') &&
      this.hasPermission('Operators.Restore')
    );
  }

  canAccessBranchUsers(): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() && this.hasPermission('BranchUsers.ViewAll'))
    );
  }

  canManageBranchUsers(
    action: 'Create' | 'Update' | 'Delete' | 'Restore' | 'ResetPassword' | 'AssignRoles',
  ): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() && this.hasPermission(`BranchUsers.${action}`))
    );
  }

  canResetUserPassword(targetRole: Role, targetApplicationUserId = ''): boolean {
    if (!this.hasPermission('Users.ResetPassword')) {
      return false;
    }

    const currentUserId = this.user()?.id ?? '';
    if (targetApplicationUserId.length > 0 && targetApplicationUserId === currentUserId) {
      return false;
    }

    const actorRole = this.role();
    if (actorRole === 'SUPER_ADMIN') {
      return true;
    }
    if (actorRole === 'BRANCH_ADMIN') {
      return targetRole === 'BRANCH_USER';
    }
    if (actorRole === 'DEPARTMENT_ADMIN') {
      return targetRole === 'OPERATOR';
    }

    return false;
  }

  canResetBranchUserPassword(targetApplicationUserId = ''): boolean {
    if (!this.canManageBranchUsers('ResetPassword')) {
      return false;
    }

    const currentUserId = this.user()?.id ?? '';
    return targetApplicationUserId.length === 0 || targetApplicationUserId !== currentUserId;
  }

  canManageGlobalQuestions(
    action: 'Create' | 'Update' | 'Delete' | 'ViewAll' | 'Restore',
  ): boolean {
    return this.role() === 'SUPER_ADMIN' || this.hasPermission(`GlobalQuestions.${action}`);
  }

  canAccessAnonymousTemplates(): boolean {
    return (
      this.role() === 'SUPER_ADMIN' ||
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Template Editor') ||
          this.hasPermission('AnonymousTemplates.Create') ||
          this.hasPermission('AnonymousTemplates.ViewAll') ||
          this.hasPermission('AnonymousTemplates.ViewDetails') ||
          this.hasPermission('AnonymousTemplates.AssignQuestions') ||
          this.hasPermission('AnonymousTemplates.ManageQuestionConditions') ||
          this.hasPermission('AnonymousTemplates.ViewResponses')))
    );
  }

  canManageAnonymousTemplates(
    action:
      | 'Create'
      | 'Update'
      | 'Delete'
      | 'Restore'
      | 'ViewAll'
      | 'ViewDetails'
      | 'AssignQuestions'
      | 'ManageQuestionConditions'
      | 'ViewResponses',
  ): boolean {
    return (
      this.role() === 'SUPER_ADMIN' ||
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasApiRole('Template Editor') ||
          this.hasPermission(`AnonymousTemplates.${action}`)))
    );
  }

  canAccessReports(): boolean {
    return (
      this.canAccessSurveyDashboard() ||
      this.canAccessSystemReports() ||
      this.canAccessDepartmentReports()
    );
  }

  canAccessSurveyDashboard(): boolean {
    return (
      (this.role() === 'SUPER_ADMIN' && this.hasPermission('Reports.ViewBranchReports')) ||
      this.canAccessBranchDashboard()
    );
  }

  canAccessSystemReports(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('Reports.ViewSystemDashboard');
  }

  canAccessDepartmentReports(): boolean {
    return this.role() === 'DEPARTMENT_ADMIN' && this.hasPermission('Reports.ViewDepartmentReports');
  }

  canAccessBranchDashboard(): boolean {
    return (
      this.isBranchAdminUserType() ||
      (this.isBranchScopedActor() &&
        (this.hasPermission('Reports.ViewBranchReports') || this.hasApiRole('Report Viewer')))
    );
  }

  isBranchAdminUserType(): boolean {
    return this.userType() === 'BranchAdmin';
  }

  isBranchScopedActor(): boolean {
    const userType = this.userType();
    return userType === 'BranchAdmin' || userType === 'BranchArea' || userType === 'BranchUser';
  }

  hasApiRole(expectedRole: string): boolean {
    return this.apiRoles().some(
      (role) => this.normalizeRole(role) === this.normalizeRole(expectedRole),
    );
  }

  hasPermission(expectedPermission: string): boolean {
    return this.permissions().some(
      (permission) => this.normalizeRole(permission) === this.normalizeRole(expectedPermission),
    );
  }

  private normalizeRole(role: string): string {
    return role.replace(/[\s_-]/g, '').toLowerCase();
  }

  private hasPasswordChangeRequirement(session: AuthSession | null = this.sessionSignal()): boolean {
    return session?.firstLoginFlag === true || session?.passwordExpiredFlag === true;
  }

  private toNonEmptyString(value: string | null | undefined): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private scheduleSessionExpiration(): void {
    this.clearSessionExpiration();

    const expiresAt = this.tokenStorage.getSessionExpiresAt();
    if (!expiresAt) {
      return;
    }

    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      this.expireSession();
      return;
    }

    this.expirationTimeoutId = window.setTimeout(() => this.expireSession(), delay);
  }

  private clearSessionExpiration(): void {
    if (this.expirationTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.expirationTimeoutId);
    this.expirationTimeoutId = null;
  }

  private expireSession(): void {
    this.tokenStorage.clear();
    this.branchSelectionStorage.clear();
    this.sessionSignal.set(null);
    this.branchSelectionSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
