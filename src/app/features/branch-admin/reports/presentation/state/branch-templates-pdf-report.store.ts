import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { AnonymousTemplatesService } from '../../../../anonymous-templates/data/anonymous-templates.service';
import { BranchTemplatesPdfReportService } from '../../data/branch-templates-pdf-report.service';
import {
  BranchTemplatesPdfReportDownloadRequest,
  BranchTemplatesPdfReportQuery,
  BranchTemplatesPdfReportTemplateOption,
} from '../../domain/branch-templates-pdf-report.model';

const MAX_REPORT_MONTHS = 12;

@Injectable()
export class BranchTemplatesPdfReportStore {
  private readonly reportService = inject(BranchTemplatesPdfReportService);
  private readonly anonymousTemplatesService = inject(AnonymousTemplatesService);
  private readonly downloadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly anonymousTemplatesSignal = signal<readonly BranchTemplatesPdfReportTemplateOption[]>([]);
  private readonly anonymousTemplatesLoadingSignal = signal(false);
  private readonly anonymousTemplatesErrorSignal = signal<string | null>(null);

  readonly downloading = this.downloadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly anonymousTemplates = this.anonymousTemplatesSignal.asReadonly();
  readonly anonymousTemplatesLoading = this.anonymousTemplatesLoadingSignal.asReadonly();
  readonly anonymousTemplatesError = this.anonymousTemplatesErrorSignal.asReadonly();

  loadAnonymousTemplates(): void {
    this.anonymousTemplatesLoadingSignal.set(true);
    this.anonymousTemplatesErrorSignal.set(null);

    this.anonymousTemplatesService
      .list({
        pageNumber: 1,
        pageSize: 100,
        searchText: '',
        orderSort: '',
        scope: 1,
        branchId: null,
        isActive: true,
      })
      .pipe(
        take(1),
        finalize(() => this.anonymousTemplatesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.anonymousTemplatesSignal.set(
            page.data.map((template) => ({
              id: template.anonymousTemplateId,
              kind: 'Anonymous',
              nameEn: template.nameEn,
              nameAr: template.nameAr,
            })),
          );
        },
        error: () => {
          this.anonymousTemplatesSignal.set([]);
          this.anonymousTemplatesErrorSignal.set('branchTemplatesPdf.anonymousTemplatesLoadError');
        },
      });
  }

  download(
    request: BranchTemplatesPdfReportDownloadRequest,
    onDownloaded: (blob: Blob) => void,
  ): void {
    const validationError = this.validateQuery(request.query);
    if (validationError) {
      this.errorSignal.set(validationError);
      return;
    }

    this.downloadingSignal.set(true);
    this.errorSignal.set(null);

    this.reportService
      .download(request)
      .pipe(
        take(1),
        finalize(() => this.downloadingSignal.set(false)),
      )
      .subscribe({
        next: (blob) => {
          onDownloaded(blob);
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private validateQuery(query: BranchTemplatesPdfReportQuery): string | null {
    if (!query.fromDate) {
      return 'branchTemplatesPdf.fromRequired';
    }

    if (!query.toDate) {
      return 'branchTemplatesPdf.toRequired';
    }

    const fromDate = this.parseDate(query.fromDate);
    const toDate = this.parseDate(query.toDate);

    if (!fromDate || !toDate) {
      return 'branchTemplatesPdf.invalidDateFormat';
    }

    if (fromDate.getTime() > toDate.getTime()) {
      return 'branchTemplatesPdf.invalidDateOrder';
    }

    const maxToDate = this.addMonths(fromDate, MAX_REPORT_MONTHS);
    if (toDate.getTime() > maxToDate.getTime()) {
      return 'branchTemplatesPdf.dateRangeExceeded';
    }

    if (query.templateKind && !query.templateId) {
      return 'branchTemplatesPdf.templateKindRequiresTemplateId';
    }

    return null;
  }

  private parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date.getTime());
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchTemplatesPdf.downloadError';
    }

    if (error.status === 401) {
      return 'branchReports.unauthorized';
    }
    if (error.status === 403) {
      return 'branchReports.forbidden';
    }
    if (error.status === 404) {
      return 'branchTemplatesPdf.branchProfileNotFound';
    }
    if (error.status === 400 || error.status === 422) {
      return 'branchReports.validationError';
    }

    return 'branchTemplatesPdf.downloadError';
  }
}
