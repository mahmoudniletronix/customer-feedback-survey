import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { CreateSuperAdminPayload, ManagedUser } from '../../domain/user-management.model';
import { UsersService } from '../../data/users.service';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import { ResetUserPasswordRequest } from '../../../../auth/domain/user-password-reset.model';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  detail?: string;
  errors?: readonly ApiErrorItem[];
  title?: string;
}

@Injectable()
export class UsersStore {
  private readonly usersService = inject(UsersService);
  private readonly userPasswordResetService = inject(UserPasswordResetService);
  private readonly usersSignal = signal<readonly ManagedUser[]>([]);
  private readonly creatingSuperAdminSignal = signal(false);
  private readonly resettingPasswordSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly creatingSuperAdmin = this.creatingSuperAdminSignal.asReadonly();
  readonly resettingPassword = this.resettingPasswordSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  load(clearSuccess = true): void {
    this.errorSignal.set(null);
    if (clearSuccess) {
      this.successSignal.set(null);
    }
    this.usersService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (users) => this.usersSignal.set(users),
        error: () => {
          this.usersSignal.set([]);
          this.errorSignal.set('users.loadError');
        }
      });
  }

  resetPassword(
    applicationUserId: string,
    payload: ResetUserPasswordRequest,
    onReset: () => void,
  ): void {
    if (this.resettingPasswordSignal()) {
      return;
    }

    this.resettingPasswordSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.userPasswordResetService
      .resetPassword(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.resettingPasswordSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('users.resetPasswordSuccess');
          onReset();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'users.resetPasswordError'));
        },
      });
  }

  createSuperAdmin(payload: CreateSuperAdminPayload, onCreated: () => void): void {
    if (this.creatingSuperAdminSignal()) {
      return;
    }

    this.creatingSuperAdminSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.usersService
      .createSuperAdmin(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSuperAdminSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('users.createSuperAdminSuccess');
          this.load(false);
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'users.createSuperAdminError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const marker = this.readErrorMarker(error.error);
    const mappedError = this.mapBackendError(marker);
    if (mappedError.length > 0) {
      return mappedError;
    }

    if (error.status === 401) {
      return 'users.unauthorized';
    }
    if (error.status === 403) {
      return fallbackKey === 'users.createSuperAdminError'
        ? 'users.createSuperAdminForbidden'
        : 'users.resetPasswordForbidden';
    }
    if (error.status === 404) {
      return 'users.userNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'users.resetPasswordError';
    }

    return fallbackKey;
  }

  private mapBackendError(marker: string): string {
    const normalized = marker.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('targetusernotfound')) {
      return 'users.userNotFound';
    }
    if (normalized.includes('username') && normalized.includes('already')) {
      return 'users.userNameAlreadyExists';
    }
    if (normalized.includes('email') && normalized.includes('already')) {
      return 'users.emailAlreadyExists';
    }
    if (normalized.includes('currentactorprofilenotfound')) {
      return 'users.currentActorProfileNotFound';
    }
    if (normalized.includes('targetuserinactive') || normalized.includes('userinactive')) {
      return 'users.userInactive';
    }
    if (normalized.includes('scopeviolation') || normalized.includes('outsidescope')) {
      return 'users.resetPasswordScopeViolation';
    }
    if (normalized.includes('self') || normalized.includes('ownpassword')) {
      return 'users.resetPasswordSelfForbidden';
    }
    if (normalized.includes('notallowed') || normalized.includes('forbidden')) {
      return 'users.resetPasswordForbidden';
    }
    if (normalized.includes('confirmnewpassword')) {
      return 'auth.changePasswordConfirmPasswordNotMatched';
    }
    if (normalized.includes('newpassword') && normalized.includes('required')) {
      return 'auth.changePasswordNewPasswordRequired';
    }
    if (normalized.includes('newpassword') && normalized.includes('maxlength')) {
      return 'auth.changePasswordNewPasswordMaxLength';
    }
    if (normalized.includes('newpassword')) {
      return 'auth.changePasswordNewPasswordMinLength';
    }
    if (normalized.includes('password')) {
      return 'users.passwordInvalid';
    }

    return '';
  }

  private readErrorMarker(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return [
      firstError?.code,
      firstError?.messageName,
      firstError?.message,
      errorBody.detail,
      errorBody.title,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }

  private readProblemDetailsMessage(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.message ?? errorBody.detail ?? errorBody.title ?? '';
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null;
  }
}
