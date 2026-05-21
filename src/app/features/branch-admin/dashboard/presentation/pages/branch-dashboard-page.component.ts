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
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  FileText,
  Frown,
  Gauge,
  Hash,
  HelpCircle,
  Layers,
  Meh,
  MessageSquareWarning,
  Mic,
  Search,
  SlidersHorizontal,
  Smile,
  TrendingUp,
  UsersRound,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchAdminBranchStore } from '../../../branch/presentation/state/branch-admin-branch.store';
import { BranchAdminTemplate } from '../../../branch/domain/branch-admin-branch.model';
import { BranchResponseDetailsModalComponent } from '../components/branch-response-details-modal.component';
import {
  BranchDashboardCriticalResponse,
  BranchDashboardCustomInputSegment,
  BranchDashboardGroupBy,
  BranchDashboardQuestionInsight,
  BranchDashboardTemplatePerformance,
} from '../../domain/branch-dashboard.model';
import { BranchDashboardStore } from '../state/branch-dashboard.store';

Chart.register(...registerables);

@Component({
  selector: 'app-branch-dashboard-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    BranchResponseDetailsModalComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './branch-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDashboardPageComponent implements OnInit, OnDestroy {
  readonly dashboardStore = inject(BranchDashboardStore);
  readonly branchStore = inject(BranchAdminBranchStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendCanvas');
  private trendChart: Chart<'line', number[], string> | null = null;

  readonly alertIcon = AlertTriangle;
  readonly alertCircleIcon = AlertCircle;
  readonly chartIcon = BarChart3;
  readonly calendarIcon = Calendar;
  readonly complaintIcon = MessageSquareWarning;
  readonly frownIcon = Frown;
  readonly gaugeIcon = Gauge;
  readonly hashIcon = Hash;
  readonly helpIcon = HelpCircle;
  readonly layersIcon = Layers;
  readonly mehIcon = Meh;
  readonly micIcon = Mic;
  readonly responsesIcon = UsersRound;
  readonly searchIcon = Search;
  readonly filtersIcon = SlidersHorizontal;
  readonly smileIcon = Smile;
  readonly templateIcon = FileText;
  readonly trendIcon = TrendingUp;

  readonly selectedSegmentName = signal('');
  readonly advancedFiltersOpen = signal(true);
  readonly selectedSegment = computed<BranchDashboardCustomInputSegment | null>(() => {
    const dashboard = this.dashboardStore.dashboard();
    const segments = dashboard?.customInputSegments ?? [];
    if (segments.length === 0) {
      return null;
    }

    const selectedName = this.selectedSegmentName();
    return segments.find((segment) => segment.customInputName === selectedName) ?? segments[0];
  });

  // SVG Radial Gauge Computations
  readonly averageScore = computed(() => this.dashboardStore.dashboard()?.summary.averageScorePercentage ?? 0);
  
  readonly scoreColor = computed(() => {
    const score = this.averageScore();
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  });

  readonly scoreBg = computed(() => {
    const score = this.averageScore();
    if (score >= 80) return 'rgba(16, 185, 129, 0.06)';
    if (score >= 60) return 'rgba(245, 158, 11, 0.06)';
    return 'rgba(239, 68, 68, 0.06)';
  });

  readonly scoreTextColorClass = computed(() => {
    const score = this.averageScore();
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  });

  readonly strokeDashArray = 238.7; // 2 * Math.PI * 38
  readonly strokeDashOffset = computed(() => {
    const score = this.averageScore();
    return this.strokeDashArray - (score / 100) * this.strokeDashArray;
  });

  // Sentiment Distribution Ratios
  readonly totalResponses = computed(() => this.dashboardStore.dashboard()?.summary.totalResponses ?? 0);
  
  readonly satisfiedPercent = computed(() => {
    const total = this.totalResponses();
    return total > 0 ? ((this.dashboardStore.dashboard()?.summary.satisfiedResponses ?? 0) / total) * 100 : 0;
  });

  readonly neutralPercent = computed(() => {
    const total = this.totalResponses();
    return total > 0 ? ((this.dashboardStore.dashboard()?.summary.neutralResponses ?? 0) / total) * 100 : 0;
  });

  readonly unhappyPercent = computed(() => {
    const total = this.totalResponses();
    return total > 0 ? ((this.dashboardStore.dashboard()?.summary.unhappyResponses ?? 0) / total) * 100 : 0;
  });

  // Operational Template scale
  readonly activeTemplatesCount = computed(() => this.dashboardStore.dashboard()?.summary.activeTemplatesCount ?? 0);
  readonly templatesWithResponsesCount = computed(() => this.dashboardStore.dashboard()?.summary.templatesWithResponsesCount ?? 0);
  readonly templateActivityPercent = computed(() => {
    const total = this.activeTemplatesCount();
    return total > 0 ? (this.templatesWithResponsesCount() / total) * 100 : 0;
  });

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    templateId: [''],
    groupBy: ['Day' as BranchDashboardGroupBy],
  });

  constructor() {
    effect(() => {
      const canvas = this.chartCanvas();
      const dashboard = this.dashboardStore.dashboard();
      const language = this.i18n.language();

      if (!canvas || !dashboard || dashboard.satisfactionTrend.length === 0) {
        this.trendChart?.destroy();
        this.trendChart = null;
        return;
      }

      this.renderTrendChart(canvas.nativeElement, dashboard.satisfactionTrend, language);
    });

    effect(() => {
      const segments = this.dashboardStore.dashboard()?.customInputSegments ?? [];
      const selectedName = this.selectedSegmentName();
      if (segments.length > 0 && !segments.some((segment) => segment.customInputName === selectedName)) {
        this.selectedSegmentName.set(segments[0].customInputName);
      }
    });
  }

  ngOnInit(): void {
    if (this.authStore.role() === 'BRANCH_ADMIN') {
      this.branchStore.load();
    }
    this.dashboardStore.load();
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.dashboardStore.load({
      from: value.from || undefined,
      to: value.to || undefined,
      templateId: value.templateId || undefined,
      groupBy: value.groupBy,
      topQuestionsCount: 5,
      criticalResponsesCount: 10,
      criticalScoreThreshold: 40,
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      templateId: '',
      groupBy: 'Day',
    });
    this.dashboardStore.load();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  filterByTemplate(templateId: string): void {
    this.filtersForm.patchValue({ templateId });
    this.applyFilters();
  }

  templateName(template: BranchAdminTemplate): string {
    return this.localized(template.nameEn, template.nameAr);
  }

  performanceTemplateName(item: BranchDashboardTemplatePerformance): string {
    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  questionTemplateName(item: BranchDashboardQuestionInsight): string {
    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  questionText(item: BranchDashboardQuestionInsight): string {
    return this.localized(item.questionTextEn, item.questionTextAr);
  }

  criticalTemplateName(item: BranchDashboardCriticalResponse): string {
    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  riskLabel(item: BranchDashboardTemplatePerformance): string {
    if (item.riskLevel === 'HighRisk') {
      return this.i18n.translate('branchDashboard.highRisk');
    }
    if (item.riskLevel === 'MediumRisk') {
      return this.i18n.translate('branchDashboard.mediumRisk');
    }
    return this.i18n.translate('branchDashboard.healthy');
  }

  barWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  segmentResponsesTotal(segment: BranchDashboardCustomInputSegment): number {
    return segment.segments.reduce((total, item) => total + item.responsesCount, 0);
  }

  segmentAverageScore(segment: BranchDashboardCustomInputSegment): number {
    const totalResponses = this.segmentResponsesTotal(segment);
    if (totalResponses === 0) {
      return 0;
    }

    const weightedTotal = segment.segments.reduce(
      (total, item) => total + item.averageScorePercentage * item.responsesCount,
      0,
    );
    return weightedTotal / totalResponses;
  }

  customInputsText(response: BranchDashboardCriticalResponse): string {
    if (response.customInputs.length === 0) {
      return this.i18n.translate('branchDashboard.noCustomFields');
    }

    return response.customInputs.map((input) => `${input.name}: ${input.value}`).join(' | ');
  }

  openResponseDetails(surveyResponseId: string): void {
    this.dashboardStore.loadResponseDetails(surveyResponseId);
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
  }

  private renderTrendChart(
    canvas: HTMLCanvasElement,
    trend: readonly { period: string; averageScorePercentage: number; responsesCount: number }[],
    language: string,
  ): void {
    this.trendChart?.destroy();
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map((point) => point.period),
        datasets: [
          {
            label: 'Average Score %',
            data: trend.map((point) => point.averageScorePercentage),
            borderColor: '#11A7C9',
            backgroundColor: 'rgba(17, 167, 201, 0.14)',
            fill: true,
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
        layout: { padding: { top: 8 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const point = trend[context.dataIndex];
                return `Responses: ${point?.responsesCount ?? 0}`;
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
