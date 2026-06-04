import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ThemeColorService } from '../../../../core/theme/theme-color.service';
import {
  BranchTemplatesPdfReportDownloadRequest,
  BranchTemplatesPdfReportLanguage,
  BranchTemplatesPdfReportQuery,
  BranchTemplatesReportSection,
  BranchTemplatesReportPreview,
  BranchTemplatesReportPreviewRequest,
} from '../domain/branch-templates-pdf-report.model';

@Injectable()
export class BranchTemplatesPdfReportService {
  private readonly http = inject(HttpClient);
  private readonly themeColors = inject(ThemeColorService);
  private readonly pdfReportUrl = `${environment.apiBaseUrl}/api/reports/templates/pdf`;
  private readonly previewReportUrl = `${environment.apiBaseUrl}/api/reports/templates`;
  private readonly excelMimeType = 'application/vnd.ms-excel;charset=utf-8';

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
    return this.preview(request).pipe(map((preview) => this.toExcelBlob(preview)));
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

  private toExcelBlob(report: BranchTemplatesReportPreview): Blob {
    const borderColor = this.themeColors.color('border');
    const headerBackground = this.themeColors.color('page');
    const html = [
      '<!doctype html>',
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">',
      '<head>',
      '<meta charset="UTF-8" />',
      `<style>body{font-family:Cairo,"Segoe UI",Arial,sans-serif;}h2{font-size:16px;}table{border-collapse:collapse;margin-bottom:24px;}th,td{border:1px solid ${borderColor};padding:6px 8px;font-size:12px;}th{background:${headerBackground};font-weight:700;}</style>`,
      '</head>',
      '<body>',
      this.toExcelTable('Report Info', [this.reportMetadata(report)]),
      this.toExcelTable('Executive Summary', [report.executiveSummary]),
      this.toExcelTable('Templates Summary', report.templates),
      this.toExcelTable('Questions Analytics', report.questions),
      this.toExcelTable('Worst Questions', report.worstQuestions),
      this.toExcelTable('Best Questions', report.bestQuestions),
      this.toExcelTable('Template Details', report.templateDetails),
      '</body>',
      '</html>',
    ].join('');

    return new Blob(['\ufeff', html], { type: this.excelMimeType });
  }

  private reportMetadata(report: BranchTemplatesReportPreview): BranchTemplatesReportSection {
    return {
      language: report.language,
      direction: report.direction,
      branchName: report.branchName,
      generatedBy: report.generatedBy,
      generatedAtUtc: report.generatedAtUtc,
      fromDate: report.fromDate,
      toDate: report.toDate,
      selectedTemplateId: report.selectedTemplateId,
      selectedTemplateKind: report.selectedTemplateKind,
      selectedTemplateName: report.selectedTemplateName,
      scoreCalculationMode: report.scoreCalculationMode,
      topWorstQuestionsCount: report.topWorstQuestionsCount,
      worstQuestionsScoreRange: `0% - ${report.worstQuestionsMaxScorePercentage}%`,
      bestQuestionsScoreRange: `${report.bestQuestionsMinScorePercentage}% - 100%`,
    };
  }

  private toExcelTable(title: string, rows: readonly BranchTemplatesReportSection[]): string {
    const columns = this.excelColumns(rows);
    const heading = `<h2>${this.escapeHtml(title)}</h2>`;

    if (columns.length === 0) {
      return `${heading}<table><tbody><tr><td>No data</td></tr></tbody></table>`;
    }

    const headerRow = columns
      .map((column) => `<th>${this.escapeHtml(column)}</th>`)
      .join('');
    const bodyRows = rows
      .map((row) =>
        columns
          .map((column) => `<td>${this.escapeHtml(this.formatExcelValue(row[column]))}</td>`)
          .join(''),
      )
      .map((cells) => `<tr>${cells}</tr>`)
      .join('');

    return `${heading}<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  }

  private excelColumns(rows: readonly BranchTemplatesReportSection[]): string[] {
    const columns = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => columns.add(key));
    });

    return [...columns];
  }

  private formatExcelValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
