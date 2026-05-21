import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  AnonymousTemplateDashboardQuery,
  AnonymousTemplateDashboardResponse,
  AnonymousTemplateListItem,
  AnonymousTemplatesListQuery,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesService } from '../../data/anonymous-templates.service';

@Injectable()
export class AnonymousTemplateDashboardStore {
  private readonly anonymousTemplatesService = inject(AnonymousTemplatesService);

  private readonly dashboardSignal = signal<AnonymousTemplateDashboardResponse | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<AnonymousTemplateDashboardQuery>({
    groupBy: 'Day',
    topQuestionsCount: 5,
    criticalResponsesCount: 10,
    criticalScoreThreshold: 40,
  });
  private readonly templatesSignal = signal<readonly AnonymousTemplateListItem[]>([]);
  private readonly templatesLoadingSignal = signal(false);

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();
  readonly templatesLoading = this.templatesLoadingSignal.asReadonly();
  readonly isEmpty = computed(() => (this.dashboardSignal()?.summary.totalResponses ?? 0) === 0);

  load(query: Partial<AnonymousTemplateDashboardQuery> = {}): void {
    if (this.loadingSignal()) {
      return;
    }

    const nextQuery: AnonymousTemplateDashboardQuery = {
      ...this.querySignal(),
      ...query,
      topQuestionsCount: this.clamp(query.topQuestionsCount ?? this.querySignal().topQuestionsCount ?? 5, 1, 20),
      criticalResponsesCount: this.clamp(
        query.criticalResponsesCount ?? this.querySignal().criticalResponsesCount ?? 10,
        1,
        50,
      ),
      criticalScoreThreshold: this.clamp(
        query.criticalScoreThreshold ?? this.querySignal().criticalScoreThreshold ?? 40,
        0,
        100,
      ),
    };

    this.querySignal.set(nextQuery);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.anonymousTemplatesService
      .dashboard(nextQuery)
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
          this.errorSignal.set(this.readDashboardErrorKey(error));
        },
      });
  }

  loadTemplates(): void {
    if (this.templatesLoadingSignal()) {
      return;
    }

    const query: AnonymousTemplatesListQuery = {
      pageNumber: 1,
      pageSize: 100,
      searchText: '',
      orderSort: '',
      scope: null,
      branchId: null,
      isActive: true,
    };

    this.templatesLoadingSignal.set(true);
    this.anonymousTemplatesService
      .list(query)
      .pipe(
        take(1),
        finalize(() => this.templatesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => this.templatesSignal.set(page.data),
        error: () => this.templatesSignal.set([]),
      });
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.min(Math.max(value, min), max);
  }

  private readDashboardErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousDashboard.loadError';
    }

    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }
    if (error.status === 400) {
      return 'anonymousDashboard.invalidFilters';
    }

    return 'anonymousDashboard.loadError';
  }
}
