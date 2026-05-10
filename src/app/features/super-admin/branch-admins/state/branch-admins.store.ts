import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { UpdateBranchAdminPayload } from '../models/branch-admin.model';
import { BranchAdminsService } from '../services/branch-admins.service';

@Injectable()
export class BranchAdminsStore {
  private readonly branchAdminsService = inject(BranchAdminsService);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
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

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }
}

