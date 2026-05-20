import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { BranchDashboardService } from '../../data/branch-dashboard.service';
import {
  BranchDashboardQuery,
  BranchDashboardResponse,
  BranchSurveyResponseDetails,
} from '../../domain/branch-dashboard.model';

@Injectable()
export class BranchDashboardStore {
  private readonly dashboardService = inject(BranchDashboardService);
  private readonly router = inject(Router);
  private readonly dashboardSignal = signal<BranchDashboardResponse | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly selectedResponseIdSignal = signal<string | null>(null);
  private readonly responseDetailsSignal = signal<BranchSurveyResponseDetails | null>(null);
  private readonly responseDetailsLoadingSignal = signal(false);
  private readonly responseDetailsErrorSignal = signal<string | null>(null);
  private readonly querySignal = signal<BranchDashboardQuery>({
    groupBy: 'Day',
    topQuestionsCount: 5,
    criticalResponsesCount: 10,
    criticalScoreThreshold: 40,
  });

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly responseDetailsOpen = computed(() => this.selectedResponseIdSignal() !== null);
  readonly responseDetails = this.responseDetailsSignal.asReadonly();
  readonly responseDetailsLoading = this.responseDetailsLoadingSignal.asReadonly();
  readonly responseDetailsError = this.responseDetailsErrorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isEmpty = computed(() => (this.dashboardSignal()?.summary.totalResponses ?? 0) === 0);

  load(query: BranchDashboardQuery = this.querySignal()): void {
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
        },
        error: (error: unknown) => {
          this.dashboardSignal.set(null);
          this.handleError(error);
        },
      });
  }

  loadResponseDetails(surveyResponseId: string): void {
    if (!surveyResponseId) {
      return;
    }

    this.selectedResponseIdSignal.set(surveyResponseId);
    this.responseDetailsSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
    this.responseDetailsLoadingSignal.set(true);

    this.dashboardService
      .getResponseDetails(surveyResponseId)
      .pipe(
        take(1),
        finalize(() => {
          if (this.selectedResponseIdSignal() === surveyResponseId) {
            this.responseDetailsLoadingSignal.set(false);
          }
        }),
      )
      .subscribe({
        next: (details) => {
          if (this.selectedResponseIdSignal() !== surveyResponseId) {
            return;
          }

          this.responseDetailsSignal.set(details);
        },
        error: (error: unknown) => {
          if (this.selectedResponseIdSignal() !== surveyResponseId) {
            return;
          }

          this.responseDetailsSignal.set(null);
          this.handleResponseDetailsError(error);
        },
      });
  }

  closeResponseDetails(): void {
    this.selectedResponseIdSignal.set(null);
    this.responseDetailsSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
    this.responseDetailsLoadingSignal.set(false);
  }

  private normalizeQuery(query: BranchDashboardQuery): BranchDashboardQuery {
    return {
      from: query.from || undefined,
      to: query.to || undefined,
      templateId: query.templateId || undefined,
      groupBy: query.groupBy ?? 'Day',
      topQuestionsCount: query.topQuestionsCount ?? 5,
      criticalResponsesCount: query.criticalResponsesCount ?? 10,
      criticalScoreThreshold: query.criticalScoreThreshold ?? 40,
    };
  }

  private handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('branchDashboard.loadError');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }

    if (error.status === 403) {
      this.errorSignal.set('branchDashboard.forbidden');
      return;
    }
    if (error.status === 404) {
      this.errorSignal.set('branchDashboard.templateNotFound');
      return;
    }
    if (error.status === 400 || error.status === 422) {
      this.errorSignal.set('branchDashboard.invalidDateRange');
      return;
    }

    this.errorSignal.set('branchDashboard.loadError');
  }

  private handleResponseDetailsError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.responseDetailsErrorSignal.set('branchResponseDetails.loadError');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }

    if (error.status === 403) {
      this.responseDetailsErrorSignal.set('branchResponseDetails.forbidden');
      return;
    }
    if (error.status === 404) {
      this.responseDetailsErrorSignal.set('branchResponseDetails.notFound');
      return;
    }

    this.responseDetailsErrorSignal.set('branchResponseDetails.loadError');
  }
}
