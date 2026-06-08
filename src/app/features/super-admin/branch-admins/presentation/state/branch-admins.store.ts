import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { UpdateBranchAdminPayload } from '../../domain/branch-admin.model';
import { BranchAdminsService } from '../../data/branch-admins.service';

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
export class BranchAdminsStore {
  private readonly branchAdminsService = inject(BranchAdminsService);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly deactivatingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly deactivating = this.deactivatingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  updateBranchAdmin(branchAdminId: string, payload: UpdateBranchAdminPayload, onUpdated: () => void): void {
    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAdminsService
      .update(branchAdminId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchAdmins.updateSuccess');
          onUpdated();
        },
        error: () => {
          this.errorSignal.set('branchAdmins.updateError');
        },
      });
  }

  deleteBranchAdmin(branchAdminId: string, onDeleted: () => void): void {
    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAdminsService
      .delete(branchAdminId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchAdmins.deleteSuccess');
          onDeleted();
        },
        error: () => {
          this.errorSignal.set('branchAdmins.deleteError');
        },
      });
  }

  deactivateBranchAdmin(branchAdminId: string, onDeactivated: () => void): void {
    if (this.deactivatingSignal()) {
      return;
    }

    this.deactivatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAdminsService
      .deactivate(branchAdminId)
      .pipe(
        take(1),
        finalize(() => this.deactivatingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchAdmins.deactivateSuccess');
          onDeactivated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchAdmins.deactivateError'));
        },
      });
  }

  restoreBranchAdmin(branchAdminId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAdminsService
      .restore(branchAdminId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchAdmins.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchAdmins.restoreError'));
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

    if (error.status === 401) {
      return 'branchAdmins.unauthorized';
    }

    if (error.status === 403) {
      return 'branchAdmins.forbidden';
    }

    if (error.status === 404) {
      return 'branchAdmins.notFound';
    }

    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || fallbackKey;
    }

    return fallbackKey;
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

