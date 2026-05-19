import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  Branch,
  BranchDetails,
  BranchListQuery,
  BranchSelection,
  CreateBranchAdminPayload,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '../../domain/branch.model';
import { BranchesService } from '../../data/branches.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
}

@Injectable()
export class BranchesStore {
  private readonly defaultQuery: BranchListQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
  };

  private readonly branchesService = inject(BranchesService);
  private readonly branchesSignal = signal<readonly Branch[]>([]);
  private readonly branchSelectionSignal = signal<readonly BranchSelection[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly loadingSignal = signal(false);
  private readonly selectionLoadingSignal = signal(false);
  private readonly detailsLoadingSignal = signal(false);
  private readonly selectedBranchDetailsSignal = signal<BranchDetails | null>(null);
  private readonly detailsErrorSignal = signal<string | null>(null);
  private readonly creatingSignal = signal(false);
  private readonly creatingAdminSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly detailsSuccessSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly branches = this.branchesSignal.asReadonly();
  readonly branchSelection = this.branchSelectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly selectionLoading = this.selectionLoadingSignal.asReadonly();
  readonly detailsLoading = this.detailsLoadingSignal.asReadonly();
  readonly selectedBranchDetails = this.selectedBranchDetailsSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly creatingAdmin = this.creatingAdminSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly detailsSuccess = this.detailsSuccessSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalBranches = computed(() => this.totalItemsSignal());
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal()))
  );
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<BranchListQuery> = {}): void {
    const nextQuery: BranchListQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);

    this.branchesService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (page) => {
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
          this.branchesSignal.set(page.data.filter((branch) => branch.id.length > 0));
        },
        error: () => {
          this.branchesSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set('branches.loadError');
        }
      });
  }

  loadSelection(): void {
    this.selectionLoadingSignal.set(true);

    this.branchesService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.selectionLoadingSignal.set(false))
      )
      .subscribe({
        next: (branches) => {
          this.branchSelectionSignal.set(branches);
        },
        error: () => {
          this.branchSelectionSignal.set([]);
          this.errorSignal.set('branches.selectionLoadError');
        }
      });
  }

  loadDetails(branchId: string, clearSuccess = true): void {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);
    if (clearSuccess) {
      this.detailsSuccessSignal.set(null);
    }
    this.selectedBranchDetailsSignal.set(null);

    this.branchesService
      .details(branchId)
      .pipe(
        take(1),
        finalize(() => this.detailsLoadingSignal.set(false))
      )
      .subscribe({
        next: (details) => {
          this.selectedBranchDetailsSignal.set(details);
        },
        error: (error: unknown) => {
          this.detailsErrorSignal.set(this.readDetailsErrorKey(error));
        }
      });
  }

  clearDetails(): void {
    this.selectedBranchDetailsSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.detailsSuccessSignal.set(null);
    this.detailsLoadingSignal.set(false);
  }

  updateBranch(branchId: string, payload: UpdateBranchPayload): void {
    this.updatingSignal.set(true);
    this.detailsErrorSignal.set(null);
    this.detailsSuccessSignal.set(null);

    this.branchesService
      .update(branchId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false))
      )
      .subscribe({
        next: (updatedBranch) => {
          this.mergeUpdatedBranchDetails(updatedBranch, branchId);
          this.replaceBranchInList(updatedBranch, branchId);
          this.detailsSuccessSignal.set('branches.updateSuccess');
          this.loadDetails(branchId, false);
          this.loadSelection();
        },
        error: () => {
          this.detailsErrorSignal.set('branches.updateError');
        }
      });
  }

  updateBranchFromList(branchId: string, payload: UpdateBranchPayload, onUpdated: () => void): void {
    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchesService
      .update(branchId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false))
      )
      .subscribe({
        next: (updatedBranch) => {
          this.replaceBranchInList(updatedBranch, branchId);
          this.successSignal.set('branches.updateSuccess');
          this.loadSelection();
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readBranchMutationErrorKey(error, 'branches.updateError'));
        }
      });
  }

  deleteBranch(branchId: string, onDeleted: () => void): void {
    this.deletingSignal.set(true);
    this.detailsErrorSignal.set(null);
    this.detailsSuccessSignal.set(null);

    this.branchesService
      .delete(branchId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.clearDetails();
          onDeleted();
        },
        error: () => {
          this.detailsErrorSignal.set('branches.deleteError');
        }
      });
  }

  deleteBranchFromList(branchId: string, onDeleted: () => void): void {
    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchesService
      .delete(branchId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branches.deleteSuccess');
          this.load();
          this.loadSelection();
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readBranchMutationErrorKey(error, 'branches.deleteError'));
        }
      });
  }

  search(searchText: string): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      searchText,
    });
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.load({ pageNumber: this.currentPageSignal() + 1 });
  }

  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.load({ pageNumber: this.currentPageSignal() - 1 });
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
          this.loadSelection();
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

  private readDetailsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branches.detailsLoadError';
    }

    if (error.status === 401) {
      return 'branches.detailsUnauthorized';
    }

    if (error.status === 403) {
      return 'branches.detailsForbidden';
    }

    if (error.status === 404) {
      return 'branches.detailsNotFound';
    }

    return 'branches.detailsLoadError';
  }

  private mergeUpdatedBranchDetails(updatedBranch: Branch, fallbackId: string): void {
    const currentDetails = this.selectedBranchDetailsSignal();
    if (currentDetails === null || currentDetails.id !== fallbackId) {
      return;
    }

    this.selectedBranchDetailsSignal.set({
      ...currentDetails,
      id: this.readUpdatedBranchId(updatedBranch, fallbackId),
      nameEn: updatedBranch.nameEn,
      nameAr: updatedBranch.nameAr,
      code: updatedBranch.code,
      address: updatedBranch.address,
      isActive: updatedBranch.isActive,
      createdOnUtc: updatedBranch.createdOnUtc || currentDetails.createdOnUtc,
    });
  }

  private replaceBranchInList(updatedBranch: Branch, fallbackId: string): void {
    const normalizedBranch = {
      ...updatedBranch,
      id: this.readUpdatedBranchId(updatedBranch, fallbackId),
    };

    this.branchesSignal.update((branches) =>
      branches.map((branch) =>
        branch.id === fallbackId
          ? {
              ...branch,
              ...normalizedBranch,
              createdBy: normalizedBranch.createdBy ?? branch.createdBy,
              createdOnUtc: normalizedBranch.createdOnUtc || branch.createdOnUtc,
            }
          : branch
      )
    );
  }

  private readUpdatedBranchId(updatedBranch: Branch, fallbackId: string): string {
    return updatedBranch.id.length > 0 ? updatedBranch.id : fallbackId;
  }

  private readBranchMutationErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.readFirstErrorCode(error.error);
    if (this.isCodeAlreadyExistsError(code)) {
      return 'branches.codeAlreadyExists';
    }

    if (error.status === 401) {
      return 'branches.detailsUnauthorized';
    }

    if (error.status === 403) {
      return 'branches.detailsForbidden';
    }

    if (error.status === 404) {
      return 'branches.detailsNotFound';
    }

    if (error.status === 409) {
      return 'branches.codeAlreadyExists';
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

  private isCodeAlreadyExistsError(code: string): boolean {
    const normalizedCode = code.toLowerCase();
    return normalizedCode.includes('code') && (
      normalizedCode.includes('exists') ||
      normalizedCode.includes('duplicate') ||
      normalizedCode.includes('already')
    );
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }
}
