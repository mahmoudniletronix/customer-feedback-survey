import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { AuthSession, Role, User } from '../../../../shared/models/role.model';
import { LoginCredentials } from '../../domain/auth.model';
import { AuthService } from '../../data/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<AuthSession | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly user = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  readonly token = computed<string | null>(() => this.sessionSignal()?.token ?? null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly userType = computed(() => this.sessionSignal()?.userType ?? null);
  readonly permissions = computed(() => this.sessionSignal()?.permissions ?? []);
  readonly apiRoles = computed(() => this.sessionSignal()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor() {
    this.sessionSignal.set(this.tokenStorage.getSession());

    effect(() => {
      const session = this.sessionSignal();
      if (session) {
        this.tokenStorage.setSession(session);
      } else {
        this.tokenStorage.clear();
      }
    });
  }

  login(credentials: LoginCredentials): void {
    this.tokenStorage.clear();
    this.sessionSignal.set(null);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authService
      .login(credentials)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (session) => {
          this.sessionSignal.set(session);
          void this.router.navigateByUrl(this.redirectPath());
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
        },
      });
  }

  logout(): void {
    this.tokenStorage.clear();
    this.sessionSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  redirectPath(): string {
    const role = this.role();
    if (this.canAccessBranchDashboard()) {
      return '/branch-admin';
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
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
        (this.hasApiRole('Template Editor') ||
          this.hasPermission('AnonymousTemplates.ViewAll') ||
          this.hasPermission('AnonymousTemplates.ViewDetails')))
    );
  }

  canAccessQuestionGroups(): boolean {
    return (
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
        (this.hasApiRole('Question Editor') || this.hasPermission('QuestionGroups.ViewAll')))
    );
  }

  canManageQuestionGroups(action: 'Create' | 'Update' | 'Delete' | 'ViewAll'): boolean {
    return (
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
        (this.hasApiRole('Question Editor') || this.hasPermission(`QuestionGroups.${action}`)))
    );
  }

  canAccessQuestions(): boolean {
    return (
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
        (this.hasApiRole('Question Editor') || this.hasPermission('Questions.ViewAll')))
    );
  }

  canManageQuestions(action: 'Create' | 'Update' | 'Delete' | 'ViewAll'): boolean {
    return (
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
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

  canManageGlobalQuestions(
    action: 'Create' | 'Update' | 'Delete' | 'ViewAll' | 'Restore',
  ): boolean {
    return this.role() === 'SUPER_ADMIN' || this.hasPermission(`GlobalQuestions.${action}`);
  }

  canAccessAnonymousTemplates(): boolean {
    return (
      this.role() === 'SUPER_ADMIN' ||
      this.role() === 'BRANCH_ADMIN' ||
      this.hasApiRole('Template Editor') ||
      this.hasPermission('AnonymousTemplates.Create') ||
      this.hasPermission('AnonymousTemplates.ViewAll') ||
      this.hasPermission('AnonymousTemplates.ViewDetails') ||
      this.hasPermission('AnonymousTemplates.AssignQuestions') ||
      this.hasPermission('AnonymousTemplates.ManageQuestionConditions') ||
      this.hasPermission('AnonymousTemplates.ViewResponses')
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
      this.role() === 'BRANCH_ADMIN' ||
      this.hasApiRole('Template Editor') ||
      this.hasPermission(`AnonymousTemplates.${action}`)
    );
  }

  canAccessReports(): boolean {
    return this.canAccessSystemReports();
  }

  canAccessSystemReports(): boolean {
    return this.role() === 'SUPER_ADMIN' && this.hasPermission('Reports.ViewSystemDashboard');
  }

  canAccessBranchDashboard(): boolean {
    return (
      this.role() === 'BRANCH_ADMIN' ||
      (this.role() === 'BRANCH_USER' &&
        (this.hasPermission('Reports.ViewBranchReports') || this.hasApiRole('Report Viewer')))
    );
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
}
