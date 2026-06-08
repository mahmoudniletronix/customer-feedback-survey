import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  BranchAreaListItem,
  BranchAreaListQuery,
  BranchAreaOrderSort,
  DeactivateBranchAreaResult,
  RestoreBranchAreaResult,
} from '../../domain/branch-area.model';
import { BranchAreasService } from '../../data/branch-areas.service';

interface ApiErrorItem {
  code?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
}

const ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Pagination.Unauthenticated': 'branchAreas.tokenMissing',
  'BranchAreas.Pagination.CurrentSuperAdminNotFound': 'branchAreas.currentSuperAdminNotFound',
  'Validation.GetBranchAreasPagination_PageNumber_Invalid': 'branchAreas.pageNumberInvalid',
  'Validation.GetBranchAreasPagination_PageSize_Invalid': 'branchAreas.pageSizeInvalid',
};

const DEACTIVATE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Delete.Unauthenticated': 'branchAreas.deactivateTokenMissing',
  'BranchAreas.Delete.CurrentSuperAdminNotFound':
    'branchAreas.deactivateCurrentSuperAdminNotFound',
  'BranchAreas.Delete.BranchAreaNotFound': 'branchAreas.deactivateBranchAreaNotFound',
  'BranchAreas.Delete.ApplicationUserNotFound': 'branchAreas.deactivateApplicationUserNotFound',
};

const RESTORE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Restore.Unauthenticated': 'branchAreas.restoreTokenMissing',
  'BranchAreas.Restore.CurrentSuperAdminNotFound': 'branchAreas.restoreCurrentSuperAdminNotFound',
  'BranchAreas.Restore.BranchAreaNotFound': 'branchAreas.restoreBranchAreaNotFound',
  'BranchAreas.Restore.ApplicationUserNotFound': 'branchAreas.restoreApplicationUserNotFound',
};

@Injectable()
export class BranchAreasStore {
  private readonly defaultQuery: BranchAreaListQuery = {
    searchText: '',
    pageNumber: 1,
    pageSize: 10,
    orderSort: 'Newest',
  };

  private readonly branchAreasService = inject(BranchAreasService);
  private readonly branchAreasSignal = signal<readonly BranchAreaListItem[]>([]);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalPagesSignal = signal(0);
  private readonly totalItemsSignal = signal(0);
  private readonly hasPreviousPageSignal = signal(false);
  private readonly hasNextPageSignal = signal(false);
  private readonly orderSortSignal = signal<BranchAreaOrderSort>(this.defaultQuery.orderSort);
  private readonly loadingSignal = signal(false);
  private readonly deactivatingBranchAreaIdSignal = signal<string | null>(null);
  private readonly restoringBranchAreaIdSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly branchAreas = this.branchAreasSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalPages = this.totalPagesSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly hasPreviousPage = this.hasPreviousPageSignal.asReadonly();
  readonly hasNextPage = this.hasNextPageSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly deactivatingBranchAreaId = this.deactivatingBranchAreaIdSignal.asReadonly();
  readonly restoringBranchAreaId = this.restoringBranchAreaIdSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly isEmpty = computed(() => !this.loadingSignal() && this.branchAreasSignal().length === 0);

