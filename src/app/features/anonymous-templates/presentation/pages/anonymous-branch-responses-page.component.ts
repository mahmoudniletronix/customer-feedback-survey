import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileAudio,
  MessageSquareText,
  Search,
  SlidersHorizontal,
} from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AuthStore } from '../../../auth/presentation/state/auth.store';
import {
  AnonymousTemplateListItem,
  BranchAnonymousResponseCustomInputPreview,
  BranchAnonymousResponseListItem,
  BranchAnonymousResponsesOrderSort,
  BranchAnonymousResponsesQuery,
} from '../../domain/anonymous-template.model';
import { AnonymousBranchResponsesStore } from '../state/anonymous-branch-responses.store';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

interface AnonymousBranchResponsesFormValue {
  anonymousTemplateId: string;
  from: string;
  to: string;
  minScorePercentage: string;
  maxScorePercentage: string;
  hasComplaint: string;
  hasVoice: string;
  searchText: string;
  orderSort: string;
  pageSize: string;
}

@Component({
  selector: 'app-anonymous-branch-responses-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './anonymous-branch-responses-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousBranchResponsesPageComponent implements OnInit {
  readonly responsesStore = inject(AnonymousBranchResponsesStore);
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);

  readonly arrowLeftIcon = ArrowLeft;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly complaintIcon = MessageSquareText;
  readonly detailsIcon = Eye;
  readonly filtersIcon = SlidersHorizontal;
  readonly searchIcon = Search;
  readonly voiceIcon = FileAudio;

  readonly advancedFiltersOpen = signal(true);
  readonly filterError = signal<string | null>(null);
  readonly canViewBranchResponses = computed(() => this.authStore.canAccessBranchDashboard());

  readonly filtersForm = this.formBuilder.nonNullable.group({
    anonymousTemplateId: [''],
    from: [''],
    to: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    hasComplaint: [''],
    hasVoice: [''],
    searchText: [''],
    orderSort: ['Newest'],
    pageSize: ['10'],
  });

  ngOnInit(): void {
    if (!this.canViewBranchResponses()) {
      return;
    }

    this.responsesStore.load({ orderSort: 'Newest' });
    this.anonymousTemplatesStore.load({
      pageNumber: 1,
      pageSize: 100,
      searchText: '',
      orderSort: '',
      scope: null,
      branchId: null,
      isActive: null,
    });
  }

  goBack(): void {
    this.location.back();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  applyFilters(): void {
    if (!this.canViewBranchResponses()) {
      return;
    }

    const formValue = this.filtersForm.getRawValue();
    const query = this.toQuery(formValue);
    if (!query) {
      return;
    }

    this.responsesStore.search(query);
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      anonymousTemplateId: '',
      from: '',
      to: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      hasComplaint: '',
      hasVoice: '',
      searchText: '',
      orderSort: 'Newest',
      pageSize: '10',
    });
    this.filterError.set(null);
    this.responsesStore.search({ orderSort: 'Newest', pageSize: 10 });
  }

  previousPage(): void {
    this.responsesStore.previousPage();
  }

  nextPage(): void {
    this.responsesStore.nextPage();
  }

  templateName(template: AnonymousTemplateListItem): string {
    return this.localized(template.nameEn, template.nameAr);
  }

  responseTemplateName(response: BranchAnonymousResponseListItem): string {
    return this.localized(response.anonymousTemplateNameEn, response.anonymousTemplateNameAr);
  }

  scoreLabel(response: BranchAnonymousResponseListItem): string {
    return response.isScored && response.scorePercentage !== null
      ? `${response.scorePercentage.toFixed(1)}%`
      : this.i18n.translate('anonymousTemplates.unscored');
  }

  scoreStatus(response: BranchAnonymousResponseListItem): 'Healthy' | 'Neutral' | 'Critical' | 'Unscored' {
    if (!response.isScored || response.scorePercentage === null) {
      return 'Unscored';
    }
    if (response.scorePercentage >= 80) {
      return 'Healthy';
    }
    if (response.scorePercentage >= 60) {
      return 'Neutral';
    }
    return 'Critical';
  }

  booleanLabel(value: boolean): string {
    return this.i18n.translate(value ? 'branchResponsesHistory.yes' : 'branchResponsesHistory.no');
  }

  customInputLabel(input: BranchAnonymousResponseCustomInputPreview): string {
    const label = this.localized(input.labelEn ?? input.name, input.labelAr, input.name);
    return `${label}: ${input.value || '-'}`;
  }

  pageStart(): number {
    const page = this.responsesStore.responses();
    if (!page || page.totalItems === 0) {
      return 0;
    }

    return (page.currentPage - 1) * page.pageSize + 1;
  }

  pageEnd(): number {
    const page = this.responsesStore.responses();
    if (!page) {
      return 0;
    }

    return Math.min(page.currentPage * page.pageSize, page.totalItems);
  }

  private toQuery(
    formValue: AnonymousBranchResponsesFormValue,
  ): Partial<BranchAnonymousResponsesQuery> | null {
    const pageSize = this.toPageSize(formValue.pageSize);
    if (pageSize === null) {
      this.filterError.set('anonymousTemplates.pageSizeInvalid');
      return null;
    }

    const from = this.toStartOfDayIso(formValue.from);
    const to = this.toEndOfDayIso(formValue.to);
    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      this.filterError.set('anonymousTemplates.responsesDateRangeInvalid');
      return null;
    }

    const minScore = this.toScoreFilter(formValue.minScorePercentage);
    const maxScore = this.toScoreFilter(formValue.maxScorePercentage);
    if (Number.isNaN(minScore) || Number.isNaN(maxScore)) {
      this.filterError.set('anonymousTemplates.responsesScoreRangeInvalid');
      return null;
    }
    if (minScore !== undefined && maxScore !== undefined && minScore > maxScore) {
      this.filterError.set('anonymousTemplates.responsesScoreRangeInvalid');
      return null;
    }

    this.filterError.set(null);
    return {
      anonymousTemplateId: this.toOptionalText(formValue.anonymousTemplateId),
      from,
      to,
      minScorePercentage: minScore,
      maxScorePercentage: maxScore,
      hasComplaint: this.toBooleanFilter(formValue.hasComplaint),
      hasVoice: this.toBooleanFilter(formValue.hasVoice),
      searchText: this.toOptionalText(formValue.searchText),
      orderSort: this.toOrderSort(formValue.orderSort),
      pageSize,
    };
  }

  private toPageSize(value: string): number | null {
    const pageSize = Number(value);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return null;
    }

    return pageSize;
  }

  private toScoreFilter(value: string): number | undefined {
    if (value.trim().length === 0) {
      return undefined;
    }

    const score = Number(value);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return Number.NaN;
    }

    return score;
  }

  private toBooleanFilter(value: string): boolean | undefined {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  }

  private toOrderSort(value: string): BranchAnonymousResponsesOrderSort {
    return value === 'Oldest' || value === 'Newest' ? value : '';
  }

  private toOptionalText(value: string): string | undefined {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private toStartOfDayIso(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private toEndOfDayIso(value: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private localized(
    englishText: string | null | undefined,
    arabicText: string | null | undefined,
    fallback = '-',
  ): string {
    const englishValue = englishText?.trim() ?? '';
    const arabicValue = arabicText?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabicValue || englishValue || fallback;
    }

    return englishValue || arabicValue || fallback;
  }
}
