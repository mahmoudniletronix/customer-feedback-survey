import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileAudio,
  FileText,
  Filter,
  MessageSquareText,
  Search,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchAdminTemplate } from '../../../branch/domain/branch-admin-branch.model';
import { BranchAdminBranchStore } from '../../../branch/presentation/state/branch-admin-branch.store';
import {
  BranchSurveyResponseCustomInputPreview,
  BranchSurveyResponseListItem,
} from '../../domain/branch-dashboard.model';
import { BranchResponseDetailsModalComponent } from '../components/branch-response-details-modal.component';
import { BranchResponsesHistoryStore } from '../state/branch-responses-history.store';

type BooleanFilterValue = '' | 'true' | 'false';
type ScoreStatus = 'Healthy' | 'Neutral' | 'Critical' | 'Not Scored';

@Component({
  selector: 'app-branch-responses-history-page',
  standalone: true,
  imports: [
    BranchResponseDetailsModalComponent,
    ButtonComponent,
    DatePipe,
    IconComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-responses-history-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchResponsesHistoryPageComponent implements OnInit {
  readonly historyStore = inject(BranchResponsesHistoryStore);
  readonly branchStore = inject(BranchAdminBranchStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly calendarIcon = Calendar;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly eyeIcon = Eye;
  readonly filterIcon = Filter;
  readonly searchIcon = Search;
  readonly templateIcon = FileText;
  readonly complaintIcon = MessageSquareText;
  readonly voiceIcon = FileAudio;
  readonly advancedFiltersOpen = signal(false);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    templateId: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    hasComplaint: ['' as BooleanFilterValue],
    hasVoice: ['' as BooleanFilterValue],
    searchText: [''],
    pageSize: ['10'],
  });

  ngOnInit(): void {
    this.branchStore.load();
    this.historyStore.load({ pageNumber: 1, pageSize: 10 });
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.historyStore.load({
      from: value.from || undefined,
      to: value.to || undefined,
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
      templateId: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      hasComplaint: '',
      hasVoice: '',
      searchText: '',
      pageSize: '10',
    });
    this.historyStore.load({ pageNumber: 1, pageSize: 10 });
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  changePage(pageNumber: number): void {
    this.historyStore.goToPage(pageNumber);
  }

  openDetails(row: BranchSurveyResponseListItem): void {
    this.historyStore.loadResponseDetails(row.surveyResponseId);
  }

  templateName(template: BranchAdminTemplate): string {
    return this.localized(template.nameEn, template.nameAr);
  }

  rowTemplateName(row: BranchSurveyResponseListItem): string {
    return this.localized(row.templateNameEn, row.templateNameAr);
  }

  operatorName(row: BranchSurveyResponseListItem): string {
    return this.localized(row.operatorNameEn, row.operatorNameAr);
  }

  scoreStatus(row: BranchSurveyResponseListItem): ScoreStatus {
    if (!row.isScored) {
      return 'Not Scored';
    }
    if (row.scorePercentage >= 80) {
      return 'Healthy';
    }
    if (row.scorePercentage >= 60) {
      return 'Neutral';
    }
    return 'Critical';
  }

  scoreLabel(row: BranchSurveyResponseListItem): string {
    return row.isScored ? `${row.scorePercentage.toFixed(1)}%` : 'Not Scored';
  }

  customInputLabel(input: BranchSurveyResponseCustomInputPreview): string {
    return `${input.name}: ${input.value || '-'}`;
  }

  pageStart(): number {
    const pagination = this.historyStore.responses();
    if (!pagination || pagination.totalItems === 0) {
      return 0;
    }
    return (pagination.currentPage - 1) * pagination.pageSize + 1;
  }

  pageEnd(): number {
    const pagination = this.historyStore.responses();
    if (!pagination) {
      return 0;
    }
    return Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
  }

  private toOptionalNumber(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toPageSize(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 10;
  }

  private toOptionalBoolean(value: BooleanFilterValue): boolean | undefined {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
  }
}
