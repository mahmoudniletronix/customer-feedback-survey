import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { SuperAdminTemplatesService } from '../../data/super-admin-templates.service';
import {
  CopySuperAdminTemplateToBranchPayload,
  SuperAdminTemplateCopyResult,
  SuperAdminTemplateListItem,
  SuperAdminTemplatesQuery,
} from '../../domain/super-admin-template.model';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
  title?: string;
  detail?: string;
  message?: string;
}

@Injectable()
export class SuperAdminTemplatesStore {
  private readonly defaultQuery: SuperAdminTemplatesQuery = {
    pageNumber: 1,
    pageSize: 10,
    branchId: '',
    templateKind: '',
    isActive: null,
    searchText: '',
    orderSort: '',
  };

  private readonly templatesService = inject(SuperAdminTemplatesService);
  private readonly templatesSignal = signal<readonly SuperAdminTemplateListItem[]>([]);
  private readonly querySignal = signal<SuperAdminTemplatesQuery>(this.defaultQuery);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalPagesSignal = signal(1);
  private readonly totalItemsSignal = signal(0);
  private readonly hasPreviousPageSignal = signal(false);
  private readonly hasNextPageSignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly copyingSignal = signal(false);
  private readonly copyResultSignal = signal<SuperAdminTemplateCopyResult | null>(null);
  private readonly copyErrorSignal = signal<string | null>(null);
  private readonly copySuccessSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);

  readonly templates = this.templatesSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalPages = this.totalPagesSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly hasPreviousPage = this.hasPreviousPageSignal.asReadonly();
  readonly hasNextPage = this.hasNextPageSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly copying = this.copyingSignal.asReadonly();
  readonly copyResult = this.copyResultSignal.asReadonly();
  readonly copyError = this.copyErrorSignal.asReadonly();
  readonly copySuccess = this.copySuccessSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isEmpty = computed(
    () => !this.loadingSignal() && this.templatesSignal().length === 0 && this.errorSignal() === null,
  );

  load(query: Partial<SuperAdminTemplatesQuery> = {}): void {
    if (this.loadingSignal()) {
      return;
    }

    const nextQuery: SuperAdminTemplatesQuery = {
      ...this.querySignal(),
      ...query,
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
    };

    this.querySignal.set(nextQuery);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.templatesService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.templatesSignal.set(page.data.filter((template) => template.templateId.length > 0));
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalPagesSignal.set(page.totalPages);
          this.totalItemsSignal.set(page.totalItems);
          this.hasPreviousPageSignal.set(page.hasPreviousPage);
          this.hasNextPageSignal.set(page.hasNextPage);
        },
        error: (error: unknown) => {
          this.templatesSignal.set([]);
          this.totalItemsSignal.set(0);
          this.totalPagesSignal.set(1);
          this.hasPreviousPageSignal.set(false);
          this.hasNextPageSignal.set(false);
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  search(query: Omit<SuperAdminTemplatesQuery, 'pageNumber'>): void {
    this.load({ ...query, pageNumber: 1 });
  }

  previousPage(): void {
    if (this.hasPreviousPageSignal()) {
      this.load({ pageNumber: this.currentPageSignal() - 1 });
    }
  }

  nextPage(): void {
    if (this.hasNextPageSignal()) {
      this.load({ pageNumber: this.currentPageSignal() + 1 });
    }
  }

  copyToBranch(payload: CopySuperAdminTemplateToBranchPayload, onCopied?: () => void): void {
    if (this.copyingSignal()) {
      return;
    }

    this.copyingSignal.set(true);
    this.copyErrorSignal.set(null);
    this.copySuccessSignal.set(null);
    this.copyResultSignal.set(null);

    this.templatesService
      .copyToBranch(payload)
      .pipe(
        take(1),
        finalize(() => this.copyingSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.copyResultSignal.set(result);
          this.copySuccessSignal.set('superAdminTemplates.copySuccess');
          this.load();
          onCopied?.();
        },
        error: (error: unknown) => {
          this.copyErrorSignal.set(this.readCopyErrorMessage(error));
        },
      });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  clearCopyState(): void {
    this.copyErrorSignal.set(null);
    this.copySuccessSignal.set(null);
    this.copyResultSignal.set(null);
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'superAdminTemplates.loadError';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }
    return 'superAdminTemplates.loadError';
  }

  private readCopyErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'superAdminTemplates.copyError';
    }

    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }

    const backendMessage = this.readProblemDetailsMessage(error.error);
    if (backendMessage) {
      return backendMessage;
    }

    if (error.status === 404) {
      return 'superAdminTemplates.copyNotFound';
    }
    if (error.status === 409) {
      return 'superAdminTemplates.copyAlreadyExists';
    }
    if (error.status === 400 || error.status === 422) {
      return 'superAdminTemplates.copyValidationError';
    }

    return 'superAdminTemplates.copyError';
  }

  private readProblemDetailsMessage(errorBody: unknown): string | null {
    if (!this.isApiErrorResponse(errorBody)) {
      return null;
    }

    const firstError = errorBody.errors?.[0];
    return (
      firstError?.message ??
      firstError?.messageName ??
      firstError?.code ??
      errorBody.detail ??
      errorBody.message ??
      errorBody.title ??
      null
    );
  }

  private isApiErrorResponse(errorBody: unknown): errorBody is ApiErrorResponse {
    return typeof errorBody === 'object' && errorBody !== null;
  }
}
