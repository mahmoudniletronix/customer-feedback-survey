import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  AssignBranchUserRolesPayload,
  BranchUser,
  BranchUsersQuery,
  CreateBranchUserPayload,
  ResetBranchUserPasswordPayload,
  RoleSelection,
  UpdateBranchUserPayload,
} from '../models/branch-user.model';
import { BranchUsersService } from '../services/branch-users.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
}

@Injectable()
export class BranchUsersStore {
  private readonly defaultQuery: BranchUsersQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    isActive: null,
  };

  private readonly branchUsersService = inject(BranchUsersService);
  private readonly usersSignal = signal<readonly BranchUser[]>([]);
  private readonly rolesSignal = signal<readonly RoleSelection[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly isActiveSignal = signal<boolean | null>(this.defaultQuery.isActive);
  private readonly loadingSignal = signal(false);
  private readonly rolesLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly resettingPasswordSignal = signal(false);
  private readonly assigningRolesSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly isActive = this.isActiveSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly rolesLoading = this.rolesLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly resettingPassword = this.resettingPasswordSignal.asReadonly();
  readonly assigningRoles = this.assigningRolesSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())),
  );
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<BranchUsersQuery> = {}): void {
    const nextQuery: BranchUsersQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
      isActive: query.isActive !== undefined ? query.isActive : this.isActiveSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.isActiveSignal.set(nextQuery.isActive);

    this.branchUsersService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
          this.usersSignal.set(page.data.filter((user) => user.applicationUserId.length > 0));
        },
        error: (error: unknown) => {
          this.usersSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.loadError'));
        },
      });
  }

  loadRoles(): void {
    this.rolesLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.branchUsersService
      .rolesSelection()
      .pipe(
        take(1),
        finalize(() => this.rolesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (roles) => {
          this.rolesSignal.set(roles);
        },
        error: (error: unknown) => {
          this.rolesSignal.set([]);
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.rolesLoadError'));
        },
      });
  }

  search(searchText: string, isActive: boolean | null): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      searchText,
      isActive,
    });
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.load({ pageNumber: this.currentPageSignal() + 1 });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.load({ pageNumber: this.currentPageSignal() - 1 });
    }
  }

  createBranchUser(payload: CreateBranchUserPayload, onCreated: () => void): void {
    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.createSuccess');
          this.load();
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.createError'));
        },
      });
  }

  updateBranchUser(
    applicationUserId: string,
    payload: UpdateBranchUserPayload,
    onUpdated: () => void,
  ): void {
    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .update(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.updateSuccess');
          this.load();
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.updateError'));
        },
      });
  }

  deleteBranchUser(applicationUserId: string, onDeleted: () => void): void {
    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .delete(applicationUserId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.deleteSuccess');
          this.load();
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.deleteError'));
        },
      });
  }

  restoreBranchUser(applicationUserId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .restore(applicationUserId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.restoreSuccess');
          this.load();
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.restoreError'));
        },
      });
  }

  resetPassword(
    applicationUserId: string,
    payload: ResetBranchUserPasswordPayload,
    onReset: () => void,
  ): void {
    this.resettingPasswordSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .resetPassword(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.resettingPasswordSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.resetPasswordSuccess');
          onReset();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.resetPasswordError'));
        },
      });
  }

  assignRoles(
    applicationUserId: string,
    payload: AssignBranchUserRolesPayload,
    onAssigned: () => void,
  ): void {
    this.assigningRolesSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchUsersService
      .assignRoles(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.assigningRolesSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchUsers.assignRolesSuccess');
          this.load();
          onAssigned();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchUsers.assignRolesError'));
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
    const mappedError = this.mapBackendErrorCode(code);
    if (mappedError.length > 0) {
      return mappedError;
    }

    if (error.status === 401) {
      return 'branchUsers.unauthorized';
    }

    if (error.status === 403) {
      return 'branchUsers.forbidden';
    }

    if (error.status === 404) {
      return 'branchUsers.notFound';
    }

    return fallbackKey;
  }

  private mapBackendErrorCode(code: string): string {
    const normalizedCode = code.toLowerCase();
    if (
      normalizedCode.includes('usernamealreadyexists') ||
      normalizedCode.includes('username_alreadyexists')
    ) {
      return 'branchUsers.userNameAlreadyExists';
    }
    if (
      normalizedCode.includes('emailalreadyexists') ||
      normalizedCode.includes('email_alreadyexists')
    ) {
      return 'branchUsers.emailAlreadyExists';
    }
    if (normalizedCode.includes('rolenotallowed') || normalizedCode.includes('role_notallowed')) {
      return 'branchUsers.roleNotAllowed';
    }
    if (normalizedCode.includes('rolenotfound') || normalizedCode.includes('role_notfound')) {
      return 'branchUsers.roleNotFound';
    }
    if (normalizedCode.includes('requiredrolesnotseeded')) {
      return 'branchUsers.requiredRolesNotSeeded';
    }
    if (normalizedCode.includes('currentbranchadminnotfound')) {
      return 'branchUsers.currentBranchAdminNotFound';
    }
    if (normalizedCode.includes('branchscopemismatch')) {
      return 'branchUsers.scopeMismatch';
    }
    return '';
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
