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
  FileText,
  Frown,
  HelpCircle,
  MessageSquareWarning,
  Mic,
  Search,
  SlidersHorizontal,
  Smile,
  TrendingUp,
} from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  AnonymousTemplateDashboardCriticalResponse,
  AnonymousTemplateDashboardCustomInputSegment,
  AnonymousTemplateDashboardQuestionInsight,
  AnonymousTemplateDashboardRiskLevel,
  AnonymousTemplateDashboardTemplatePerformance,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplateDashboardStore } from '../state/anonymous-template-dashboard.store';

Chart.register(...registerables);

@Component({
  selector: 'app-anonymous-template-dashboard-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe, DecimalPipe, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './anonymous-template-dashboard-page.component.html',
  styleUrl: './anonymous-template-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateDashboardPageComponent implements OnInit, OnDestroy {
  readonly store = inject(AnonymousTemplateDashboardStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendCanvas');
  private trendChart: Chart<'line', number[], string> | null = null;

  readonly alertIcon = AlertTriangle;
  readonly chartIcon = BarChart3;
  readonly complaintIcon = MessageSquareWarning;
  readonly filterIcon = SlidersHorizontal;
  readonly frownIcon = Frown;
  readonly helpIcon = HelpCircle;
  readonly micIcon = Mic;
  readonly searchIcon = Search;
  readonly smileIcon = Smile;
  readonly templateIcon = FileText;
  readonly trendIcon = TrendingUp;

  readonly advancedFiltersOpen = signal(true);
  readonly selectedSegmentName = signal('');
  readonly selectedSegment = computed<AnonymousTemplateDashboardCustomInputSegment | null>(() => {
    const segments = this.store.dashboard()?.customInputSegments ?? [];
    if (segments.length === 0) {
      return null;
    }

    return (
      segments.find((segment) => segment.customInputName === this.selectedSegmentName()) ??
      segments[0]
    );
  });

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    anonymousTemplateId: [''],
    groupBy: ['Day' as 'Day' | 'Month'],
    criticalScoreThreshold: ['40'],
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

      this.renderTrendChart(canvas.nativeElement, dashboard.satisfactionTrend, language);
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

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.load({
      from: value.from || undefined,
      to: value.to || undefined,
      anonymousTemplateId: value.anonymousTemplateId || undefined,
      groupBy: value.groupBy,
      criticalScoreThreshold: this.toScoreThreshold(value.criticalScoreThreshold),
      topQuestionsCount: 5,
      criticalResponsesCount: 10,
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      anonymousTemplateId: '',
      groupBy: 'Day',
      criticalScoreThreshold: '40',
    });
    this.store.load();
  }

  openCriticalResponse(response: AnonymousTemplateDashboardCriticalResponse): void {
    if (!response.anonymousTemplateId || !response.anonymousSurveyResponseId) {
      return;
    }

    void this.router.navigate([
      '/anonymous-templates',
      response.anonymousTemplateId,
      'responses',
      response.anonymousSurveyResponseId,
    ]);
  }

  templateName(
    item:
      | { nameEn: string | null; nameAr?: string | null }
      | { templateNameEn: string | null; templateNameAr?: string | null },
  ): string {
    if ('nameEn' in item) {
      return this.localized(item.nameEn, item.nameAr);
    }

    return this.localized(item.templateNameEn, item.templateNameAr);
  }

  questionText(item: AnonymousTemplateDashboardQuestionInsight): string {
    return this.localized(item.questionTextEn, item.questionTextAr);
  }

  riskLabel(riskLevel: AnonymousTemplateDashboardRiskLevel): string {
    if (riskLevel === 'HighRisk') {
      return this.i18n.translate('anonymousDashboard.highRisk');
    }
    if (riskLevel === 'MediumRisk') {
      return this.i18n.translate('anonymousDashboard.mediumRisk');
    }
    return this.i18n.translate('anonymousDashboard.healthy');
  }

  riskClasses(riskLevel: AnonymousTemplateDashboardRiskLevel): string {
    if (riskLevel === 'HighRisk') {
      return 'bg-rose-50 text-rose-700';
    }
    if (riskLevel === 'MediumRisk') {
      return 'bg-amber-50 text-amber-700';
    }
    return 'bg-emerald-50 text-emerald-700';
  }

  barWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  segmentResponsesTotal(segment: AnonymousTemplateDashboardCustomInputSegment): number {
    return segment.segments.reduce((total, item) => total + item.responsesCount, 0);
  }

  customInputsText(response: AnonymousTemplateDashboardCriticalResponse): string {
    if (response.customInputs.length === 0) {
      return this.i18n.translate('anonymousDashboard.noCustomInputs');
    }

    return response.customInputs.map((input) => `${input.name}: ${input.value || '-'}`).join(' | ');
  }

  private localized(
    englishText: string | null | undefined,
    arabicText: string | null | undefined,
  ): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
  }

  private toScoreThreshold(value: string): number {
    const threshold = Number(value);
    if (!Number.isFinite(threshold)) {
      return 40;
    }

    return Math.min(Math.max(threshold, 0), 100);
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const point = trend[context.dataIndex];
                return `${this.i18n.translate('anonymousDashboard.responses')}: ${
                  point?.responsesCount ?? 0
                }`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
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
