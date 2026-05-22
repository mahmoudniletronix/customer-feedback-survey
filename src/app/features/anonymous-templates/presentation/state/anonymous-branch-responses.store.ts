import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { AnonymousTemplatesService } from '../../data/anonymous-templates.service';
import {
  BranchAnonymousResponsesPageResult,
  BranchAnonymousResponsesQuery,
} from '../../domain/anonymous-template.model';

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
export class AnonymousBranchResponsesStore {
  private readonly defaultQuery: BranchAnonymousResponsesQuery = {
    pageNumber: 1,
    pageSize: 10,
  };

  private readonly anonymousTemplatesService = inject(AnonymousTemplatesService);
  private readonly responsesSignal = signal<BranchAnonymousResponsesPageResult | null>(null);
  private readonly querySignal = signal<BranchAnonymousResponsesQuery>(this.defaultQuery);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly responses = this.responsesSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(query: Partial<BranchAnonymousResponsesQuery> = {}): void {
    if (this.loadingSignal()) {
      return;
    }

    const nextQuery = this.normalizeQuery({
      ...this.querySignal(),
      ...query,
      pageNumber: query.pageNumber ?? this.querySignal().pageNumber,
      pageSize: query.pageSize ?? this.querySignal().pageSize,
    });

    this.querySignal.set(nextQuery);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.anonymousTemplatesService
      .branchAnonymousResponses(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.responsesSignal.set(page);
        },
        error: (error: unknown) => {
          this.responsesSignal.set(null);
          this.errorSignal.set(this.readErrorMessage(error));
        },
      });
  }

  search(query: Partial<BranchAnonymousResponsesQuery>): void {
    this.load({ ...query, pageNumber: 1 });
  }

  previousPage(): void {
    const page = this.responsesSignal();
    if (!page?.hasPreviousPage || this.loadingSignal()) {
      return;
    }

    this.load({ pageNumber: page.currentPage - 1 });
  }

  nextPage(): void {
    const page = this.responsesSignal();
    if (!page?.hasNextPage || this.loadingSignal()) {
      return;
    }

    this.load({ pageNumber: page.currentPage + 1 });
  }

  private normalizeQuery(query: BranchAnonymousResponsesQuery): BranchAnonymousResponsesQuery {
    const pageSize = Math.min(Math.max(Math.trunc(query.pageSize || 10), 1), 100);
    const orderSort = query.orderSort === 'Oldest' || query.orderSort === 'Newest'
      ? query.orderSort
      : '';

    return {
      anonymousTemplateId: this.toOptionalText(query.anonymousTemplateId),
      from: this.toOptionalText(query.from),
      to: this.toOptionalText(query.to),
      minScorePercentage: this.toOptionalNumber(query.minScorePercentage),
      maxScorePercentage: this.toOptionalNumber(query.maxScorePercentage),
      hasComplaint: query.hasComplaint,
      hasVoice: query.hasVoice,
      searchText: this.toOptionalText(query.searchText),
      orderSort,
      pageNumber: Math.max(Math.trunc(query.pageNumber || 1), 1),
      pageSize,
    };
  }

  private toOptionalText(value: string | undefined): string | undefined {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private toOptionalNumber(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private readErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.responsesLoadError';
    }

    const problemMessage = this.readProblemDetailsMessage(error.error);
    if (problemMessage.length > 0) {
      return problemMessage;
    }

    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }
    if (error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.responsesLoadError';
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
}
