import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { Kpi, TrendPoint } from '../../domain/dashboard.model';
import { DashboardService } from '../../data/dashboard.service';

@Injectable()
export class DashboardStore {
  private readonly authStore = inject(AuthStore);
  private readonly i18n = inject(I18nService);
  private readonly dashboardService = inject(DashboardService);

  private readonly kpisSignal = signal<readonly Kpi[]>([]);
  private readonly trendSignal = signal<readonly TrendPoint[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly kpis = this.kpisSignal.asReadonly();
  readonly trend = this.trendSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly heading = computed(() => {
    const role = this.authStore.role();
    if (role === 'SUPER_ADMIN') {
      return this.i18n.translate('dashboard.globalReports');
    }
    if (role === 'BRANCH_ADMIN') {
      return this.i18n.translate('dashboard.branchAnalytics');
    }
    return this.i18n.translate('dashboard.departmentFeedback');
  });

  load(): void {
    const role = this.authStore.role();
    if (!role) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.dashboardService
      .getKpis(role)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (kpis) => this.kpisSignal.set(kpis),
        error: () => {
          this.kpisSignal.set([]);
          this.errorSignal.set('dashboard.loadError');
        }
      });

    this.dashboardService
      .getTrend(role)
      .pipe(take(1))
      .subscribe({
        next: (trend) => this.trendSignal.set(trend),
        error: () => {
          this.trendSignal.set([]);
          this.errorSignal.set('dashboard.loadError');
        }
      });
  }
}
