import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  MessageSquareWarning,
  Mic,
  Search,
  TrendingUp,
  UsersRound,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchResponseDetailsModalComponent } from '../../../../branch-admin/dashboard/presentation/components/branch-response-details-modal.component';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { SurveyAnonymousResponseDetailsModalComponent } from '../components/survey-anonymous-response-details-modal.component';
import { SurveyDashboardStore } from '../state/survey-dashboard.store';
import {
  SurveyDashboardCriticalResponse,
  SurveyDashboardCustomInputPreview,
  SurveyDashboardCustomInputSegment,
  SurveyDashboardGroupBy,
  SurveyDashboardNavigation,
  SurveyDashboardQuery,
  SurveyDashboardSource,
  SurveyDashboardSourceMetrics,
  SurveyDashboardTemplateOption,
  SurveyDashboardTrendPoint,
} from '../../domain/survey-dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-survey-dashboard-page',
  standalone: true,
  imports: [
    BranchResponseDetailsModalComponent,
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    SurveyAnonymousResponseDetailsModalComponent,
  ],
  templateUrl: './survey-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDashboardPageComponent implements OnInit, OnDestroy {
  readonly store = inject(SurveyDashboardStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendCanvas');

  private trendChart: Chart<'line', (number | null)[], string> | null = null;

  readonly alertIcon = AlertTriangle;
  readonly branchIcon = Building2;
  readonly chartIcon = BarChart3;
  readonly complaintIcon = MessageSquareWarning;
  readonly detailsIcon = Eye;
  readonly filterIcon = Filter;
  readonly helpIcon = HelpCircle;
  readonly layersIcon = Layers;
  readonly micIcon = Mic;
  readonly responsesIcon = UsersRound;
  readonly searchIcon = Search;
  readonly templateIcon = FileText;
  readonly trendIcon = TrendingUp;
  readonly questionsIcon = ClipboardList;

  readonly advancedFiltersOpen = signal(true);
  readonly validationError = signal<string | null>(null);
  readonly sourceSignal = signal<SurveyDashboardSource>('All');
  readonly selectedBranchId = signal('');
  readonly isSuperAdmin = computed(() => this.authStore.role() === 'SUPER_ADMIN');

  readonly filtersForm = this.formBuilder.nonNullable.group({
    source: ['All' as SurveyDashboardSource],
    branchId: [''],
    templateId: [''],
    anonymousTemplateId: [''],
    from: [''],
    to: [''],
    groupBy: ['Day' as SurveyDashboardGroupBy],
    topQuestionsCount: ['5'],
    criticalResponsesCount: ['10'],
    criticalScoreThreshold: ['40'],
  });

  readonly internalTemplateOptions = computed(() =>
    this.filterTemplatesByBranch(this.store.internalTemplates()),
  );
  readonly anonymousTemplateOptions = computed(() =>
    this.filterTemplatesByBranch(this.store.anonymousTemplates()),
  );

  constructor() {
    effect(() => {
      const canvas = this.chartCanvas();
      const dashboard = this.store.dashboard();
      const language = this.i18n.language();

      if (!canvas || !dashboard || dashboard.satisfactionTrend.length === 0) {
        this.trendChart?.destroy();
        this.trendChart = null;
        return;
      }

      this.renderTrendChart(canvas.nativeElement, dashboard.satisfactionTrend, language);
    });
  }

  ngOnInit(): void {
    this.store.loadOptions();
    this.store.loadDashboard(this.queryFromForm());
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  onSourceChange(): void {
    const source = this.filtersForm.controls.source.value;
    this.sourceSignal.set(source);
    this.filtersForm.patchValue({
      templateId: '',
      anonymousTemplateId: '',
    });
  }

  onBranchChange(): void {
    const branchId = this.filtersForm.controls.branchId.value;
    this.selectedBranchId.set(branchId);
    this.filtersForm.patchValue({
      templateId: '',
      anonymousTemplateId: '',
    });
  }

  applyFilters(): void {
    const validationError = this.validateFilters();
    this.validationError.set(validationError);
    if (validationError) {
      return;
    }

    this.store.loadDashboard(this.queryFromForm());
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      source: 'All',
      branchId: '',
      templateId: '',
      anonymousTemplateId: '',
      from: '',
      to: '',
      groupBy: 'Day',
      topQuestionsCount: '5',
      criticalResponsesCount: '10',
      criticalScoreThreshold: '40',
    });
    this.sourceSignal.set('All');
    this.selectedBranchId.set('');
    this.validationError.set(null);
    this.store.loadDashboard(this.queryFromForm());
  }

  openNavigation(navigation: SurveyDashboardNavigation | null): void {
    if (!navigation || navigation.method.toUpperCase() !== 'GET') {
      return;
    }

    if (navigation.routeType === 'BranchDashboard') {
      this.openBranchDashboard(navigation);
      return;
    }

    if (navigation.routeType === 'InternalResponseDetails') {
      this.store.loadInternalResponseDetails(navigation);
      return;
    }

    if (navigation.routeType === 'AnonymousResponseDetails') {
      this.store.loadAnonymousResponseDetails(navigation);
      return;
    }

    if (
      navigation.routeType === 'InternalTemplateResponses' ||
      navigation.routeType === 'InternalTemplateResponsesByQuestionContext'
    ) {
      this.openInternalTemplateResponses(navigation);
      return;
    }

    if (
      navigation.routeType === 'AnonymousTemplateResponses' ||
      navigation.routeType === 'AnonymousTemplateResponsesByQuestionContext'
    ) {
      this.openAnonymousTemplateResponses(navigation);
    }
  }

  branchOptionName(branch: { nameEn: string; nameAr: string | null; code: string }): string {
    const name = this.localized(branch.nameEn, branch.nameAr);
    return branch.code ? `${name} (${branch.code})` : name;
  }

  templateOptionName(template: SurveyDashboardTemplateOption): string {
    const name = this.localized(template.nameEn, template.nameAr);
    if (!this.isSuperAdmin() || !template.branchNameEn) {
      return name;
    }

    return `${name} - ${this.localized(template.branchNameEn, template.branchNameAr)}`;
  }

  localized(englishText: string | null | undefined, arabicText: string | null | undefined): string {
    const english = englishText?.trim() ?? '';
    const arabic = arabicText?.trim() ?? '';
    if (this.i18n.language() === 'ar') {
      return arabic || english || '-';
    }

    return english || arabic || '-';
  }

  sourceLabel(source: SurveyDashboardSource): string {
    if (source === 'Internal') {
      return 'Internal';
    }
    if (source === 'Anonymous') {
      return 'Anonymous';
    }

    return 'All';
  }

  scoreLabel(value: number | null): string {
    return value === null ? 'No Data' : `${value.toFixed(1)}%`;
  }

  scoreClass(value: number | null): string {
    if (value === null) return 'bg-slate-100 text-slate-600';
    if (value >= 80) return 'bg-emerald-50 text-emerald-700';
    if (value >= 60) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  riskClass(riskLevel: string): string {
    if (riskLevel === 'HighRisk') return 'bg-rose-50 text-rose-700';
    if (riskLevel === 'MediumRisk') return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  sourceClass(source: SurveyDashboardSource): string {
    if (source === 'Internal') return 'bg-cyan-50 text-cyan-700';
    if (source === 'Anonymous') return 'bg-violet-50 text-violet-700';
    return 'bg-slate-100 text-slate-600';
  }

  breakdownAverage(metrics: SurveyDashboardSourceMetrics): string {
    return this.scoreLabel(metrics.averageScorePercentage);
  }

  customInputPreviewText(inputs: readonly SurveyDashboardCustomInputPreview[]): string {
    if (inputs.length === 0) {
      return 'No custom inputs';
    }

    return inputs
      .slice(0, 4)
      .map((input) => {
        const label = this.localized(input.labelEn || input.name, input.labelAr);
        return `${label}: ${input.value || '-'}`;
      })
      .join(' | ');
  }

  segmentLabel(segment: SurveyDashboardCustomInputSegment): string {
    return this.localized(segment.labelEn || segment.customInputName, segment.labelAr);
  }

  barWidth(value: number | null): string {
    if (value === null) {
      return '0%';
    }

    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  hasNavigation(navigation: SurveyDashboardNavigation | null): boolean {
    return navigation !== null && navigation.method.toUpperCase() === 'GET' && navigation.path.length > 0;
  }

  private queryFromForm(): SurveyDashboardQuery {
    const value = this.filtersForm.getRawValue();
    const source = value.source;
    const query: SurveyDashboardQuery = {
      source,
      branchId: this.isSuperAdmin() ? value.branchId || undefined : undefined,
      from: this.toStartOfDay(value.from),
      to: this.toEndOfDay(value.to),
      groupBy: value.groupBy,
      topQuestionsCount: this.toPositiveInteger(value.topQuestionsCount, 5),
      criticalResponsesCount: this.toPositiveInteger(value.criticalResponsesCount, 10),
      criticalScoreThreshold: this.toPercentage(value.criticalScoreThreshold, 40),
    };

    if (source === 'Internal') {
      query.templateId = value.templateId || undefined;
    }
    if (source === 'Anonymous') {
      query.anonymousTemplateId = value.anonymousTemplateId || undefined;
    }

    return query;
  }

  private validateFilters(): string | null {
    const value = this.filtersForm.getRawValue();
    if (value.from && value.to && value.from > value.to) {
      return 'From date cannot be after To date.';
    }

    const topQuestionsCount = this.toPositiveInteger(value.topQuestionsCount, 0);
    if (topQuestionsCount < 1) {
      return 'Top questions count must be greater than zero.';
    }

    const criticalResponsesCount = this.toPositiveInteger(value.criticalResponsesCount, 0);
    if (criticalResponsesCount < 1) {
      return 'Critical responses count must be greater than zero.';
    }

    const threshold = Number(value.criticalScoreThreshold);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return 'Critical score threshold must be between 0 and 100.';
    }

    return null;
  }

  private filterTemplatesByBranch(
    templates: readonly SurveyDashboardTemplateOption[],
  ): readonly SurveyDashboardTemplateOption[] {
    const branchId = this.selectedBranchId();
    if (!this.isSuperAdmin() || branchId.length === 0) {
      return templates;
    }

    return templates.filter((template) => !template.branchId || template.branchId === branchId);
  }

  private openBranchDashboard(navigation: SurveyDashboardNavigation): void {
    const branchId = this.queryParam(navigation.path, 'branchId');
    if (this.isSuperAdmin() && branchId) {
      this.filtersForm.patchValue({ branchId });
      this.selectedBranchId.set(branchId);
    }

    this.store.loadDashboardFromNavigation(navigation);
  }

  private openInternalTemplateResponses(navigation: SurveyDashboardNavigation): void {
    const templateId = this.queryParam(navigation.path, 'templateId');
    void this.router.navigate(['/branch-admin/templates/responses'], {
      queryParams: templateId ? { templateId } : {},
    });
  }

  private openAnonymousTemplateResponses(navigation: SurveyDashboardNavigation): void {
    const templateId =
      this.pathSegmentAfter(navigation.path, 'anonymous-templates') ||
      this.queryParam(navigation.path, 'anonymousTemplateId');

    if (!templateId) {
      return;
    }

    void this.router.navigate(['/anonymous-templates', templateId, 'responses']);
  }

  private queryParam(path: string, name: string): string {
    const url = this.navigationUrl(path);
    if (!url) {
      return '';
    }

    const expectedName = name.toLowerCase();
    for (const [key, value] of url.searchParams.entries()) {
      if (key.toLowerCase() === expectedName) {
        return value;
      }
    }

    return '';
  }

  private pathSegmentAfter(path: string, segment: string): string {
    const url = this.navigationUrl(path);
    if (!url) {
      return '';
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const index = segments.findIndex((item) => item.toLowerCase() === segment.toLowerCase());
    return index >= 0 ? segments[index + 1] ?? '' : '';
  }

  private navigationUrl(path: string): URL | null {
    try {
      return new URL(path, 'http://local');
    } catch {
      return null;
    }
  }

  private toPositiveInteger(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toPercentage(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : fallback;
  }

  private toStartOfDay(value: string): string | undefined {
    return value ? `${value}T00:00:00` : undefined;
  }

  private toEndOfDay(value: string): string | undefined {
    return value ? `${value}T23:59:59.999` : undefined;
  }

  private renderTrendChart(
    canvas: HTMLCanvasElement,
    trend: readonly SurveyDashboardTrendPoint[],
    language: string,
  ): void {
    this.trendChart?.destroy();
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map((point) => point.period),
        datasets: [
          {
            label: 'Combined',
            data: trend.map((point) => point.averageScorePercentage),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: 'Internal',
            data: trend.map((point) => point.internalAverageScorePercentage),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: 'Anonymous',
            data: trend.map((point) => point.anonymousAverageScorePercentage),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        locale: language,
        spanGaps: false,
        plugins: {
          legend: {
            display: true,
            labels: { boxWidth: 10, boxHeight: 10 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value === null ? 'No Data' : `${value.toFixed(1)}%`}`;
              },
              afterBody: (items) => {
                const point = trend[items[0]?.dataIndex ?? 0];
                return point ? `Responses: ${point.responsesCount}` : '';
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            grace: '5%',
            grid: { color: '#E5EAF1' },
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true },
          },
        },
      },
    });
  }
}
