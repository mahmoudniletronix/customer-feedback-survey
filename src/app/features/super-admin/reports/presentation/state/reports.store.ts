import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { ReportSummary } from '../../domain/report.model';
import { ReportsService } from '../../data/reports.service';

@Injectable()
export class ReportsStore {
  private readonly reportsService = inject(ReportsService);
  private readonly summariesSignal = signal<readonly ReportSummary[]>([]);
  private readonly errorSignal = signal<string | null>(null);

  readonly summaries = this.summariesSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(): void {
    this.errorSignal.set(null);
    this.reportsService
      .summaries()
      .pipe(take(1))
      .subscribe({
        next: (summaries) => this.summariesSignal.set(summaries),
        error: () => {
          this.summariesSignal.set([]);
          this.errorSignal.set('reports.loadError');
        }
      });
  }
}
