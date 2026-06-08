import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of, take } from 'rxjs';
import { AnonymousTemplateResponseDetails } from '../../../../anonymous-templates/domain/anonymous-template.model';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchSurveyResponseDetails } from '../../../../branch-admin/dashboard/domain/branch-dashboard.model';
import { SurveyDashboardService } from '../../data/survey-dashboard.service';
import {
  SurveyDashboardBranchOption,
  SurveyDashboardNavigation,
  SurveyDashboardQuery,
  SurveyDashboardResponse,
  SurveyDashboardTemplateDetails,
  SurveyDashboardTemplateOption,
  SurveyDashboardTemplatePerformance,
  SurveyDashboardTemplatesSelectionQuery,
} from '../../domain/survey-dashboard.model';

@Injectable()
export class SurveyDashboardStore {
  private readonly dashboardService = inject(SurveyDashboardService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  private readonly dashboardSignal = signal<SurveyDashboardResponse | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<SurveyDashboardQuery>({
    source: 'All',
    groupBy: 'Day',
    topQuestionsCount: 5,
    criticalResponsesCount: 10,
    criticalScoreThreshold: 40,
  });

  private readonly branchesSignal = signal<readonly SurveyDashboardBranchOption[]>([]);
  private readonly templatesSignal = signal<readonly SurveyDashboardTemplateOption[]>([]);
  private readonly optionsLoadingSignal = signal(false);

  private readonly internalDetailsOpenSignal = signal(false);
  private readonly internalDetailsSignal = signal<BranchSurveyResponseDetails | null>(null);
  private readonly internalDetailsLoadingSignal = signal(false);
  private readonly internalDetailsErrorSignal = signal<string | null>(null);

  private readonly anonymousDetailsOpenSignal = signal(false);
  private readonly anonymousDetailsSignal = signal<AnonymousTemplateResponseDetails | null>(null);
  private readonly anonymousDetailsLoadingSignal = signal(false);
  private readonly anonymousDetailsErrorSignal = signal<string | null>(null);

  private readonly templateDetailsOpenSignal = signal(false);
  private readonly templateDetailsSignal = signal<SurveyDashboardTemplateDetails | null>(null);
  private readonly templateDetailsLoadingSignal = signal(false);
  private readonly templateDetailsErrorSignal = signal<string | null>(null);

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly branches = this.branchesSignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();
  readonly optionsLoading = this.optionsLoadingSignal.asReadonly();
  readonly isEmpty = computed(() => (this.dashboardSignal()?.summary.totalResponses ?? 0) === 0);

  readonly internalDetailsOpen = this.internalDetailsOpenSignal.asReadonly();
  readonly internalDetails = this.internalDetailsSignal.asReadonly();
  readonly internalDetailsLoading = this.internalDetailsLoadingSignal.asReadonly();
  readonly internalDetailsError = this.internalDetailsErrorSignal.asReadonly();

  readonly anonymousDetailsOpen = this.anonymousDetailsOpenSignal.asReadonly();
  readonly anonymousDetails = this.anonymousDetailsSignal.asReadonly();
  readonly anonymousDetailsLoading = this.anonymousDetailsLoadingSignal.asReadonly();
  readonly anonymousDetailsError = this.anonymousDetailsErrorSignal.asReadonly();

  readonly templateDetailsOpen = this.templateDetailsOpenSignal.asReadonly();
  readonly templateDetails = this.templateDetailsSignal.asReadonly();
  readonly templateDetailsLoading = this.templateDetailsLoadingSignal.asReadonly();
  readonly templateDetailsError = this.templateDetailsErrorSignal.asReadonly();

  loadOptions(): void {
    if (this.authStore.role() !== 'SUPER_ADMIN') {
      this.branchesSignal.set([]);
      this.loadTemplateOptions();
      return;
    }

    this.optionsLoadingSignal.set(true);
    this.templatesSignal.set([]);

    this.dashboardService
      .getBranchOptions()
      .pipe(
        catchError(() => of([] as readonly SurveyDashboardBranchOption[])),
        take(1),
        finalize(() => this.optionsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (branches) => this.branchesSignal.set(branches),
        error: () => {
          this.branchesSignal.set([]);
          this.templatesSignal.set([]);
        },
      });
  }

  loadTemplateOptions(query: SurveyDashboardTemplatesSelectionQuery = {}): void {
    if (this.authStore.role() === 'SUPER_ADMIN' && !query.branchId) {
      this.templatesSignal.set([]);
      return;
    }

    this.optionsLoadingSignal.set(true);

    this.dashboardService
      .getDashboardTemplateOptions(query)
      .pipe(
        catchError(() => of([] as readonly SurveyDashboardTemplateOption[])),
        take(1),
        finalize(() => this.optionsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (templates) => this.templatesSignal.set(templates),
        error: () => this.templatesSignal.set([]),
      });
  }

  loadDashboard(query: SurveyDashboardQuery = this.querySignal()): void {
    const normalizedQuery = this.normalizeQuery(query);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(normalizedQuery);

    this.dashboardService
      .getDashboard(normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => {
          this.dashboardSignal.set(dashboard);
          this.mergeBranchOptionsFromDashboard(dashboard);
          this.mergeTemplateOptionsFromDashboard(dashboard);
        },
        error: (error: unknown) => {
          this.dashboardSignal.set(null);
          this.errorSignal.set(this.errorMessage(error, 'Survey dashboard is temporarily unavailable.'));
        },
      });
  }

