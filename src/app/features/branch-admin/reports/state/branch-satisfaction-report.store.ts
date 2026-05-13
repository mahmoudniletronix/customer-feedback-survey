import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  BranchSatisfactionReport,
  BranchSatisfactionReportQuery,
} from '../models/branch-satisfaction-report.model';
import { BranchSatisfactionReportService } from '../services/branch-satisfaction-report.service';

@Injectable()
export class BranchSatisfactionReportStore {
  private readonly reportService = inject(BranchSatisfactionReportService);
  private readonly reportSignal = signal<BranchSatisfactionReport | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly querySignal = signal<BranchSatisfactionReportQuery>({});

  readonly report = this.reportSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly query = this.querySignal.asReadonly();
  readonly isEmpty = computed(() => (this.reportSignal()?.overall.totalResponses ?? 0) === 0);

  load(query: BranchSatisfactionReportQuery = this.querySignal()): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.querySignal.set(query);

    this.reportService
      .getReport(query)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (report) => {
          this.reportSignal.set(report);
        },
        error: (error: unknown) => {
          this.reportSignal.set(null);
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchReports.loadError';
    }

    if (error.status === 401) {
      return 'branchReports.unauthorized';
    }
    if (error.status === 403) {
      return 'branchReports.forbidden';
    }
    if (error.status === 404) {
      return 'branchReports.templateNotFound';
    }
    if (error.status === 400 || error.status === 422) {
      return 'branchReports.validationError';
    }

    return 'branchReports.loadError';
  }
}
