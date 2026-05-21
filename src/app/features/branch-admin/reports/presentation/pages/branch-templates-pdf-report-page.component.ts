import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Download, FileText, Filter } from 'lucide-angular';
import { I18nService, Language } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchAdminBranchStore } from '../../../branch/presentation/state/branch-admin-branch.store';
import {
  BranchTemplatesPdfReportScoreCalculationMode,
  BranchTemplatesPdfReportTemplateKind,
  BranchTemplatesPdfReportTemplateOption,
} from '../../domain/branch-templates-pdf-report.model';
import { BranchTemplatesPdfReportStore } from '../state/branch-templates-pdf-report.store';

type TemplateKindFilter = BranchTemplatesPdfReportTemplateKind | '';

@Component({
  selector: 'app-branch-templates-pdf-report-page',
  standalone: true,
  imports: [ButtonComponent, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './branch-templates-pdf-report-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatesPdfReportPageComponent implements OnInit {
  readonly branchStore = inject(BranchAdminBranchStore);
  readonly reportStore = inject(BranchTemplatesPdfReportStore);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly downloadIcon = Download;
  readonly fileIcon = FileText;
  readonly filterIcon = Filter;
  readonly templateKindFilter = signal<TemplateKindFilter>('');

  readonly filtersForm = this.formBuilder.nonNullable.group({
    fromDate: [this.defaultFromDate()],
    toDate: [this.formatDate(new Date())],
    templateKind: ['' as TemplateKindFilter],
    templateKey: [''],
    scoreCalculationMode: ['RootQuestions' as BranchTemplatesPdfReportScoreCalculationMode],
  });

  readonly normalTemplates = computed<readonly BranchTemplatesPdfReportTemplateOption[]>(() =>
    (this.branchStore.branch()?.templates ?? []).map((template) => ({
      id: template.templateId,
      kind: 'Normal',
      nameEn: template.nameEn,
      nameAr: template.nameAr,
    })),
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
    this.branchStore.load();
    this.reportStore.loadAnonymousTemplates();
  }

  downloadReport(): void {
    const value = this.filtersForm.getRawValue();
    const selectedTemplate = this.selectedTemplate(value.templateKey);

    this.reportStore.download(
      {
        language: this.i18n.language(),
        query: {
          fromDate: value.fromDate,
          toDate: value.toDate,
          templateId: selectedTemplate?.id,
          templateKind: selectedTemplate?.kind,
          scoreCalculationMode: value.scoreCalculationMode,
        },
      },
      (blob) => this.saveBlob(blob, this.reportFileName(this.i18n.language())),
    );
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      fromDate: this.defaultFromDate(),
      toDate: this.formatDate(new Date()),
      templateKind: '',
      templateKey: '',
      scoreCalculationMode: 'RootQuestions',
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
    link.remove();
    view.URL.revokeObjectURL(fileUrl);
  }

  private reportFileName(language: Language): string {
    const timestamp = this.fileTimestamp(new Date());
    return language === 'ar'
      ? `تقرير-استبيانات-العملاء-${timestamp}.pdf`
      : `customer-survey-report-${timestamp}.pdf`;
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
