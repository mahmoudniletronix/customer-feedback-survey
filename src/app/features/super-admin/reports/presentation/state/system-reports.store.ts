import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize, take } from 'rxjs';
import { SystemReportsService } from '../../data/system-reports.service';
import {
  ReportBranchOption,
  ReportDepartmentOption,
  SystemDashboardQuery,
  SystemDashboardResponse,
  SystemResponseDetails,
  SystemResponsesPagination,
  SystemResponsesQuery,
} from '../../domain/system-reports.model';

@Injectable()
export class SystemReportsStore {
  private readonly reportsService = inject(SystemReportsService);
  private readonly router = inject(Router);

  private readonly dashboardSignal = signal<SystemDashboardResponse | null>(null);
  private readonly dashboardLoadingSignal = signal(false);
  private readonly dashboardErrorSignal = signal<string | null>(null);
  private readonly responsesSignal = signal<SystemResponsesPagination | null>(null);
  private readonly responsesLoadingSignal = signal(false);
  private readonly responsesErrorSignal = signal<string | null>(null);
  private readonly responsesQuerySignal = signal<SystemResponsesQuery>({ pageNumber: 1, pageSize: 10 });
  private readonly branchesSignal = signal<readonly ReportBranchOption[]>([]);
  private readonly departmentsSignal = signal<readonly ReportDepartmentOption[]>([]);
  private readonly detailsOpenSignal = signal(false);
  private readonly detailsSignal = signal<SystemResponseDetails | null>(null);
  private readonly detailsLoadingSignal = signal(false);
  private readonly detailsErrorSignal = signal<string | null>(null);

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly dashboardLoading = this.dashboardLoadingSignal.asReadonly();
  readonly dashboardError = this.dashboardErrorSignal.asReadonly();
  readonly dashboardEmpty = computed(() => (this.dashboardSignal()?.summary.totalResponses ?? 0) === 0);
  readonly responses = this.responsesSignal.asReadonly();
  readonly responsesLoading = this.responsesLoadingSignal.asReadonly();
  readonly responsesError = this.responsesErrorSignal.asReadonly();
  readonly responsesQuery = this.responsesQuerySignal.asReadonly();
  readonly responsesEmpty = computed(() => (this.responsesSignal()?.data.length ?? 0) === 0);
  readonly branches = this.branchesSignal.asReadonly();
  readonly departments = this.departmentsSignal.asReadonly();
  readonly detailsOpen = this.detailsOpenSignal.asReadonly();
  readonly details = this.detailsSignal.asReadonly();
  readonly detailsLoading = this.detailsLoadingSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();

  loadOptions(): void {
    forkJoin({
      branches: this.reportsService.getBranchOptions(),
      departments: this.reportsService.getDepartmentOptions(),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ branches, departments }) => {
          this.branchesSignal.set(branches);
          this.departmentsSignal.set(departments);
        },
        error: () => {
          this.branchesSignal.set([]);
          this.departmentsSignal.set([]);
        },
      });
  }

  loadDashboard(query: SystemDashboardQuery = {}): void {
    const normalizedQuery = {
      from: query.from || undefined,
      to: query.to || undefined,
      branchId: query.branchId || undefined,
      departmentId: query.departmentId || undefined,
      groupBy: query.groupBy ?? 'Day',
      criticalScoreThreshold: query.criticalScoreThreshold ?? 40,
      criticalResponsesCount: query.criticalResponsesCount ?? 10,
      topTemplatesCount: query.topTemplatesCount ?? 10,
    };

    this.dashboardLoadingSignal.set(true);
    this.dashboardErrorSignal.set(null);
    this.reportsService
      .getDashboard(normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.dashboardLoadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.dashboardSignal.set(dashboard),
        error: (error: unknown) => {
          this.dashboardSignal.set(null);
          this.dashboardErrorSignal.set(this.errorKey(error, 'System dashboard is temporarily unavailable.'));
        },
      });
  }

  loadResponses(query: SystemResponsesQuery = this.responsesQuerySignal()): void {
    const normalizedQuery = this.normalizeResponsesQuery(query);
    this.responsesLoadingSignal.set(true);
    this.responsesErrorSignal.set(null);
    this.responsesQuerySignal.set(normalizedQuery);
    this.reportsService
      .getResponses(normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.responsesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (responses) => this.responsesSignal.set(responses),
        error: (error: unknown) => {
          this.responsesSignal.set(null);
          this.responsesErrorSignal.set(this.errorKey(error, 'System responses are temporarily unavailable.'));
        },
      });
  }

  goToResponsesPage(pageNumber: number): void {
    const current = this.responsesSignal();
    const totalPages = Math.max(current?.totalPages ?? 1, 1);
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    this.loadResponses({ ...this.responsesQuerySignal(), pageNumber: nextPage });
  }

  loadDetails(surveyResponseId: string): void {
    if (!surveyResponseId) return;
    this.detailsOpenSignal.set(true);
    this.detailsSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.detailsLoadingSignal.set(true);
    this.reportsService
      .getResponseDetails(surveyResponseId)
      .pipe(
        take(1),
        finalize(() => this.detailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => this.detailsSignal.set(details),
        error: (error: unknown) => {
          this.detailsSignal.set(null);
          this.detailsErrorSignal.set(this.errorKey(error, 'Response details are temporarily unavailable.'));
        },
      });
  }

  closeDetails(): void {
    this.detailsOpenSignal.set(false);
    this.detailsSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.detailsLoadingSignal.set(false);
  }

  private normalizeResponsesQuery(query: SystemResponsesQuery): SystemResponsesQuery {
    return {
      from: query.from || undefined,
      to: query.to || undefined,
      branchId: query.branchId || undefined,
      departmentId: query.departmentId || undefined,
      templateId: query.templateId || undefined,
      minScorePercentage: this.normalizeNumber(query.minScorePercentage),
      maxScorePercentage: this.normalizeNumber(query.maxScorePercentage),
      hasComplaint: query.hasComplaint,
      hasVoice: query.hasVoice,
      searchText: query.searchText?.trim() || undefined,
      pageNumber: Math.max(query.pageNumber || 1, 1),
      pageSize: Math.min(Math.max(query.pageSize || 10, 5), 100),
    };
  }

  private normalizeNumber(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private errorKey(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return fallback;
    }
    if (error.status === 403) return 'You do not have permission to view system reports.';
    if (error.status === 404) return 'Survey response was not found.';
    if (error.status === 400 || error.status === 422) return 'Invalid filters. Please check date range or score range.';
    return fallback;
  }
}
