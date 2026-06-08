import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  CreateDepartmentAdminPayload,
  CreateDepartmentAdminResponse,
} from '../../domain/department-admin.model';
import { DepartmentAdminsService } from '../../data/department-admins.service';

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

const ERROR_KEY_BY_CODE: Record<string, string> = {
  CreateDepartmentAdmin_DepartmentId_Required: 'departmentAdmins.departmentIdRequired',
  CreateDepartmentAdmin_NameEn_Required: 'departmentAdmins.nameEnRequired',
  CreateDepartmentAdmin_NameEn_MaxLength: 'departmentAdmins.nameEnMaxLength',
  CreateDepartmentAdmin_NameAr_MaxLength: 'departmentAdmins.nameArMaxLength',
  CreateDepartmentAdmin_UserName_Required: 'departmentAdmins.userNameRequired',
  CreateDepartmentAdmin_UserName_MaxLength: 'departmentAdmins.userNameMaxLength',
  CreateDepartmentAdmin_Email_Required: 'departmentAdmins.emailRequired',
  CreateDepartmentAdmin_Email_MaxLength: 'departmentAdmins.emailMaxLength',
  CreateDepartmentAdmin_Email_Invalid: 'departmentAdmins.emailInvalid',
  CreateDepartmentAdmin_PhoneNumber_MaxLength: 'departmentAdmins.phoneNumberMaxLength',
  CreateDepartmentAdmin_Password_Required: 'departmentAdmins.passwordRequired',
  CreateDepartmentAdmin_Password_MinLength: 'departmentAdmins.passwordMinLength',
  CreateDepartmentAdmin_Password_MaxLength: 'departmentAdmins.passwordMaxLength',
  CreateDepartmentAdmin_Department_NotFound: 'departmentAdmins.departmentNotFound',
  CreateDepartmentAdmin_CurrentActor_NotAllowed: 'departmentAdmins.currentActorNotAllowed',
  CreateDepartmentAdmin_DepartmentBranchScope_Mismatch: 'departmentAdmins.scopeMismatch',
  CreateDepartmentAdmin_UserName_AlreadyExists: 'departmentAdmins.userNameAlreadyExists',
  CreateDepartmentAdmin_Email_AlreadyExists: 'departmentAdmins.emailAlreadyExists',
  CreateDepartmentAdmin_DepartmentAdministratorRole_NotFound: 'departmentAdmins.roleNotFound',
};

@Injectable()
export class DepartmentAdminsStore {
  private readonly departmentAdminsService = inject(DepartmentAdminsService);
  private readonly creatingSignal = signal(false);
  private readonly deactivatingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);
  private readonly lastCreatedSignal = signal<CreateDepartmentAdminResponse | null>(null);

  readonly creating = this.creatingSignal.asReadonly();
  readonly deactivating = this.deactivatingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly lastCreated = this.lastCreatedSignal.asReadonly();

  createDepartmentAdmin(payload: CreateDepartmentAdminPayload, onCreated: () => void): void {
    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentAdminsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (departmentAdmin) => {
          this.lastCreatedSignal.set(departmentAdmin);
          this.successSignal.set('departmentAdmins.createSuccess');
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'departmentAdmins.createError'));
        },
      });
  }

  deactivateDepartmentAdmin(departmentAdminId: string, onDeactivated: () => void): void {
    if (this.deactivatingSignal()) {
      return;
    }

    this.deactivatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentAdminsService
      .deactivate(departmentAdminId)
      .pipe(
        take(1),
        finalize(() => this.deactivatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('departmentAdmins.deactivateSuccess');
          onDeactivated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'departmentAdmins.deactivateError'));
        },
      });
  }

  restoreDepartmentAdmin(departmentAdminId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentAdminsService
      .restore(departmentAdminId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('departmentAdmins.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'departmentAdmins.restoreError'));
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

    const code = this.readFirstErrorCode(error.error);
    if (code && ERROR_KEY_BY_CODE[code]) {
      return ERROR_KEY_BY_CODE[code];
    }

    if (error.status === 401) {
      return 'departmentAdmins.unauthorized';
    }

    if (error.status === 403) {
      return 'departmentAdmins.currentActorNotAllowed';
    }

    if (error.status === 404) {
      return fallbackKey === 'departmentAdmins.createError'
        ? 'departmentAdmins.departmentNotFound'
        : 'departmentAdmins.notFound';
    }

    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || fallbackKey;
    }

    return fallbackKey;
  }

  private readFirstErrorCode(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.code ?? firstError?.messageName ?? firstError?.message ?? '';
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
