import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, switchMap, take } from 'rxjs';
import {
  CreateOperatorPayload,
  CreateOperatorResponse,
  OperatorActiveTemplateSelection,
  OperatorDepartmentSelection,
  OperatorListItem,
  OperatorTemplatesSelection,
  OperatorsQuery,
  UpdateOperatorPayload,
  UpdateOperatorTemplatesPayload,
} from '../../domain/operator.model';
import { OperatorsService } from '../../data/operators.service';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import { ResetUserPasswordRequest } from '../../../../auth/domain/user-password-reset.model';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
  title?: string;
  detail?: string;
}

@Injectable()
export class OperatorsStore {
  private readonly defaultQuery: OperatorsQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    departmentId: '',
  };

  private readonly operatorsService = inject(OperatorsService);
  private readonly userPasswordResetService = inject(UserPasswordResetService);
  private readonly operatorsSignal = signal<readonly OperatorListItem[]>([]);
  private readonly departmentsSignal = signal<readonly OperatorDepartmentSelection[]>([]);
  private readonly activeTemplatesSignal = signal<readonly OperatorActiveTemplateSelection[]>([]);
  private readonly createdOperatorSignal = signal<CreateOperatorResponse | null>(null);
  private readonly templatesSelectionSignal = signal<OperatorTemplatesSelection | null>(null);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly departmentIdSignal = signal(this.defaultQuery.departmentId);
  private readonly loadingSignal = signal(false);
  private readonly departmentsLoadingSignal = signal(false);
  private readonly activeTemplatesLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly resettingPasswordSignal = signal(false);
  private readonly templatesSelectionLoadingSignal = signal(false);
  private readonly templatesSelectionSavingSignal = signal(false);
  private readonly templatesSelectionErrorSignal = signal<string | null>(null);
  private readonly activeTemplatesErrorSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly operators = this.operatorsSignal.asReadonly();
  readonly departments = this.departmentsSignal.asReadonly();
  readonly activeTemplates = this.activeTemplatesSignal.asReadonly();
  readonly createdOperator = this.createdOperatorSignal.asReadonly();
  readonly templatesSelection = this.templatesSelectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly departmentId = this.departmentIdSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly departmentsLoading = this.departmentsLoadingSignal.asReadonly();
  readonly activeTemplatesLoading = this.activeTemplatesLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly resettingPassword = this.resettingPasswordSignal.asReadonly();
  readonly templatesSelectionLoading = this.templatesSelectionLoadingSignal.asReadonly();
  readonly templatesSelectionSaving = this.templatesSelectionSavingSignal.asReadonly();
  readonly templatesSelectionError = this.templatesSelectionErrorSignal.asReadonly();
  readonly activeTemplatesError = this.activeTemplatesErrorSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<OperatorsQuery> = {}): void {
    const nextQuery: OperatorsQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
      departmentId: query.departmentId ?? this.departmentIdSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.departmentIdSignal.set(nextQuery.departmentId);

    this.operatorsService
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
          this.operatorsSignal.set(page.data.filter((operator) => operator.operatorId.length > 0));
        },
        error: (error: unknown) => {
          this.operatorsSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'operators.loadError'));
        },
      });
  }

  loadDepartments(): void {
    if (this.departmentsLoadingSignal()) {
      return;
    }

    this.departmentsLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.operatorsService
      .departmentSelection()
      .pipe(
        take(1),
        finalize(() => this.departmentsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (departments) => {
          this.departmentsSignal.set(departments);
        },
        error: (error: unknown) => {
          this.departmentsSignal.set([]);
          this.errorSignal.set(this.readErrorKey(error, 'operators.departmentsLoadError'));
        },
      });
  }

  loadActiveTemplates(): void {
    if (this.activeTemplatesLoadingSignal()) {
      return;
    }

    this.activeTemplatesLoadingSignal.set(true);
    this.activeTemplatesErrorSignal.set(null);

    this.operatorsService
      .activeTemplatesSelection()
      .pipe(
        take(1),
        finalize(() => this.activeTemplatesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (templates) => {
          this.activeTemplatesSignal.set(templates);
        },
        error: (error: unknown) => {
          this.activeTemplatesSignal.set([]);
          this.activeTemplatesErrorSignal.set(this.readErrorKey(error, 'operators.templatesCatalogLoadError'));
        },
      });
  }

  search(searchText: string, departmentId: string, pageSize = this.pageSizeSignal()): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      pageSize,
      searchText,
      departmentId,
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

  createOperator(payload: CreateOperatorPayload, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.operatorsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (operator) => {
          this.createdOperatorSignal.set(operator);
          this.successSignal.set('operators.createSuccess');
          this.load({ pageNumber: this.defaultQuery.pageNumber });
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'operators.createError'));
        },
      });
  }

  updateOperator(operatorId: string, payload: UpdateOperatorPayload, onUpdated: () => void): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.operatorsService
      .update(operatorId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (operator) => {
          this.successSignal.set('operators.updateSuccess');
          this.replaceOperator(operatorId, operator);
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'operators.updateError'));
        },
      });
  }

  loadTemplatesSelection(operatorId: string, searchText = ''): void {
    if (this.templatesSelectionLoadingSignal()) {
      return;
    }

    this.templatesSelectionLoadingSignal.set(true);
    this.templatesSelectionErrorSignal.set(null);

    this.operatorsService
      .templatesSelection(operatorId, searchText)
      .pipe(
        take(1),
        finalize(() => this.templatesSelectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (selection) => {
          this.templatesSelectionSignal.set(selection);
        },
        error: (error: unknown) => {
          this.templatesSelectionSignal.set(null);
          this.templatesSelectionErrorSignal.set(this.readErrorKey(error, 'operators.templatesSelectionLoadError'));
        },
      });
  }

  updateTemplatesSelection(operatorId: string, payload: UpdateOperatorTemplatesPayload, searchText = ''): void {
    if (this.templatesSelectionSavingSignal()) {
      return;
    }

    this.templatesSelectionSavingSignal.set(true);
    this.templatesSelectionErrorSignal.set(null);
    this.successSignal.set(null);

    this.operatorsService
      .templatesSelection(operatorId, searchText)
      .pipe(
        take(1),
        switchMap((selection) => {
          this.templatesSelectionSignal.set(selection);
          const availableTemplateIds = new Set(
            [...selection.selectedTemplates, ...selection.availableTemplates].map(
              (template) => template.templateId,
            ),
          );
          const refreshedPayload: UpdateOperatorTemplatesPayload = {
            templateIds: payload.templateIds.filter((templateId) =>
              availableTemplateIds.has(templateId),
            ),
          };

          return this.operatorsService.updateTemplatesSelection(operatorId, refreshedPayload);
        }),
        take(1),
        finalize(() => this.templatesSelectionSavingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('operators.templatesSelectionUpdateSuccess');
          this.loadTemplatesSelection(operatorId, searchText);
        },
        error: (error: unknown) => {
          this.templatesSelectionErrorSignal.set(this.readErrorKey(error, 'operators.templatesSelectionUpdateError'));
          if (this.shouldRefreshTemplatesSelectionAfterAssignError(error)) {
            this.loadTemplatesSelection(operatorId, searchText);
          }
        },
      });
  }

  resetPassword(
    applicationUserId: string,
    payload: ResetUserPasswordRequest,
    onReset: () => void,
  ): void {
    if (this.resettingPasswordSignal()) {
      return;
    }

    this.resettingPasswordSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.userPasswordResetService
      .resetPassword(applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.resettingPasswordSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('operators.resetPasswordSuccess');
          onReset();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'operators.resetPasswordError'));
        },
      });
  }

  clearTemplatesSelection(): void {
    this.templatesSelectionSignal.set(null);
    this.templatesSelectionErrorSignal.set(null);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
    this.templatesSelectionErrorSignal.set(null);
    this.activeTemplatesErrorSignal.set(null);
  }

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const marker = this.readErrorMarker(error.error);
    const mappedError = this.mapBackendError(marker);
    if (mappedError.length > 0) {
      return mappedError;
    }

    if (error.status === 401) {
      return 'operators.unauthorized';
    }
    if (error.status === 403) {
      return 'operators.forbidden';
    }
    if (error.status === 404) {
      return 'operators.departmentNotFound';
    }
    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'operators.validationError';
    }

    return fallbackKey;
  }

  private mapBackendError(marker: string): string {
    const normalized = marker.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('departmentnotfound') || normalized.includes('invaliddepartmentid')) {
      return 'operators.departmentNotFound';
    }
    if (normalized.includes('currentactor') || normalized.includes('notallowed')) {
      return 'operators.currentActorNotAllowed';
    }
    if (normalized.includes('self') || normalized.includes('ownpassword')) {
      return 'users.resetPasswordSelfForbidden';
    }
    if (normalized.includes('targetusernotfound')) {
      return 'operators.notFound';
    }
    if (normalized.includes('targetuserinactive') || normalized.includes('userinactive')) {
      return 'operators.userInactive';
    }
    if (normalized.includes('scope') || normalized.includes('mismatch')) {
      return 'operators.scopeMismatch';
    }
    if (normalized.includes('username') && normalized.includes('already')) {
      return 'operators.userNameAlreadyExists';
    }
    if (normalized.includes('email') && normalized.includes('already')) {
      return 'operators.emailAlreadyExists';
    }
    if (normalized.includes('confirmnewpassword')) {
      return 'auth.changePasswordConfirmPasswordNotMatched';
    }
    if (normalized.includes('newpassword') && normalized.includes('required')) {
      return 'auth.changePasswordNewPasswordRequired';
    }
    if (normalized.includes('newpassword') && normalized.includes('maxlength')) {
      return 'auth.changePasswordNewPasswordMaxLength';
    }
    if (normalized.includes('newpassword')) {
      return 'auth.changePasswordNewPasswordMinLength';
    }
    if (normalized.includes('password')) {
      return 'operators.passwordInvalid';
    }
    if (
      normalized.includes('templatenotfoundorinactive') ||
      (normalized.includes('template') &&
        (normalized.includes('inactive') ||
          normalized.includes('expired') ||
          normalized.includes('notfound')))
    ) {
      return 'operators.templateNotFoundOrInactive';
    }
    return '';
  }

  private shouldRefreshTemplatesSelectionAfterAssignError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    const marker = this.readErrorMarker(error.error).replace(/[\s_-]/g, '').toLowerCase();
    return (
      error.status === 400 ||
      error.status === 422 ||
      marker.includes('templatenotfoundorinactive') ||
      (marker.includes('template') &&
        (marker.includes('inactive') || marker.includes('expired') || marker.includes('notfound')))
    );
  }

  private readErrorMarker(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return [firstError?.code, firstError?.messageName, firstError?.message, errorBody.detail, errorBody.title]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
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

  private replaceOperator(operatorId: string, updatedOperator: UpdateOperatorPayload & { operatorId: string; applicationUserId: string; departmentId: string }): void {
    this.operatorsSignal.update((operators) =>
      operators.map((operator) =>
        operator.operatorId === operatorId
          ? {
              ...operator,
              operatorId: updatedOperator.operatorId || operator.operatorId,
              applicationUserId: updatedOperator.applicationUserId || operator.applicationUserId,
              departmentId: updatedOperator.departmentId || operator.departmentId,
              nameEn: updatedOperator.nameEn,
              nameAr: updatedOperator.nameAr,
              email: updatedOperator.email,
              phoneNumber: updatedOperator.phoneNumber,
            }
          : operator,
      ),
    );
  }
}
