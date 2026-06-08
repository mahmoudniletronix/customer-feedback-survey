import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  AssignBranchUserRolesPayload,
  AssignBranchUserRolesResult,
  BranchUser,
  BranchUserStateChangeResult,
  BranchUsersOrderSort,
  BranchUsersQuery,
  CreateBranchUserPayload,
  ResetBranchUserPasswordPayload,
  RoleSelection,
  UpdateBranchUserPayload,
} from '../../domain/branch-user.model';
import { BranchUsersService } from '../../data/branch-users.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  detail?: string;
  errors?: readonly ApiErrorItem[];
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class BranchUsersStore {
  private readonly defaultQuery: BranchUsersQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    orderSort: 'Newest',
  };

  private readonly branchUsersService = inject(BranchUsersService);
  private readonly authStore = inject(AuthStore);
  private readonly usersSignal = signal<readonly BranchUser[]>([]);
  private readonly rolesSignal = signal<readonly RoleSelection[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalPagesSignal = signal(0);
  private readonly totalItemsSignal = signal(0);
  private readonly hasPreviousPageSignal = signal(false);
  private readonly hasNextPageSignal = signal(false);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly orderSortSignal = signal<BranchUsersOrderSort>(this.defaultQuery.orderSort);
  private readonly loadingSignal = signal(false);
  private readonly rolesLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly resettingPasswordSignal = signal(false);
  private readonly assigningRolesSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly createUserNameErrorSignal = signal<string | null>(null);
  private readonly createEmailErrorSignal = signal<string | null>(null);
  private readonly createRoleIdsErrorSignal = signal<string | null>(null);
  private readonly assignRoleIdsErrorSignal = signal<string | null>(null);
  private readonly updateEmailErrorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalPages = this.totalPagesSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly hasPreviousPage = this.hasPreviousPageSignal.asReadonly();
  readonly hasNextPage = this.hasNextPageSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly rolesLoading = this.rolesLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly resettingPassword = this.resettingPasswordSignal.asReadonly();
  readonly assigningRoles = this.assigningRolesSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly createUserNameError = this.createUserNameErrorSignal.asReadonly();
  readonly createEmailError = this.createEmailErrorSignal.asReadonly();
  readonly createRoleIdsError = this.createRoleIdsErrorSignal.asReadonly();
  readonly assignRoleIdsError = this.assignRoleIdsErrorSignal.asReadonly();
  readonly updateEmailError = this.updateEmailErrorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  load(query: Partial<BranchUsersQuery> = {}): void {
    const nextQuery: BranchUsersQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
      orderSort: query.orderSort ?? this.orderSortSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.pageSizeSignal.set(nextQuery.pageSize);
    this.orderSortSignal.set(nextQuery.orderSort);

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
          this.totalPagesSignal.set(page.totalPages);
          this.totalItemsSignal.set(page.totalItems);
          this.hasPreviousPageSignal.set(page.hasPreviousPage);
          this.hasNextPageSignal.set(page.hasNextPage);
          this.usersSignal.set(page.data.filter((user) => user.applicationUserId.length > 0));
        },
        error: (error: unknown) => {
          this.usersSignal.set([]);
          this.totalPagesSignal.set(0);
          this.totalItemsSignal.set(0);
          this.hasPreviousPageSignal.set(false);
          this.hasNextPageSignal.set(false);
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

  search(searchText: string): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      searchText,
    });
  }

  changePageSize(pageSize: number): void {
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    this.load({ pageSize: safePageSize, pageNumber: 1 });
  }

  changeOrderSort(orderSort: BranchUsersOrderSort): void {
    this.load({ orderSort, pageNumber: 1 });
  }

  nextPage(): void {
    if (this.hasNextPageSignal()) {
      this.load({ pageNumber: this.currentPageSignal() + 1 });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPageSignal()) {
      this.load({ pageNumber: this.currentPageSignal() - 1 });
    }
  }

  createBranchUser(payload: CreateBranchUserPayload, onCreated: () => void): void {
    this.clearMessages();

    const roleIds = payload.roleIds.map((roleId) => roleId.trim());
    const roleIdsError = this.validateRoleIds(roleIds);
    if (roleIdsError) {
      this.createRoleIdsErrorSignal.set(roleIdsError);
      return;
    }

    this.creatingSignal.set(true);

    this.branchUsersService
      .create({
        ...payload,
        roleIds,
      })
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
          this.applyCreateError(error);
        },
      });
  }

  updateBranchUser(
    applicationUserId: string,
    payload: UpdateBranchUserPayload,
    onUpdated: () => void,
  ): void {
    this.clearMessages();
    this.updatingSignal.set(true);

    this.branchUsersService
      .update(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.mergeUpdatedUser(updated, applicationUserId);
          this.successSignal.set('branchUsers.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.applyUpdateError(error);
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
        next: (stateChange) => {
          this.patchUserState(stateChange, applicationUserId);
          this.successSignal.set('branchUsers.deleteSuccess');
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
        next: (stateChange) => {
          this.patchUserState(stateChange, applicationUserId);
          this.successSignal.set('branchUsers.restoreSuccess');
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
      .resetPassword(applicationUserId, { newPassword: payload.newPassword })
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
    this.clearMessages();

    const roleIds = payload.roleIds.map((roleId) => roleId.trim());
    const roleIdsError = this.validateRoleIds(roleIds);
    if (roleIdsError) {
      this.assignRoleIdsErrorSignal.set(roleIdsError);
      return;
    }

    this.assigningRolesSignal.set(true);

    this.branchUsersService
      .assignRoles(applicationUserId, { roleIds })
      .pipe(
        take(1),
        finalize(() => this.assigningRolesSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.patchAssignedRoles(result, applicationUserId);
          this.successSignal.set('branchUsers.assignRolesSuccess');
          onAssigned();
        },
        error: (error: unknown) => {
          this.applyAssignRolesError(error);
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.createUserNameErrorSignal.set(null);
    this.createEmailErrorSignal.set(null);
    this.createRoleIdsErrorSignal.set(null);
    this.assignRoleIdsErrorSignal.set(null);
    this.updateEmailErrorSignal.set(null);
    this.successSignal.set(null);
  }

  clearCreateFieldError(field: 'userName' | 'email' | 'roleIds'): void {
    if (field === 'userName') {
      this.createUserNameErrorSignal.set(null);
      return;
    }

    if (field === 'email') {
      this.createEmailErrorSignal.set(null);
      return;
    }

    this.createRoleIdsErrorSignal.set(null);
  }

  clearUpdateFieldError(field: 'email'): void {
    if (field === 'email') {
      this.updateEmailErrorSignal.set(null);
    }
  }

  clearAssignRolesError(): void {
    this.assignRoleIdsErrorSignal.set(null);
  }

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.readFirstErrorCode(error.error);
    if (this.isBranchSelectionError(code)) {
      this.authStore.logout();
    }

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

  private applyCreateError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('branchUsers.createError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage = errors[0]?.message ?? errorResponse?.detail ?? 'branchUsers.createError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      if (this.isBranchSelectionError(code)) {
        this.authStore.logout();
      }

      const errorKey = this.mapCreateErrorCode(code) || item.message || fallbackMessage;

      if (this.isUserNameError(code)) {
        this.createUserNameErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      if (this.isEmailError(code)) {
        this.createEmailErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      if (this.isRoleIdsError(code) || this.isRoleSecurityError(code)) {
        this.createRoleIdsErrorSignal.set(errorKey);
        hasSpecificError = true;
        if (this.isRoleSecurityError(code)) {
          this.loadRoles();
        }
        continue;
      }

      this.errorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.errorSignal.set(fallbackMessage);
    }
  }

  private applyUpdateError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('branchUsers.updateError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage = errors[0]?.message ?? errorResponse?.detail ?? 'branchUsers.updateError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      if (this.isBranchSelectionError(code)) {
        this.authStore.logout();
      }

      const errorKey = this.mapUpdateErrorCode(code) || item.message || fallbackMessage;

      if (this.isEmailError(code)) {
        this.updateEmailErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      this.errorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.errorSignal.set(fallbackMessage);
    }
  }

  private applyAssignRolesError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('branchUsers.assignRolesError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage =
      errors[0]?.message ?? errorResponse?.detail ?? 'branchUsers.assignRolesError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      if (this.isBranchSelectionError(code)) {
        this.authStore.logout();
      }

      const errorKey = this.mapAssignRolesErrorCode(code) || item.message || fallbackMessage;

      if (this.isRoleIdsError(code) || this.isRoleSecurityError(code)) {
        this.assignRoleIdsErrorSignal.set(errorKey);
        hasSpecificError = true;
        if (this.isRoleSecurityError(code)) {
          this.loadRoles();
        }
        continue;
      }

      this.errorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.errorSignal.set(fallbackMessage);
    }
  }

  private mapCreateErrorCode(code: string): string {
    const normalizedCode = code.toLowerCase();
    if (normalizedCode.includes('branchusers.create.unauthenticated')) {
      return 'branchUsers.unauthorized';
    }
    if (normalizedCode.includes('brancharea.selectedbranchrequired')) {
      return 'branchUsers.selectedBranchRequired';
    }
    if (normalizedCode.includes('brancharea.selectedbranchnotallowed')) {
      return 'branchUsers.selectedBranchNotAllowed';
    }
    if (normalizedCode.includes('createbranchuser_roleids_required')) {
      return 'branchUsers.roleIdsRequired';
    }
    if (normalizedCode.includes('createbranchuser_roleid_invalid')) {
      return 'branchUsers.roleIdInvalid';
    }
    if (normalizedCode.includes('usernamealreadyexists')) {
      return 'branchUsers.userNameAlreadyExists';
    }
    if (normalizedCode.includes('emailalreadyexists')) {
      return 'branchUsers.emailAlreadyExists';
    }
    if (normalizedCode.includes('rolenotfound')) {
      return 'branchUsers.roleNotFound';
    }
    if (normalizedCode.includes('rolenotallowed')) {
      return 'branchUsers.roleNotAllowed';
    }
    return this.mapBackendErrorCode(code);
  }

  private mapUpdateErrorCode(code: string): string {
    const normalizedCode = code.toLowerCase();
    if (normalizedCode.includes('branchusers.update.unauthenticated')) {
      return 'branchUsers.unauthorized';
    }
    if (normalizedCode.includes('brancharea.selectedbranchrequired')) {
      return 'branchUsers.selectedBranchRequired';
    }
    if (normalizedCode.includes('brancharea.selectedbranchnotallowed')) {
      return 'branchUsers.selectedBranchNotAllowed';
    }
    if (normalizedCode.includes('branchusernotfound')) {
      return 'branchUsers.notFound';
    }
    if (normalizedCode.includes('branchscopemismatch')) {
      return 'branchUsers.scopeMismatch';
    }
    if (normalizedCode.includes('applicationusernotfound')) {
      return 'branchUsers.applicationUserNotFound';
    }
    if (normalizedCode.includes('userinactive')) {
      return 'branchUsers.userInactive';
    }
    if (normalizedCode.includes('emailalreadyexists')) {
      return 'branchUsers.emailAlreadyExists';
    }
    if (normalizedCode.includes('updatebranchuser_email_invalid')) {
      return 'departmentAdmins.emailInvalid';
    }
    if (normalizedCode.includes('updatebranchuser_email_required')) {
      return 'departmentAdmins.emailRequired';
    }
    if (normalizedCode.includes('updatebranchuser_email_maxlength')) {
      return 'departmentAdmins.emailMaxLength';
    }
    return this.mapBackendErrorCode(code);
  }

  private mapAssignRolesErrorCode(code: string): string {
    const normalizedCode = code.toLowerCase();
    if (normalizedCode.includes('branchusers.assignroles.unauthenticated')) {
      return 'branchUsers.unauthorized';
    }
    if (normalizedCode.includes('brancharea.selectedbranchrequired')) {
      return 'branchUsers.selectedBranchRequired';
    }
    if (normalizedCode.includes('brancharea.selectedbranchnotallowed')) {
      return 'branchUsers.selectedBranchNotAllowed';
    }
    if (normalizedCode.includes('branchusernotfound')) {
      return 'branchUsers.notFound';
    }
    if (normalizedCode.includes('branchscopemismatch')) {
      return 'branchUsers.scopeMismatch';
    }
    if (normalizedCode.includes('roleids') && normalizedCode.includes('required')) {
      return 'branchUsers.roleIdsRequired';
    }
    if (normalizedCode.includes('roleid') && normalizedCode.includes('invalid')) {
      return 'branchUsers.roleIdInvalid';
    }
    if (normalizedCode.includes('rolenotfound')) {
      return 'branchUsers.roleNotFound';
    }
    if (normalizedCode.includes('rolenotallowed')) {
      return 'branchUsers.roleNotAllowed';
    }
    return this.mapBackendErrorCode(code);
  }

  private mapBackendErrorCode(code: string): string {
    const normalizedCode = code.toLowerCase();
    if (normalizedCode.includes('brancharea.selectedbranchrequired')) {
      return 'branchUsers.selectedBranchRequired';
    }
    if (normalizedCode.includes('brancharea.selectedbranchnotallowed')) {
      return 'branchUsers.selectedBranchNotAllowed';
    }
    if (normalizedCode.includes('currentbranchscope.currentbranchactornotfound')) {
      return 'branchUsers.currentBranchActorNotFound';
    }
    if (normalizedCode.includes('branchusers.pagination.unauthenticated')) {
      return 'branchUsers.unauthorized';
    }
    if (normalizedCode.includes('getbranchuserspagination_pagenumber_invalid')) {
      return 'branchUsers.pageNumberInvalid';
    }
    if (
      normalizedCode.includes('getbranchuserspagination_pagesize_invalid') ||
      normalizedCode.includes('getbranchuserspagination_pagesize_max')
    ) {
      return 'branchUsers.pageSizeInvalid';
    }
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
    if (normalizedCode.includes('users.resetpassword.scopeviolation')) {
      return 'branchUsers.scopeMismatch';
    }
    if (normalizedCode.includes('users.resetpassword.targetusernotfound')) {
      return 'branchUsers.notFound';
    }
    if (
      normalizedCode.includes('users.resetpassword.targetuserinactive') ||
      normalizedCode.includes('targetuserinactive')
    ) {
      return 'branchUsers.userInactive';
    }
    if (
      normalizedCode.includes('users.resetpassword.notallowed') ||
      normalizedCode.includes('users.resetpassword.forbidden')
    ) {
      return 'branchUsers.forbidden';
    }
    if (normalizedCode.includes('confirmnewpassword')) {
      return 'auth.changePasswordConfirmPasswordNotMatched';
    }
    if (normalizedCode.includes('newpassword') && normalizedCode.includes('required')) {
      return 'auth.changePasswordNewPasswordRequired';
    }
    if (normalizedCode.includes('newpassword') && normalizedCode.includes('maxlength')) {
      return 'auth.changePasswordNewPasswordMaxLength';
    }
    if (normalizedCode.includes('newpassword')) {
      return 'auth.changePasswordNewPasswordMinLength';
    }
    return '';
  }

  private isBranchSelectionError(code: string): boolean {
    return (
      code === 'BranchArea.SelectedBranchRequired' ||
      code === 'BranchArea.SelectedBranchNotAllowed'
    );
  }

  private validateRoleIds(roleIds: readonly string[]): string | null {
    if (roleIds.length === 0) {
      return 'branchUsers.roleIdsRequired';
    }

    if (roleIds.some((roleId) => roleId.length === 0 || roleId === EMPTY_GUID)) {
      return 'branchUsers.roleIdInvalid';
    }

    if (new Set(roleIds).size !== roleIds.length) {
      return 'branchUsers.roleIdInvalid';
    }

    return null;
  }

  private mergeUpdatedUser(updated: BranchUser, fallbackApplicationUserId: string): void {
    const applicationUserId = updated.applicationUserId || fallbackApplicationUserId;

    this.usersSignal.update((users) =>
      users.map((user) =>
        user.applicationUserId === applicationUserId
          ? {
              ...user,
              branchUserId: updated.branchUserId || user.branchUserId,
              applicationUserId,
              branchId: updated.branchId || user.branchId,
              nameEn: updated.nameEn,
              nameAr: updated.nameAr,
              userName: updated.userName || user.userName,
              email: updated.email,
              phoneNumber: updated.phoneNumber,
              isActive: updated.isActive,
              createdBy: updated.createdBy ?? user.createdBy,
              createdOnUtc: updated.createdOnUtc || user.createdOnUtc,
              roles: updated.roles.length > 0 ? updated.roles : user.roles,
            }
          : user,
      ),
    );
  }

  private patchUserState(
    stateChange: BranchUserStateChangeResult,
    fallbackApplicationUserId: string,
  ): void {
    const applicationUserId = stateChange.applicationUserId || fallbackApplicationUserId;

    this.usersSignal.update((users) =>
      users.map((user) =>
        user.applicationUserId === applicationUserId
          ? {
              ...user,
              branchUserId: stateChange.branchUserId || user.branchUserId,
              branchId: stateChange.branchId || user.branchId,
              isActive: stateChange.isActive,
            }
          : user,
      ),
    );
  }

  private patchAssignedRoles(
    result: AssignBranchUserRolesResult,
    fallbackApplicationUserId: string,
  ): void {
    const applicationUserId = result.applicationUserId || fallbackApplicationUserId;

    this.usersSignal.update((users) =>
      users.map((user) =>
        user.applicationUserId === applicationUserId
          ? {
              ...user,
              branchUserId: result.branchUserId || user.branchUserId,
              branchId: result.branchId || user.branchId,
              roles: result.roles,
            }
          : user,
      ),
    );
  }

  private readErrorResponse(value: unknown): ApiErrorResponse | null {
    return typeof value === 'object' && value !== null ? (value as ApiErrorResponse) : null;
  }

  private isUserNameError(code: string): boolean {
    return code.toLowerCase().includes('username');
  }

  private isEmailError(code: string): boolean {
    return code.toLowerCase().includes('email');
  }

  private isRoleIdsError(code: string): boolean {
    const normalizedCode = code.toLowerCase();
    return normalizedCode.includes('roleids') || normalizedCode.includes('roleid_invalid');
  }

  private isRoleSecurityError(code: string): boolean {
    const normalizedCode = code.toLowerCase();
    return normalizedCode.includes('rolenotfound') || normalizedCode.includes('rolenotallowed');
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
