import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchTemplatesPdfReportDownloadRequest,
  BranchTemplatesPdfReportLanguage,
  BranchTemplatesPdfReportQuery,
  BranchTemplatesReportPreview,
  BranchTemplatesReportPreviewRequest,
} from '../domain/branch-templates-pdf-report.model';
import { BranchTemplatesExcelReportService } from './branch-templates-excel-report.service';

@Injectable()
export class BranchTemplatesPdfReportService {
  private readonly http = inject(HttpClient);
  private readonly excelReportService = inject(BranchTemplatesExcelReportService);
  private readonly pdfReportUrl = `${environment.apiBaseUrl}/api/reports/templates/pdf`;
  private readonly previewReportUrl = `${environment.apiBaseUrl}/api/reports/templates`;

  download(request: BranchTemplatesPdfReportDownloadRequest): Observable<Blob> {
    return this.http.get(this.pdfReportUrl, {
      params: this.toParams(request.query, { includeLanguageQueryParam: true }),
      headers: new HttpHeaders({
        'Accept-Language': this.toAcceptLanguage(request.query.language),
      }),
      responseType: 'blob',
    });
  }

  preview(request: BranchTemplatesReportPreviewRequest): Observable<BranchTemplatesReportPreview> {
    return this.http.get<BranchTemplatesReportPreview>(this.previewReportUrl, {
      params: this.toParams(request.query, { includeLanguageQueryParam: false }),
      headers: new HttpHeaders({
        'Accept-Language': this.toAcceptLanguage(request.query.language),
      }),
    });
  }

  downloadExcel(request: BranchTemplatesReportPreviewRequest): Observable<Blob> {
    return this.preview(request).pipe(map((preview) => this.excelReportService.toBlob(preview)));
  }

  private toParams(
    query: BranchTemplatesPdfReportQuery,
    options: { includeLanguageQueryParam: boolean },
  ): HttpParams {
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

    if (query.worstQuestionsMaxScorePercentage !== undefined) {
      params = params.set(
        'worstQuestionsMaxScorePercentage',
        String(query.worstQuestionsMaxScorePercentage),
      );
    }

    if (query.bestQuestionsMinScorePercentage !== undefined) {
      params = params.set(
        'bestQuestionsMinScorePercentage',
        String(query.bestQuestionsMinScorePercentage),
      );
    }

    if (options.includeLanguageQueryParam && query.language) {
      params = params.set('language', query.language);
    }

    return params;
  }

  private toAcceptLanguage(language: BranchTemplatesPdfReportLanguage | undefined): string {
    return language === 'Arabic' ? 'ar' : 'en';
  }
}
