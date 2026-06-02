import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchTemplatesPdfReportDownloadRequest,
  BranchTemplatesPdfReportLanguage,
  BranchTemplatesPdfReportQuery,
} from '../domain/branch-templates-pdf-report.model';

@Injectable()
export class BranchTemplatesPdfReportService {
  private readonly http = inject(HttpClient);
  private readonly reportUrl = `${environment.apiBaseUrl}/api/reports/templates/pdf`;

  download(request: BranchTemplatesPdfReportDownloadRequest): Observable<Blob> {
    return this.http.get(this.reportUrl, {
      params: this.toParams(request.query),
      headers: new HttpHeaders({
        'Accept-Language': this.toAcceptLanguage(request.query.language),
      }),
      responseType: 'blob',
    });
  }

  private toParams(query: BranchTemplatesPdfReportQuery): HttpParams {
    let params = new HttpParams()
      .set('fromDate', query.fromDate)
      .set('toDate', query.toDate);

    if (query.templateId) {
      params = params.set('templateId', query.templateId);
    }

    if (query.templateKind) {
      params = params.set('templateKind', query.templateKind);
    }

    if (query.scoreCalculationMode) {
      params = params.set('scoreCalculationMode', query.scoreCalculationMode);
    }

    if (query.topWorstQuestionsCount !== undefined) {
      params = params.set('topWorstQuestionsCount', String(query.topWorstQuestionsCount));
    }

    if (query.language) {
      params = params.set('language', query.language);
    }

    return params;
  }

  private toAcceptLanguage(language: BranchTemplatesPdfReportLanguage | undefined): string {
    return language === 'Arabic' ? 'ar' : 'en';
  }
}