  load(query: Partial<BranchAreaListQuery> = {}): void {
    const nextQuery: BranchAreaListQuery = {
      searchText: query.searchText ?? this.searchTextSignal(),
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      orderSort: query.orderSort ?? this.orderSortSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.currentPageSignal.set(nextQuery.pageNumber);
    this.pageSizeSignal.set(nextQuery.pageSize);
    this.orderSortSignal.set(nextQuery.orderSort);

    this.branchAreasService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.branchAreasSignal.set(page.data);
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalPagesSignal.set(page.totalPages);
          this.totalItemsSignal.set(page.totalItems);
          this.hasPreviousPageSignal.set(page.hasPreviousPage);
          this.hasNextPageSignal.set(page.hasNextPage);
        },
        error: (error: unknown) => {
          this.branchAreasSignal.set([]);
          this.totalPagesSignal.set(0);
          this.totalItemsSignal.set(0);
          this.hasPreviousPageSignal.set(false);
          this.hasNextPageSignal.set(false);
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  search(searchText: string): void {
    this.load({ searchText, pageNumber: 1 });
  }

  changeOrderSort(orderSort: BranchAreaOrderSort): void {
    this.load({ orderSort, pageNumber: 1 });
  }

  changePageSize(pageSize: number): void {
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    this.load({ pageSize: safePageSize, pageNumber: 1 });
  }

  previousPage(): void {
    if (!this.hasPreviousPageSignal() || this.loadingSignal()) {
      return;
    }

    this.load({ pageNumber: this.currentPageSignal() - 1 });
  }

  nextPage(): void {
    if (!this.hasNextPageSignal() || this.loadingSignal()) {
      return;
    }

    this.load({ pageNumber: this.currentPageSignal() + 1 });
  }

  deactivate(branchAreaId: string): void {
    const normalizedBranchAreaId = branchAreaId.trim();
    if (normalizedBranchAreaId.length === 0 || this.deactivatingBranchAreaIdSignal()) {
      return;
    }

    this.deactivatingBranchAreaIdSignal.set(normalizedBranchAreaId);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAreasService
      .deactivate(normalizedBranchAreaId)
      .pipe(
        take(1),
        finalize(() => this.deactivatingBranchAreaIdSignal.set(null)),
      )
      .subscribe({
        next: (result) => {
          this.mergeDeactivatedBranchArea(result, normalizedBranchAreaId);
          this.successSignal.set('branchAreas.deactivateSuccess');
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readDeactivateErrorKey(error));
        },
      });
  }

  restore(branchAreaId: string): void {
    const normalizedBranchAreaId = branchAreaId.trim();
    if (normalizedBranchAreaId.length === 0 || this.restoringBranchAreaIdSignal()) {
      return;
    }

    this.restoringBranchAreaIdSignal.set(normalizedBranchAreaId);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchAreasService
      .restore(normalizedBranchAreaId)
      .pipe(
        take(1),
        finalize(() => this.restoringBranchAreaIdSignal.set(null)),
      )
      .subscribe({
        next: (result) => {
          this.mergeRestoredBranchArea(result, normalizedBranchAreaId);
          this.successSignal.set('branchAreas.restoreSuccess');
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readRestoreErrorKey(error));
        },
      });
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.loadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code ? ERROR_KEYS[code] ?? 'branchAreas.loadError' : 'branchAreas.loadError';
  }

  private readDeactivateErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.deactivateLoadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code
      ? DEACTIVATE_ERROR_KEYS[code] ?? 'branchAreas.deactivateLoadError'
      : 'branchAreas.deactivateLoadError';
  }

  private readRestoreErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.restoreLoadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code ? RESTORE_ERROR_KEYS[code] ?? 'branchAreas.restoreLoadError' : 'branchAreas.restoreLoadError';
  }

  private mergeDeactivatedBranchArea(
    result: DeactivateBranchAreaResult,
    fallbackBranchAreaId: string,
  ): void {
    const branchAreaId = result.branchAreaId || fallbackBranchAreaId;

    this.branchAreasSignal.update((branchAreas) =>
      branchAreas.map((branchArea) =>
        branchArea.branchAreaId === branchAreaId
          ? {
              ...branchArea,
              applicationUserId: result.applicationUserId || branchArea.applicationUserId,
              isActive: result.isActive,
            }
          : branchArea,
      ),
    );
  }

  private mergeRestoredBranchArea(
    result: RestoreBranchAreaResult,
    fallbackBranchAreaId: string,
  ): void {
    const branchAreaId = result.branchAreaId || fallbackBranchAreaId;

    this.branchAreasSignal.update((branchAreas) =>
      branchAreas.map((branchArea) =>
        branchArea.branchAreaId === branchAreaId
          ? {
              ...branchArea,
              applicationUserId: result.applicationUserId || branchArea.applicationUserId,
              isActive: result.isActive,
            }
          : branchArea,
      ),
    );
  }
}
