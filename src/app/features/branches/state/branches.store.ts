import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { Branch, CreateBranchAdminPayload, CreateBranchPayload } from '../models/branch.model';
import { BranchesService } from '../services/branches.service';

@Injectable()
export class BranchesStore {
  private readonly branchesService = inject(BranchesService);
  private readonly branchesSignal = signal<readonly Branch[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly creatingAdminSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly branches = this.branchesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly creatingAdmin = this.creatingAdminSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalBranches = computed(() => this.branchesSignal().length);

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.branchesService
      .list()
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (branches) => {
          this.branchesSignal.set(branches.filter((branch) => branch.id.length > 0));
        },
        error: () => {
          this.branchesSignal.set([]);
          this.errorSignal.set('branches.loadError');
        }
      });
  }

  createBranch(payload: CreateBranchPayload): void {
    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchesService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branches.createSuccess');
          this.load();
        },
        error: () => {
          this.errorSignal.set('branches.createError');
        }
      });
  }

  createBranchAdmin(payload: CreateBranchAdminPayload): void {
    this.creatingAdminSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchesService
      .createBranchAdmin(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingAdminSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branches.adminCreateSuccess');
        },
        error: () => {
          this.errorSignal.set('branches.adminCreateError');
        }
      });
  }
}