  loadDashboardFromNavigation(navigation: SurveyDashboardNavigation): void {
    if (!this.canUseNavigation(navigation)) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.dashboardService
      .getDashboardByPath(this.scopedNavigationPath(navigation.path))
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => {
          this.dashboardSignal.set(dashboard);
          this.mergeBranchOptionsFromDashboard(dashboard);
          this.mergeTemplateOptionsFromDashboard(dashboard);
        },
        error: (error: unknown) => {
          this.dashboardSignal.set(null);
          this.errorSignal.set(this.errorMessage(error, 'Survey dashboard is temporarily unavailable.'));
        },
      });
  }

  loadInternalResponseDetails(navigation: SurveyDashboardNavigation): void {
    if (!this.canUseNavigation(navigation)) {
      return;
    }

    this.internalDetailsOpenSignal.set(true);
    this.internalDetailsSignal.set(null);
    this.internalDetailsErrorSignal.set(null);
    this.internalDetailsLoadingSignal.set(true);

    this.dashboardService
      .getInternalResponseDetailsByPath(this.scopedNavigationPath(navigation.path))
      .pipe(
        take(1),
        finalize(() => this.internalDetailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => this.internalDetailsSignal.set(details),
        error: (error: unknown) => {
          this.internalDetailsSignal.set(null);
          this.internalDetailsErrorSignal.set(
            this.errorMessage(error, 'Response details are temporarily unavailable.'),
          );
        },
      });
  }

  loadAnonymousResponseDetails(navigation: SurveyDashboardNavigation): void {
    if (!this.canUseNavigation(navigation)) {
      return;
    }

    this.anonymousDetailsOpenSignal.set(true);
    this.anonymousDetailsSignal.set(null);
    this.anonymousDetailsErrorSignal.set(null);
    this.anonymousDetailsLoadingSignal.set(true);

    this.dashboardService
      .getAnonymousResponseDetailsByPath(this.scopedNavigationPath(navigation.path))
      .pipe(
        take(1),
        finalize(() => this.anonymousDetailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => this.anonymousDetailsSignal.set(details),
        error: (error: unknown) => {
          this.anonymousDetailsSignal.set(null);
          this.anonymousDetailsErrorSignal.set(
            this.errorMessage(error, 'Response details are temporarily unavailable.'),
          );
        },
      });
  }

  loadTemplateDetails(template: SurveyDashboardTemplatePerformance): void {
    if (
      template.templateId.length === 0 ||
      (template.source !== 'Internal' && template.source !== 'Anonymous')
    ) {
      return;
    }

    this.templateDetailsOpenSignal.set(true);
    this.templateDetailsSignal.set(null);
    this.templateDetailsErrorSignal.set(null);
    this.templateDetailsLoadingSignal.set(true);

    this.dashboardService
      .getTemplateDetails(template.templateId, template.source)
      .pipe(
        take(1),
        finalize(() => this.templateDetailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => this.templateDetailsSignal.set(details),
        error: (error: unknown) => {
          this.templateDetailsSignal.set(null);
          this.templateDetailsErrorSignal.set(
            this.errorMessage(error, 'Template details are temporarily unavailable.'),
          );
        },
      });
  }

  closeInternalDetails(): void {
    this.internalDetailsOpenSignal.set(false);
    this.internalDetailsSignal.set(null);
    this.internalDetailsErrorSignal.set(null);
    this.internalDetailsLoadingSignal.set(false);
  }

  closeAnonymousDetails(): void {
    this.anonymousDetailsOpenSignal.set(false);
    this.anonymousDetailsSignal.set(null);
    this.anonymousDetailsErrorSignal.set(null);
    this.anonymousDetailsLoadingSignal.set(false);
  }

  closeTemplateDetails(): void {
    this.templateDetailsOpenSignal.set(false);
    this.templateDetailsSignal.set(null);
    this.templateDetailsErrorSignal.set(null);
    this.templateDetailsLoadingSignal.set(false);
  }

  private normalizeQuery(query: SurveyDashboardQuery): SurveyDashboardQuery {
    const normalized: SurveyDashboardQuery = {
      branchId: this.authStore.role() === 'SUPER_ADMIN' ? query.branchId || undefined : undefined,
      from: query.from || undefined,
      to: query.to || undefined,
      groupBy: query.groupBy ?? 'Day',
      topQuestionsCount: this.positiveInteger(query.topQuestionsCount, 5),
      criticalResponsesCount: this.positiveInteger(query.criticalResponsesCount, 10),
      criticalScoreThreshold: this.percentage(query.criticalScoreThreshold, 40),
    };

    if (query.templateId) {
      normalized.templateId = query.templateId || undefined;
    } else {
      normalized.source = query.source ?? 'All';
    }

    return normalized;
  }

  private scopedNavigationPath(path: string): string {
    return this.authStore.role() === 'SUPER_ADMIN'
      ? path
      : this.removeQueryParam(path, 'branchId');
  }

  private removeQueryParam(path: string, key: string): string {
    const [pathWithoutHash, hash = ''] = path.split('#', 2);
    const [basePath, queryString = ''] = pathWithoutHash.split('?', 2);
    if (queryString.length === 0) {
      return path;
    }

    const params = new URLSearchParams(queryString);
    params.delete(key);
    const nextQueryString = params.toString();
    const nextHash = hash.length > 0 ? `#${hash}` : '';
    return `${basePath}${nextQueryString.length > 0 ? `?${nextQueryString}` : ''}${nextHash}`;
  }

  private mergeBranchOptionsFromDashboard(dashboard: SurveyDashboardResponse): void {
    if (this.authStore.role() !== 'SUPER_ADMIN') {
      return;
    }

    const branches = new Map<string, SurveyDashboardBranchOption>(
      this.branchesSignal().map((branch) => [branch.id, branch]),
    );

    dashboard.branchesSummary.forEach((branch) => {
      if (!branch.branchId || branches.has(branch.branchId)) {
        return;
      }

      branches.set(branch.branchId, {
        id: branch.branchId,
        nameEn: branch.branchNameEn,
        nameAr: branch.branchNameAr,
        code: '',
      });
    });

    this.branchesSignal.set([...branches.values()]);
  }

  private mergeTemplateOptionsFromDashboard(dashboard: SurveyDashboardResponse): void {
    if (this.authStore.role() === 'SUPER_ADMIN' && !this.querySignal().branchId) {
      return;
    }

    const templates = new Map<string, SurveyDashboardTemplateOption>(
      this.templatesSignal().map((template) => [template.id, template]),
    );

    dashboard.templatePerformance.forEach((template) => {
      if (!template.templateId) {
        return;
      }

      const option: SurveyDashboardTemplateOption = {
        id: template.templateId,
        templateKind: template.source === 'Anonymous' ? 'Anonymous' : 'Authorized',
        dashboardSource: template.source === 'Anonymous' ? 'Anonymous' : 'Internal',
        nameEn: template.templateNameEn,
        nameAr: template.templateNameAr,
        displayName: template.templateNameEn || template.templateNameAr || '',
        branchId: template.branchId,
        branchNameEn: template.branchNameEn,
        branchNameAr: template.branchNameAr,
        branchCode: '',
      };

      templates.set(template.templateId, option);
    });

    this.templatesSignal.set([...templates.values()]);
  }

  private positiveInteger(value: number | undefined, fallback: number): number {
    return Number.isInteger(value) && (value ?? 0) > 0 ? value ?? fallback : fallback;
  }

  private percentage(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(Math.max(value, 0), 100)
      : fallback;
  }

  private canUseNavigation(navigation: SurveyDashboardNavigation): boolean {
    return navigation.method.toUpperCase() === 'GET' && navigation.path.length > 0;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return fallback;
    }

    const problemMessage = this.problemDetailsMessage(error.error);
    if (problemMessage.length > 0) {
      return problemMessage;
    }

    if (error.status === 403) {
      return 'You do not have permission to view branch reports.';
    }
    if (error.status === 404) {
      return 'The selected branch, template, or response was not found.';
    }
    if (error.status === 400 || error.status === 422) {
      return 'Invalid filters. Please check date range, source, and score values.';
    }

    return fallback;
  }

  private problemDetailsMessage(body: unknown): string {
    if (typeof body === 'string') {
      return body;
    }

    if (typeof body !== 'object' || body === null) {
      return '';
    }

    const record = body as Record<string, unknown>;
    const detail = record['detail'];
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }

    const title = record['title'];
    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }

    const errors = record['errors'];
    if (typeof errors === 'object' && errors !== null) {
      const messages = Object.values(errors as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      return messages[0] ?? '';
    }

    return '';
  }
}
