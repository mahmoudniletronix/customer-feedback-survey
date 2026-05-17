import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { BranchAdminBranchDetails } from '../../domain/branch-admin-branch.model';
import { BranchAdminBranchService } from '../../data/branch-admin-branch.service';

@Injectable()
export class BranchAdminBranchStore {
  private readonly branchService = inject(BranchAdminBranchService);
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
}
