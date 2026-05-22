import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChevronLeft, ChevronRight, Eye, Search, SlidersHorizontal } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import {
  DepartmentOperatorResponseListItem,
  DepartmentReportTemplateOption,
  DepartmentReportsOrderSort,
  DepartmentResponseCustomInputPreview,
} from '../../domain/department-reports.model';
import { DepartmentOperatorResponsesStore } from '../state/department-operator-responses.store';

type BooleanFilterValue = '' | 'true' | 'false';
type ScoreStatus = 'Healthy' | 'Neutral' | 'Critical' | 'Not Scored';

@Component({
  selector: 'app-department-operator-responses-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './department-operator-responses-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentOperatorResponsesPageComponent implements OnInit {
  readonly store = inject(DepartmentOperatorResponsesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly eyeIcon = Eye;
  readonly filtersIcon = SlidersHorizontal;
  readonly searchIcon = Search;
  readonly advancedFiltersOpen = signal(true);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    templateId: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    hasComplaint: ['' as BooleanFilterValue],
    hasVoice: ['' as BooleanFilterValue],
    searchText: [''],
    orderSort: ['Newest' as DepartmentReportsOrderSort],
    pageSize: ['10'],
  });

  readonly filtersSummary = computed(() => {
    const query = this.store.query();
    const parts: string[] = [];
    if (query.from || query.to) {
      parts.push(
        `${query.from || this.i18n.translate('departmentOperatorResponses.filterStart')} ${this.i18n.translate('departmentOperatorResponses.to')} ${query.to || this.i18n.translate('departmentOperatorResponses.filterToday')}`,
      );
    }
    if (query.templateId) {
      parts.push(this.i18n.translate('departmentOperatorResponses.templateFiltered'));
    }
    if (query.minScorePercentage !== undefined || query.maxScorePercentage !== undefined) {
      parts.push(
        `${query.minScorePercentage ?? 0}-${query.maxScorePercentage ?? 100}% ${this.i18n.translate('departmentOperatorResponses.scoreFilter')}`,
      );
    }
    if (query.hasComplaint !== undefined) {
      parts.push(
        this.i18n.translate(
          query.hasComplaint
            ? 'departmentOperatorResponses.withComplaintSummary'
            : 'departmentOperatorResponses.noComplaintSummary',
        ),
      );
    }
    if (query.hasVoice !== undefined) {
      parts.push(
        this.i18n.translate(
          query.hasVoice
            ? 'departmentOperatorResponses.withVoiceSummary'
            : 'departmentOperatorResponses.noVoiceSummary',
        ),
      );
    }
    if (query.searchText) {
      parts.push(
        `${this.i18n.translate('departmentOperatorResponses.searchSummary')}: ${query.searchText}`,
      );
    }
    parts.push(
      this.i18n.translate(
        query.orderSort === 'Oldest'
          ? 'departmentOperatorResponses.oldest'
          : 'departmentOperatorResponses.newest',
      ),
    );
    return parts.join(' | ');
  });

  ngOnInit(): void {
    const operatorId = this.route.snapshot.paramMap.get('operatorId') ?? '';
    this.store.setOperator(operatorId);
    this.store.loadTemplates();
    this.store.load({ pageNumber: 1, pageSize: 10, orderSort: 'Newest' });
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.load({
      from: value.from || undefined,
      to: value.to || undefined,
      templateId: value.templateId || undefined,
      minScorePercentage: this.toOptionalNumber(value.minScorePercentage),
      maxScorePercentage: this.toOptionalNumber(value.maxScorePercentage),
      hasComplaint: this.toOptionalBoolean(value.hasComplaint),
      hasVoice: this.toOptionalBoolean(value.hasVoice),
      searchText: value.searchText || undefined,
      orderSort: value.orderSort,
      pageNumber: 1,
      pageSize: this.toPageSize(value.pageSize),
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      templateId: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      hasComplaint: '',
      hasVoice: '',
      searchText: '',
      orderSort: 'Newest',
      pageSize: '10',
    });
    this.store.load({ pageNumber: 1, pageSize: 10, orderSort: 'Newest' });
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  changePage(pageNumber: number): void {
    this.store.goToPage(pageNumber);
  }

  openDetails(row: DepartmentOperatorResponseListItem): void {
    void this.router.navigate([
      '/reports/department/operators',
      this.store.operatorId(),
      'responses',
      row.surveyResponseId,
    ]);
  }

  backToDashboard(): void {
    void this.router.navigate(['/reports/department/dashboard']);
  }

  optionName(template: DepartmentReportTemplateOption): string {
    const name = this.localized(template.nameEn, template.nameAr);
    return template.branchCode ? `${name} (${template.branchCode})` : name;
  }

  rowTemplateName(row: DepartmentOperatorResponseListItem): string {
    return this.localized(row.templateNameEn, row.templateNameAr);
  }

  rowBranchName(row: DepartmentOperatorResponseListItem): string {
    const name = this.localized(row.branchNameEn, row.branchNameAr);
    return row.branchCode ? `${name} (${row.branchCode})` : name;
  }

  rowOperatorName(row: DepartmentOperatorResponseListItem): string {
    return this.localized(row.operatorNameEn, row.operatorNameAr);
  }

  scoreStatus(row: DepartmentOperatorResponseListItem): ScoreStatus {
    if (!row.isScored) return 'Not Scored';
    if (row.scorePercentage >= 80) return 'Healthy';
    if (row.scorePercentage >= 60) return 'Neutral';
    return 'Critical';
  }

  scoreLabel(row: DepartmentOperatorResponseListItem): string {
    return row.isScored
      ? `${row.scorePercentage.toFixed(1)}%`
      : this.i18n.translate('departmentOperatorResponses.unscored');
  }

  customInputLabel(input: DepartmentResponseCustomInputPreview): string {
    return `${input.name}: ${input.value || '-'}`;
  }

  pageStart(): number {
    const page = this.store.responses();
    if (!page || page.totalItems === 0) return 0;
    return (page.currentPage - 1) * page.pageSize + 1;
  }

  pageEnd(): number {
    const page = this.store.responses();
    if (!page) return 0;
    return Math.min(page.currentPage * page.pageSize, page.totalItems);
  }

  private toOptionalNumber(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toPageSize(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 10;
  }

  private toOptionalBoolean(value: BooleanFilterValue): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }
}
