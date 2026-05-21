import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Filter, Search } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import {
  ReportBranchOption,
  ReportDepartmentOption,
  SystemResponseListItem,
} from '../../domain/system-reports.model';
import { SystemResponseDetailsModalComponent } from '../components/system-response-details-modal.component';
import { SystemReportsStore } from '../state/system-reports.store';

type BooleanFilterValue = '' | 'true' | 'false';

@Component({
  selector: 'app-system-responses-history-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    IconComponent,
    ReactiveFormsModule,
    SystemResponseDetailsModalComponent,
    TranslatePipe,
  ],
  templateUrl: './system-responses-history-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemResponsesHistoryPageComponent implements OnInit {
  readonly store = inject(SystemReportsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly filterIcon = Filter;
  readonly searchIcon = Search;
  readonly advancedFiltersOpen = signal(false);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    branchId: [''],
    departmentId: [''],
    templateId: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    hasComplaint: ['' as BooleanFilterValue],
    hasVoice: ['' as BooleanFilterValue],
    searchText: [''],
    pageSize: ['10'],
  });

  ngOnInit(): void {
    this.store.loadOptions();
    this.store.loadResponses({ pageNumber: 1, pageSize: 10 });
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.loadResponses({
      from: value.from || undefined,
      to: value.to || undefined,
      branchId: value.branchId || undefined,
      departmentId: value.departmentId || undefined,
      templateId: value.templateId || undefined,
      minScorePercentage: this.toOptionalNumber(value.minScorePercentage),
      maxScorePercentage: this.toOptionalNumber(value.maxScorePercentage),
      hasComplaint: this.toOptionalBoolean(value.hasComplaint),
      hasVoice: this.toOptionalBoolean(value.hasVoice),
      searchText: value.searchText || undefined,
      pageNumber: 1,
      pageSize: this.toPageSize(value.pageSize),
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      branchId: '',
      departmentId: '',
      templateId: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      hasComplaint: '',
      hasVoice: '',
      searchText: '',
      pageSize: '10',
    });
    this.store.loadResponses({ pageNumber: 1, pageSize: 10 });
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  openDetails(row: SystemResponseListItem): void {
    this.store.loadDetails(row.surveyResponseId);
  }

  pageStart(): number {
    const page = this.store.responses();
    return page && page.totalItems > 0 ? (page.currentPage - 1) * page.pageSize + 1 : 0;
  }

  pageEnd(): number {
    const page = this.store.responses();
    return page ? Math.min(page.currentPage * page.pageSize, page.totalItems) : 0;
  }

  localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }

  branchOptionName(branch: ReportBranchOption): string {
    const name = this.localized(branch.nameEn, branch.nameAr);
    return branch.code ? `${name} (${branch.code})` : name;
  }

  departmentOptionName(department: ReportDepartmentOption): string {
    return this.localized(department.nameEn, department.nameAr);
  }

  scoreLabel(row: SystemResponseListItem): string {
    if (!row.isScored) return 'Not Scored';
    return `${this.scoreStatus(row)} · ${row.scorePercentage.toFixed(1)}%`;
  }

  scoreStatus(row: SystemResponseListItem): 'Healthy' | 'Neutral' | 'Critical' | 'Not Scored' {
    if (!row.isScored) return 'Not Scored';
    if (row.scorePercentage >= 80) return 'Healthy';
    if (row.scorePercentage >= 60) return 'Neutral';
    return 'Critical';
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
}
