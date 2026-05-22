import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { DepartmentReportsService } from '../../data/department-reports.service';
import {
  DepartmentOperatorResponsesPagination,
  DepartmentOperatorResponsesQuery,
  DepartmentReportTemplateOption,
} from '../../domain/department-reports.model';

@Injectable()
export class DepartmentOperatorResponsesStore {
  private readonly reportsService = inject(DepartmentReportsService);
  private readonly router = inject(Router);

  private readonly operatorIdSignal = signal('');
  private readonly responsesSignal = signal<DepartmentOperatorResponsesPagination | null>(null);
  private readonly templatesSignal = signal<readonly DepartmentReportTemplateOption[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly templatesLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<DepartmentOperatorResponsesQuery>({
    pageNumber: 1,
    pageSize: 10,
    orderSort: 'Newest',
  });

  readonly operatorId = this.operatorIdSignal.asReadonly();
  readonly responses = this.responsesSignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly templatesLoading = this.templatesLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isEmpty = computed(() => (this.responsesSignal()?.data.length ?? 0) === 0);
  readonly operatorName = computed(() => {
    const firstResponse = this.responsesSignal()?.data[0];
    return firstResponse ? firstResponse.operatorNameEn || firstResponse.operatorNameAr || '-' : '-';
  });

  setOperator(operatorId: string): void {
    this.operatorIdSignal.set(operatorId);
  }

  load(query: DepartmentOperatorResponsesQuery = this.querySignal()): void {
    const operatorId = this.operatorIdSignal();
    if (!operatorId) {
      this.errorSignal.set('departmentOperatorResponses.operatorIdRequired');
      return;
    }

    const normalizedQuery = this.normalizeQuery(query);
    const validationError = this.validateQuery(normalizedQuery);
    if (validationError) {
      this.responsesSignal.set(null);
      this.querySignal.set(normalizedQuery);
      this.errorSignal.set(validationError);
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(normalizedQuery);

    this.reportsService
      .getOperatorResponses(operatorId, normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (responses) => this.responsesSignal.set(responses),
        error: (error: unknown) => {
          this.responsesSignal.set(null);
          this.handleError(error);
        },
      });
  }

  loadTemplates(): void {
    this.templatesLoadingSignal.set(true);

    this.reportsService
      .getTemplateOptions()
      .pipe(
        take(1),
        finalize(() => this.templatesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (templates) => this.templatesSignal.set(templates),
        error: () => this.templatesSignal.set([]),
      });
  }

  goToPage(pageNumber: number): void {
    const current = this.responsesSignal();
    const totalPages = Math.max(current?.totalPages ?? 1, 1);
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    this.load({ ...this.querySignal(), pageNumber: nextPage });
  }

  private normalizeQuery(query: DepartmentOperatorResponsesQuery): DepartmentOperatorResponsesQuery {
    return {
      from: query.from || undefined,
      to: query.to || undefined,
      templateId: query.templateId || undefined,
      minScorePercentage: this.normalizeOptionalNumber(query.minScorePercentage),
      maxScorePercentage: this.normalizeOptionalNumber(query.maxScorePercentage),
      hasComplaint: query.hasComplaint,
      hasVoice: query.hasVoice,
      searchText: query.searchText?.trim() || undefined,
      orderSort: query.orderSort ?? 'Newest',
      pageNumber: Math.max(Math.floor(query.pageNumber || 1), 1),
      pageSize: Math.min(Math.max(Math.floor(query.pageSize || 10), 1), 100),
    };
  }

  private normalizeOptionalNumber(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private validateQuery(query: DepartmentOperatorResponsesQuery): string | null {
    if (query.pageNumber < 1) {
      return 'departmentOperatorResponses.invalidPageNumber';
    }
    if (query.pageSize < 1 || query.pageSize > 100) {
      return 'departmentOperatorResponses.invalidPageSize';
    }
    if (
      (query.minScorePercentage !== undefined &&
        (query.minScorePercentage < 0 || query.minScorePercentage > 100)) ||
      (query.maxScorePercentage !== undefined &&
        (query.maxScorePercentage < 0 || query.maxScorePercentage > 100))
    ) {
      return 'departmentOperatorResponses.invalidScoreRange';
    }
    if (
      query.minScorePercentage !== undefined &&
      query.maxScorePercentage !== undefined &&
      query.minScorePercentage > query.maxScorePercentage
    ) {
      return 'departmentOperatorResponses.invalidScoreOrder';
    }

    return this.validateDateRange(query.from, query.to);
  }

  private validateDateRange(from: string | undefined, to: string | undefined): string | null {
    if (!from || !to) {
      return null;
    }

    const fromDate = this.toDate(from);
    const toDate = this.toDate(to);
    if (!fromDate || !toDate || fromDate > toDate) {
      return 'departmentOperatorResponses.invalidDateOrder';
    }

    const maxTo = new Date(fromDate);
    maxTo.setMonth(maxTo.getMonth() + 12);
    return toDate > maxTo ? 'departmentOperatorResponses.invalidDateRange' : null;
  }

  private toDate(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('departmentOperatorResponses.unavailable');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }
    if (error.status === 403) {
      this.errorSignal.set('departmentOperatorResponses.noPermission');
      return;
    }
    if (error.status === 404) {
      this.errorSignal.set('departmentOperatorResponses.operatorNotFound');
      return;
    }
    if (error.status === 400 || error.status === 422) {
      this.errorSignal.set('departmentOperatorResponses.invalidFilters');
      return;
    }

    this.errorSignal.set('departmentOperatorResponses.unavailable');
  }
}
