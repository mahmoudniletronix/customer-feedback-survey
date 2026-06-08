import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Download, FileText, Filter } from 'lucide-angular';
import { take } from 'rxjs';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { BackButtonComponent } from '../../../../../shared/ui/back-button/back-button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchAdminBranchStore } from '../../../branch/presentation/state/branch-admin-branch.store';
import { BranchTemplatesService } from '../../../templates/data/branch-templates.service';
import {
  BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE,
  BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE,
  BRANCH_TEMPLATES_PDF_REPORT_MAX_SCORE_PERCENTAGE,
  BRANCH_TEMPLATES_PDF_REPORT_MAX_TOP_WORST_QUESTIONS_COUNT,
  BRANCH_TEMPLATES_PDF_REPORT_MIN_SCORE_PERCENTAGE,
  BRANCH_TEMPLATES_PDF_REPORT_MIN_TOP_WORST_QUESTIONS_COUNT,
  BranchTemplatesPdfReportLanguage,
  BranchTemplatesPdfReportQuery,
  BranchTemplatesPdfReportScoreCalculationMode,
  BranchTemplatesPdfReportTemplateKind,
  BranchTemplatesPdfReportTemplateOption,
} from '../../domain/branch-templates-pdf-report.model';
import { BranchTemplatesPdfReportStore } from '../state/branch-templates-pdf-report.store';

type TemplateKindFilter = BranchTemplatesPdfReportTemplateKind | '';
const DEFAULT_TOP_WORST_QUESTIONS_COUNT = '5';
const DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE = String(
  BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE,
);
const DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE = String(
  BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE,
);

