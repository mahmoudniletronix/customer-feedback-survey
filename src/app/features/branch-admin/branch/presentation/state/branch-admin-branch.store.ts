import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchAdminBranchDetails } from '../../domain/branch-admin-branch.model';
import { BranchAdminBranchService } from '../../data/branch-admin-branch.service';

interface ApiErrorItem {
  code?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
}

@Injectable()
export class BranchAdminBranchStore {
  private readonly branchService = inject(BranchAdminBranchService);
  private readonly authStore = inject(AuthStore);
  private readonly branchSignal = signal<BranchAdminBranchDetails | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly branch = this.branchSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.branchService
      .myBranch()
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (branch) => {
          this.branchSignal.set(branch);
        },
        error: (error: unknown) => {
          this.branchSignal.set(null);
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAdmin.branchLoadError';
    }

    const code = this.readFirstErrorCode(error.error);
    if (code === 'BranchArea.SelectedBranchRequired') {
      this.authStore.logout();
      return 'branchAdmin.selectedBranchRequired';
    }

    if (code === 'BranchArea.SelectedBranchNotAllowed') {
      this.authStore.logout();
      return 'branchAdmin.selectedBranchNotAllowed';
    }

    if (code === 'CurrentBranchScope.CurrentBranchActorNotFound') {
      return 'branchAdmin.currentBranchActorNotFound';
    }

    if (error.status === 401) {
      return 'branchAdmin.unauthorized';
    }

    if (error.status === 403) {
      return 'branchAdmin.branchForbidden';
    }

    if (error.status === 404) {
      return 'branchAdmin.branchNotFound';
    }

    return 'branchAdmin.branchLoadError';
  }

  private readFirstErrorCode(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.code ?? firstError?.messageName ?? '';
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }
}
