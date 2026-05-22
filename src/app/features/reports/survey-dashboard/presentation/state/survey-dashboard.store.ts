import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize, take } from 'rxjs';
import { AnonymousTemplateResponseDetails } from '../../../../anonymous-templates/domain/anonymous-template.model';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchSurveyResponseDetails } from '../../../../branch-admin/dashboard/domain/branch-dashboard.model';
import { SurveyDashboardService } from '../../data/survey-dashboard.service';
import {
  SurveyDashboardBranchOption,
  SurveyDashboardNavigation,
  SurveyDashboardQuery,
  SurveyDashboardResponse,
  SurveyDashboardTemplateOption,
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
  private readonly internalTemplatesSignal = signal<readonly SurveyDashboardTemplateOption[]>([]);
  private readonly anonymousTemplatesSignal = signal<readonly SurveyDashboardTemplateOption[]>([]);
  private readonly optionsLoadingSignal = signal(false);

  private readonly internalDetailsOpenSignal = signal(false);
  private readonly internalDetailsSignal = signal<BranchSurveyResponseDetails | null>(null);
  private readonly internalDetailsLoadingSignal = signal(false);
  private readonly internalDetailsErrorSignal = signal<string | null>(null);

  private readonly anonymousDetailsOpenSignal = signal(false);
  private readonly anonymousDetailsSignal = signal<AnonymousTemplateResponseDetails | null>(null);
  private readonly anonymousDetailsLoadingSignal = signal(false);
  private readonly anonymousDetailsErrorSignal = signal<string | null>(null);

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly branches = this.branchesSignal.asReadonly();
  readonly internalTemplates = this.internalTemplatesSignal.asReadonly();
  readonly anonymousTemplates = this.anonymousTemplatesSignal.asReadonly();
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

  loadOptions(): void {
    this.optionsLoadingSignal.set(true);

    forkJoin({
      branches: this.authStore.role() === 'SUPER_ADMIN'
        ? this.dashboardService.getBranchOptions()
        : [[] as readonly SurveyDashboardBranchOption[]],
      internalTemplates: this.dashboardService.getInternalTemplateOptions(),
      anonymousTemplates: this.dashboardService.getAnonymousTemplateOptions(),
    })
      .pipe(
        take(1),
        finalize(() => this.optionsLoadingSignal.set(false)),
      )
      .subscribe({
        next: ({ branches, internalTemplates, anonymousTemplates }) => {
          this.branchesSignal.set(branches);
          this.internalTemplatesSignal.set(internalTemplates);
          this.anonymousTemplatesSignal.set(anonymousTemplates);
        },
        error: () => {
          this.branchesSignal.set([]);
          this.internalTemplatesSignal.set([]);
          this.anonymousTemplatesSignal.set([]);
        },
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
        next: (dashboard) => this.dashboardSignal.set(dashboard),
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
      .getDashboardByPath(navigation.path)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.dashboardSignal.set(dashboard),
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
      .getInternalResponseDetailsByPath(navigation.path)
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
      .getAnonymousResponseDetailsByPath(navigation.path)
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

  private normalizeQuery(query: SurveyDashboardQuery): SurveyDashboardQuery {
    const source = query.source ?? 'All';
    const normalized: SurveyDashboardQuery = {
      branchId: this.authStore.role() === 'SUPER_ADMIN' ? query.branchId || undefined : undefined,
      source,
      from: query.from || undefined,
      to: query.to || undefined,
      groupBy: query.groupBy ?? 'Day',
      topQuestionsCount: this.positiveInteger(query.topQuestionsCount, 5),
      criticalResponsesCount: this.positiveInteger(query.criticalResponsesCount, 10),
      criticalScoreThreshold: this.percentage(query.criticalScoreThreshold, 40),
    };

    if (source === 'Internal') {
      normalized.templateId = query.templateId || undefined;
    }
    if (source === 'Anonymous') {
      normalized.anonymousTemplateId = query.anonymousTemplateId || undefined;
    }

    return normalized;
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
