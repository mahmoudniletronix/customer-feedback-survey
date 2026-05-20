import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { BranchDashboardService } from '../../data/branch-dashboard.service';
import {
  BranchSurveyResponseDetails,
  BranchSurveyResponsesPagination,
  BranchSurveyResponsesQuery,
} from '../../domain/branch-dashboard.model';

@Injectable()
export class BranchResponsesHistoryStore {
  private readonly reportsService = inject(BranchDashboardService);
  private readonly router = inject(Router);
  private readonly responsesSignal = signal<BranchSurveyResponsesPagination | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<BranchSurveyResponsesQuery>({
    pageNumber: 1,
    pageSize: 10,
  });
  private readonly selectedResponseIdSignal = signal<string | null>(null);
  private readonly responseDetailsSignal = signal<BranchSurveyResponseDetails | null>(null);
  private readonly responseDetailsLoadingSignal = signal(false);
  private readonly responseDetailsErrorSignal = signal<string | null>(null);

  readonly responses = this.responsesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly responseDetailsOpen = computed(() => this.selectedResponseIdSignal() !== null);
  readonly responseDetails = this.responseDetailsSignal.asReadonly();
  readonly responseDetailsLoading = this.responseDetailsLoadingSignal.asReadonly();
  readonly responseDetailsError = this.responseDetailsErrorSignal.asReadonly();
  readonly isEmpty = computed(() => (this.responsesSignal()?.data.length ?? 0) === 0);

  load(query: BranchSurveyResponsesQuery = this.querySignal()): void {
    const normalizedQuery = this.normalizeQuery(query);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(normalizedQuery);

    this.reportsService
      .getResponses(normalizedQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (responses) => {
          this.responsesSignal.set(responses);
        },
        error: (error: unknown) => {
          this.responsesSignal.set(null);
          this.handleListError(error);
        },
      });
  }

  goToPage(pageNumber: number): void {
    const current = this.responsesSignal();
    const totalPages = Math.max(current?.totalPages ?? 1, 1);
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    this.load({ ...this.querySignal(), pageNumber: nextPage });
  }

  loadResponseDetails(surveyResponseId: string): void {
    if (!surveyResponseId) {
      return;
    }

    this.selectedResponseIdSignal.set(surveyResponseId);
    this.responseDetailsSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
    this.responseDetailsLoadingSignal.set(true);

    this.reportsService
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
          this.handleDetailsError(error);
        },
      });
  }

  closeResponseDetails(): void {
    this.selectedResponseIdSignal.set(null);
    this.responseDetailsSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
    this.responseDetailsLoadingSignal.set(false);
  }

  private normalizeQuery(query: BranchSurveyResponsesQuery): BranchSurveyResponsesQuery {
    return {
      from: query.from || undefined,
      to: query.to || undefined,
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

  private handleListError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('branchResponsesHistory.loadError');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }

    if (error.status === 403) {
      this.errorSignal.set('branchResponsesHistory.forbidden');
      return;
    }
    if (error.status === 400 || error.status === 422) {
      this.errorSignal.set('branchResponsesHistory.invalidFilters');
      return;
    }

    this.errorSignal.set('branchResponsesHistory.loadError');
  }

  private handleDetailsError(error: unknown): void {
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
