import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ReportSummary } from '../domain/report.model';

@Injectable()
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiBaseUrl}/api/reports`;

  summaries(): Observable<readonly ReportSummary[]> {
    return this.http.get<readonly ReportSummary[]>(`${this.reportsUrl}/summaries`);
  }
}