@Component({
  selector: 'app-branch-templates-pdf-report-page',
  standalone: true,
  imports: [BackButtonComponent, ButtonComponent, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './branch-templates-pdf-report-page.component.html',
  providers: [BranchTemplatesService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatesPdfReportPageComponent implements OnInit, OnDestroy {
  readonly branchStore = inject(BranchAdminBranchStore);
  readonly reportStore = inject(BranchTemplatesPdfReportStore);
  private readonly authStore = inject(AuthStore);
  private readonly branchTemplatesService = inject(BranchTemplatesService);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly downloadObjectUrls = new Set<string>();
  private readonly downloadCleanupHandles = new Set<number>();
  private readonly downloadCleanupDelayMs = 60000;

  readonly downloadIcon = Download;
  readonly fileIcon = FileText;
  readonly filterIcon = Filter;
  readonly templateKindFilter = signal<TemplateKindFilter>('');
  readonly branchUserNormalTemplates = signal<readonly BranchTemplatesPdfReportTemplateOption[]>([]);
  readonly normalTemplatesError = signal<string | null>(null);
  readonly minTopWorstQuestionsCount =
    BRANCH_TEMPLATES_PDF_REPORT_MIN_TOP_WORST_QUESTIONS_COUNT;
  readonly maxTopWorstQuestionsCount =
    BRANCH_TEMPLATES_PDF_REPORT_MAX_TOP_WORST_QUESTIONS_COUNT;
  readonly minScorePercentage = BRANCH_TEMPLATES_PDF_REPORT_MIN_SCORE_PERCENTAGE;
  readonly maxScorePercentage = BRANCH_TEMPLATES_PDF_REPORT_MAX_SCORE_PERCENTAGE;

  readonly filtersForm = this.formBuilder.nonNullable.group({
    fromDate: [this.defaultFromDate()],
    toDate: [this.formatDate(new Date())],
    templateKind: ['' as TemplateKindFilter],
    templateKey: [''],
    scoreCalculationMode: ['RootQuestions' as BranchTemplatesPdfReportScoreCalculationMode],
    topWorstQuestionsCount: [DEFAULT_TOP_WORST_QUESTIONS_COUNT],
    worstQuestionsMaxScorePercentage: [DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE],
    bestQuestionsMinScorePercentage: [DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE],
    language: [this.defaultReportLanguage()],
  });

  readonly normalTemplates = computed<readonly BranchTemplatesPdfReportTemplateOption[]>(() =>
    this.authStore.isBranchAdminUserType()
      ? (this.branchStore.branch()?.templates ?? []).map((template) => ({
          id: template.templateId,
          kind: 'Normal',
          nameEn: template.nameEn,
          nameAr: template.nameAr,
        }))
      : this.branchUserNormalTemplates(),
  );

  readonly templateOptions = computed<readonly BranchTemplatesPdfReportTemplateOption[]>(() => [
    ...this.normalTemplates(),
    ...this.reportStore.anonymousTemplates(),
  ]);

  readonly filteredTemplateOptions = computed<readonly BranchTemplatesPdfReportTemplateOption[]>(
    () => {
      const selectedKind = this.templateKindFilter();
      if (!selectedKind) {
        return this.templateOptions();
      }

      return this.templateOptions().filter((template) => template.kind === selectedKind);
    },
  );

  ngOnInit(): void {
    if (this.authStore.isBranchAdminUserType()) {
      this.branchStore.load();
    } else {
      this.loadBranchUserNormalTemplates();
    }

    this.reportStore.loadAnonymousTemplates();
  }

  ngOnDestroy(): void {
    this.cleanupDownloadResources();
  }

  downloadReport(): void {
    if (this.reportStore.downloading()) {
      return;
    }

    const query = this.reportQuery();
    const reportLanguage = query.language ?? this.defaultReportLanguage();

    this.reportStore.download({ query }, (blob) =>
      this.saveBlob(blob, this.reportFileName(reportLanguage)),
    );
  }

  downloadExcelReport(): void {
    if (this.reportStore.excelDownloading()) {
      return;
    }

    const query = this.reportQuery();
    const reportLanguage = query.language ?? this.defaultReportLanguage();

    this.reportStore.downloadExcel({ query }, (blob) =>
      this.saveBlob(blob, this.excelReportFileName(reportLanguage)),
    );
  }

  private reportQuery(): BranchTemplatesPdfReportQuery {
    const value = this.filtersForm.getRawValue();
    const selectedTemplate = this.selectedTemplate(value.templateKey);

    return {
      fromDate: value.fromDate,
      toDate: value.toDate,
      templateId: selectedTemplate?.id,
      templateKind: selectedTemplate?.kind ?? (value.templateKind || undefined),
      scoreCalculationMode: value.scoreCalculationMode,
      topWorstQuestionsCount: this.toOptionalPositiveInteger(value.topWorstQuestionsCount),
      worstQuestionsMaxScorePercentage: this.toOptionalPercentage(
        value.worstQuestionsMaxScorePercentage,
      ),
      bestQuestionsMinScorePercentage: this.toOptionalPercentage(
        value.bestQuestionsMinScorePercentage,
      ),
      language: value.language,
    };
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      fromDate: this.defaultFromDate(),
      toDate: this.formatDate(new Date()),
      templateKind: '',
      templateKey: '',
      scoreCalculationMode: 'RootQuestions',
      topWorstQuestionsCount: DEFAULT_TOP_WORST_QUESTIONS_COUNT,
      worstQuestionsMaxScorePercentage: DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE,
      bestQuestionsMinScorePercentage: DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE,
      language: this.defaultReportLanguage(),
    });
    this.templateKindFilter.set('');
    this.reportStore.clearError();
  }

  resetTemplateSelection(): void {
    this.templateKindFilter.set(this.filtersForm.controls.templateKind.value);
    this.filtersForm.controls.templateKey.setValue('');
  }

  templateValue(template: BranchTemplatesPdfReportTemplateOption): string {
    return `${template.kind}:${template.id}`;
  }

  templateLabel(template: BranchTemplatesPdfReportTemplateOption): string {
    const name =
      this.i18n.language() === 'ar'
        ? template.nameAr || template.nameEn || '-'
        : template.nameEn || template.nameAr || '-';
    const kind = this.i18n.translate(
      template.kind === 'Normal'
        ? 'branchTemplatesPdf.normalTemplate'
        : 'branchTemplatesPdf.anonymousTemplate',
    );

    return `${name} (${kind})`;
  }

  private selectedTemplate(templateKey: string): BranchTemplatesPdfReportTemplateOption | undefined {
    return this.templateOptions().find((template) => this.templateValue(template) === templateKey);
  }

  private toOptionalPositiveInteger(value: string | number | null | undefined): number | undefined {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) {
      return undefined;
    }

    return Number(normalizedValue);
  }

  private toOptionalPercentage(value: string | number | null | undefined): number | undefined {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) {
      return undefined;
    }

    return Number(normalizedValue);
  }

  private loadBranchUserNormalTemplates(): void {
    this.normalTemplatesError.set(null);

    this.branchTemplatesService
      .selection()
      .pipe(take(1))
      .subscribe({
        next: (templates) => {
          this.branchUserNormalTemplates.set(
            templates.map((template) => ({
              id: template.id,
              kind: 'Normal',
              nameEn: template.nameEn,
              nameAr: template.nameAr,
            })),
          );
        },
        error: () => {
          this.branchUserNormalTemplates.set([]);
          this.normalTemplatesError.set('branchTemplatesPdf.normalTemplatesLoadError');
        },
      });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const fileUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    this.downloadObjectUrls.add(fileUrl);
    const cleanupHandle = view.setTimeout(() => {
      link.remove();
      view.URL.revokeObjectURL(fileUrl);
      this.downloadObjectUrls.delete(fileUrl);
      this.downloadCleanupHandles.delete(cleanupHandle);
    }, this.downloadCleanupDelayMs);
    this.downloadCleanupHandles.add(cleanupHandle);
  }

  private cleanupDownloadResources(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    for (const cleanupHandle of this.downloadCleanupHandles) {
      view.clearTimeout(cleanupHandle);
    }
    this.downloadCleanupHandles.clear();

    for (const fileUrl of this.downloadObjectUrls) {
      view.URL.revokeObjectURL(fileUrl);
    }
    this.downloadObjectUrls.clear();
  }

  private reportFileName(language: BranchTemplatesPdfReportLanguage): string {
    const timestamp = this.fileTimestamp(new Date());
    return language === 'Arabic'
      ? `customer-survey-report-ar-${timestamp}.pdf`
      : `customer-survey-report-${timestamp}.pdf`;
  }

  private excelReportFileName(language: BranchTemplatesPdfReportLanguage): string {
    const timestamp = this.fileTimestamp(new Date());
    return language === 'Arabic'
      ? `customer-survey-report-ar-${timestamp}.xls`
      : `customer-survey-report-${timestamp}.xls`;
  }

  private defaultReportLanguage(): BranchTemplatesPdfReportLanguage {
    return this.i18n.language() === 'ar' ? 'Arabic' : 'English';
  }

  private defaultFromDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private fileTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
