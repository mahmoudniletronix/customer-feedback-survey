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
import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import {
  Search,
  SlidersHorizontal,
  Users,
  FileText,
  BarChart3,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Mic,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import {
  DepartmentCriticalResponse,
  DepartmentCustomInputSegment,
  DepartmentDashboardResponse,
  DepartmentOperatorPerformance,
  DepartmentQuestionInsight,
  DepartmentReportTemplateOption,
  DepartmentReportsGroupBy,
  DepartmentReportsRiskLevel,
  DepartmentTemplatePerformance,
} from '../../domain/department-reports.model';
import { DepartmentDashboardStore } from '../state/department-dashboard.store';

Chart.register(...registerables);

@Component({
  selector: 'app-department-dashboard-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe, DecimalPipe, IconComponent, LowerCasePipe, ReactiveFormsModule, TranslatePipe],
  templateUrl: './department-dashboard-page.component.html',
  styleUrl: './department-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDashboardPageComponent implements OnInit, OnDestroy {
  readonly store = inject(DepartmentDashboardStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendCanvas');
  private trendChart: Chart<'line', number[], string> | null = null;

  readonly searchIcon = Search;
  readonly filtersIcon = SlidersHorizontal;
  readonly usersIcon = Users;
  readonly fileTextIcon = FileText;
  readonly barChartIcon = BarChart3;
  readonly alertTriangleIcon = AlertTriangle;
  readonly smileIcon = Smile;
  readonly mehIcon = Meh;
  readonly frownIcon = Frown;
  readonly trendingUpIcon = TrendingUp;
  readonly micIcon = Mic;
  readonly advancedFiltersOpen = signal(true);
  readonly selectedSegmentName = signal('');
  readonly selectedSegment = computed<DepartmentCustomInputSegment | null>(() => {
    const segments = this.store.dashboard()?.customInputSegments ?? [];
    const selected = this.selectedSegmentName();
    return segments.find((segment) => segment.customInputName === selected) ?? segments[0] ?? null;
  });

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    templateId: [''],
    groupBy: ['Day' as DepartmentReportsGroupBy],
    topQuestionsCount: ['5'],
    criticalResponsesCount: ['10'],
    criticalScoreThreshold: ['40'],
  });

  readonly operatorMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalOperators,
      active: summary.activeOperators,
      activePercentage: summary.totalOperators > 0
        ? Math.round((summary.activeOperators / summary.totalOperators) * 100)
        : 0,
    };
  });

  readonly templateMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalAssignedTemplates,
      active: summary.activeAssignedTemplates,
      withResponses: summary.templatesWithResponsesCount,
    };
  });

  readonly responseMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalResponses,
      averageScore: summary.averageScorePercentage,
    };
  });

  readonly issueMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      complaints: summary.complaintsCount,
      voice: summary.voiceAnswersCount,
    };
  });

  readonly satisfactionData = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    const total = summary.satisfiedResponses + summary.neutralResponses + summary.unhappyResponses;
    return {
      satisfied: summary.satisfiedResponses,
      neutral: summary.neutralResponses,
      unhappy: summary.unhappyResponses,
      scored: summary.scoredResponses,
      unscored: summary.unscoredResponses,
      total,
      satisfiedPercent: total > 0 ? (summary.satisfiedResponses / total) * 100 : 0,
      neutralPercent: total > 0 ? (summary.neutralResponses / total) * 100 : 0,
      unhappyPercent: total > 0 ? (summary.unhappyResponses / total) * 100 : 0,
    };
  });

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

      this.renderTrendChart(canvas.nativeElement, dashboard, language);
    });

    effect(() => {
      const segments = this.store.dashboard()?.customInputSegments ?? [];
      const selectedName = this.selectedSegmentName();
      if (segments.length > 0 && !segments.some((segment) => segment.customInputName === selectedName)) {
        this.selectedSegmentName.set(segments[0].customInputName);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadTemplates();
    this.store.load();
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.load({
      from: value.from || undefined,
      to: value.to || undefined,
      templateId: value.templateId || undefined,
      groupBy: value.groupBy,
      topQuestionsCount: this.toOptionalPositiveInteger(value.topQuestionsCount),
      criticalResponsesCount: this.toOptionalPositiveInteger(value.criticalResponsesCount),
      criticalScoreThreshold: this.toOptionalPercentage(value.criticalScoreThreshold),
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      templateId: '',
      groupBy: 'Day',
      topQuestionsCount: '5',
      criticalResponsesCount: '10',
      criticalScoreThreshold: '40',
    });
    this.store.load();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  openOperatorResponses(operator: DepartmentOperatorPerformance): void {
    if (!operator.operatorId) return;
    void this.router.navigate(['/reports/department/operators', operator.operatorId, 'responses']);
  }

  openCriticalResponse(response: DepartmentCriticalResponse): void {
    if (!response.operatorId || !response.surveyResponseId) return;
    void this.router.navigate([
      '/reports/department/operators',
      response.operatorId,
      'responses',
      response.surveyResponseId,
    ]);
  }

  optionName(template: DepartmentReportTemplateOption): string {
    const name = this.localized(template.nameEn, template.nameAr);
    return template.branchCode ? `${name} (${template.branchCode})` : name;
  }

  operatorName(operator: DepartmentOperatorPerformance | DepartmentCriticalResponse): string {
    return this.localized(operator.operatorNameEn, operator.operatorNameAr);
  }

  templateName(
    item: DepartmentTemplatePerformance | DepartmentQuestionInsight | DepartmentCriticalResponse,
  ): string {
    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  branchName(item: DepartmentTemplatePerformance | DepartmentCriticalResponse): string {
    const name = this.localized(item.branchNameEn, item.branchNameAr);
    return item.branchCode ? `${name} (${item.branchCode})` : name;
  }

  questionText(item: DepartmentQuestionInsight): string {
    return this.localized(item.questionTextEn, item.questionTextAr);
  }

  questionTypeLabel(item: DepartmentQuestionInsight): string {
    return this.translateQuestionType(item.questionType, item.questionTypeName);
  }

  operatorStatusLabel(status: string): string {
    if (!status || status === '-') return '-';
    if (status === 'Active') return this.i18n.translate('common.active');
    if (status === 'Inactive') return this.i18n.translate('branches.inactive');
    if (status === 'Invited') return this.i18n.translate('common.invited');

    return status;
  }

  customInputTypeLabel(typeName: string): string {
    if (typeName === 'String') return this.i18n.translate('branchTemplates.customInputTypeString');
    if (typeName === 'Integer') return this.i18n.translate('branchTemplates.customInputTypeInteger');

    return typeName || '-';
  }

  riskLabel(riskLevel: DepartmentReportsRiskLevel): string {
    if (riskLevel === 'HighRisk') return this.i18n.translate('departmentDashboard.highRisk');
    if (riskLevel === 'MediumRisk') return this.i18n.translate('departmentDashboard.mediumRisk');
    return this.i18n.translate('departmentDashboard.healthy');
  }

  barWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  segmentResponsesTotal(segment: DepartmentCustomInputSegment): number {
    return segment.segments.reduce((total, item) => total + item.responsesCount, 0);
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }

  private translateQuestionType(type: string, fallback: string): string {
    if (type === 'SingleChoice') return this.i18n.translate('questions.typeSingleChoice');
    if (type === 'StarRating') return this.i18n.translate('questions.typeStarRating');
    if (type === 'Smiles') return this.i18n.translate('questions.typeSmiles');
    if (type === 'Complain') return this.i18n.translate('questions.typeComplain');
    if (type === 'Voice') return this.i18n.translate('questions.typeVoice');

    return fallback || type || '-';
  }

  private toOptionalPositiveInteger(value: string): number | undefined {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }

  private toOptionalPercentage(value: string): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return Math.min(Math.max(parsed, 0), 100);
  }

  private renderTrendChart(
    canvas: HTMLCanvasElement,
    dashboard: DepartmentDashboardResponse,
    language: string,
  ): void {
    const trend = dashboard.satisfactionTrend;
    this.trendChart?.destroy();
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map((point) => point.period),
        datasets: [
          {
            label: this.i18n.translate('departmentDashboard.averageScore'),
            data: trend.map((point) => point.averageScorePercentage),
            borderColor: '#11A7C9',
            backgroundColor: 'rgba(17, 167, 201, 0.14)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        locale: language,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const point = trend[context.dataIndex];
                return `${this.i18n.translate('departmentDashboard.responses')}: ${
                  point?.responsesCount ?? 0
                }`;
              },
            },
          },
        },
        scales: {
          y: { beginAtZero: true, suggestedMax: 100, grid: { color: '#E5EAF1' } },
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        },
      },
    });
  }
}
