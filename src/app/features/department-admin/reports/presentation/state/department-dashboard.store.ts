import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { DepartmentReportsService } from '../../data/department-reports.service';
import {
  DepartmentDashboardQuery,
  DepartmentDashboardResponse,
  DepartmentReportTemplateOption,
} from '../../domain/department-reports.model';

@Injectable()
export class DepartmentDashboardStore {
  private readonly reportsService = inject(DepartmentReportsService);
  private readonly router = inject(Router);

  private readonly dashboardSignal = signal<DepartmentDashboardResponse | null>(null);
  private readonly templatesSignal = signal<readonly DepartmentReportTemplateOption[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly templatesLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<DepartmentDashboardQuery>({
    groupBy: 'Day',
    topQuestionsCount: 5,
    criticalResponsesCount: 10,
    criticalScoreThreshold: 40,
  });

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly templatesLoading = this.templatesLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isEmpty = computed(() => (this.dashboardSignal()?.summary.totalResponses ?? 0) === 0);

  load(query: DepartmentDashboardQuery = this.querySignal()): void {
    const normalizedQuery = this.normalizeQuery(query);
    const validationError = this.validateDateRange(normalizedQuery.from, normalizedQuery.to);

    if (validationError) {
      this.dashboardSignal.set(null);
      this.querySignal.set(normalizedQuery);
      this.errorSignal.set(validationError);
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(normalizedQuery);

    this.reportsService
      .getDashboard(normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.dashboardSignal.set(dashboard),
        error: (error: unknown) => {
          this.dashboardSignal.set(null);
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

  private normalizeQuery(query: DepartmentDashboardQuery): DepartmentDashboardQuery {
    return {
      from: query.from || undefined,
      to: query.to || undefined,
      templateId: query.templateId || undefined,
      groupBy: query.groupBy ?? 'Day',
      topQuestionsCount: this.normalizePositiveInteger(query.topQuestionsCount, 5),
      criticalResponsesCount: this.normalizePositiveInteger(query.criticalResponsesCount, 10),
      criticalScoreThreshold: this.normalizeScore(query.criticalScoreThreshold, 40),
    };
  }

  private normalizePositiveInteger(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? Math.floor(value)
      : fallback;
  }

  private normalizeScore(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(Math.max(value, 0), 100);
  }

  private validateDateRange(from: string | undefined, to: string | undefined): string | null {
    if (!from || !to) {
      return null;
    }

    const fromDate = this.toDate(from);
    const toDate = this.toDate(to);
    if (!fromDate || !toDate || fromDate > toDate) {
      return 'departmentDashboard.invalidDateOrder';
    }

    const maxTo = new Date(fromDate);
    maxTo.setMonth(maxTo.getMonth() + 12);
    if (toDate > maxTo) {
      return 'departmentDashboard.dateRangeExceeded';
    }

    return null;
  }

  private toDate(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('departmentDashboard.loadError');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }
    if (error.status === 403) {
      this.errorSignal.set('departmentDashboard.forbidden');
      return;
    }
    if (error.status === 400 || error.status === 422) {
      this.errorSignal.set('departmentDashboard.invalidFilters');
      return;
    }
    if (error.status === 404) {
      this.errorSignal.set('departmentDashboard.templateNotFound');
      return;
    }

    this.errorSignal.set('departmentDashboard.loadError');
  }
}
