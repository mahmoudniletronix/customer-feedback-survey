import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BarChart3, Frown, MessageSquareText, Mic, Smile, TrendingUp } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchAdminTemplate } from '../../../branch/domain/branch-admin-branch.model';
import {
  SatisfactionByTemplateItem,
  SatisfactionDistributionItem,
} from '../../domain/branch-satisfaction-report.model';
import { BranchSatisfactionReportStore } from '../state/branch-satisfaction-report.store';

Chart.register(...registerables);

@Component({
  selector: 'app-branch-satisfaction-report-panel',
  standalone: true,
  imports: [ButtonComponent, DecimalPipe, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './branch-satisfaction-report-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchSatisfactionReportPanelComponent implements OnInit, OnDestroy {
  readonly templates = input<readonly BranchAdminTemplate[]>([]);
  readonly reportStore = inject(BranchSatisfactionReportStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart<'line', number[], string> | null = null;

  readonly chartIcon = BarChart3;
  readonly complaintsIcon = MessageSquareText;
  readonly frownIcon = Frown;
  readonly micIcon = Mic;
  readonly smileIcon = Smile;
  readonly trendIcon = TrendingUp;

  readonly filtersForm = this.formBuilder.nonNullable.group({
    templateId: [''],
    from: [''],
    to: [''],
  });

  constructor() {
    effect(() => {
      const canvas = this.chartCanvas();
      const report = this.reportStore.report();
      const language = this.i18n.language();

      if (!canvas || !report || report.trend.length === 0) {
        this.chart?.destroy();
        this.chart = null;
        return;
      }

      this.renderTrendChart(canvas.nativeElement, report.trend, language);
    });
  }

  ngOnInit(): void {
    this.reportStore.load();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.reportStore.load({
      templateId: value.templateId || undefined,
      from: value.from || undefined,
      to: value.to || undefined,
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      templateId: '',
      from: '',
      to: '',
    });
    this.reportStore.load({});
  }

  templateName(template: BranchAdminTemplate): string {
    if (this.i18n.language() === 'ar') {
      return template.nameAr || template.nameEn || '-';
    }

    return template.nameEn || template.nameAr || '-';
  }

  distributionLabel(item: SatisfactionDistributionItem): string {
    if (this.i18n.language() === 'ar') {
      return item.labelAr || item.labelEn || String(item.value);
    }

    return item.labelEn || item.labelAr || String(item.value);
  }

  byTemplateLabel(item: SatisfactionByTemplateItem): string {
    if (this.i18n.language() === 'ar') {
      return item.templateNameAr || item.templateNameEn || '-';
    }

    return item.templateNameEn || item.templateNameAr || '-';
  }

  scoreState(score: number): string {
    if (score >= 80) {
      return 'branchReports.satisfied';
    }
    if (score >= 60) {
      return 'branchReports.neutral';
    }
    return 'branchReports.unsatisfied';
  }

  scoreColorClass(score: number): string {
    if (score >= 80) {
      return 'text-emerald-700';
    }
    if (score >= 60) {
      return 'text-amber-700';
    }
    return 'text-rose-700';
  }

  barWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  private renderTrendChart(
    canvas: HTMLCanvasElement,
    trend: readonly { date: string; score: number; responsesCount: number }[],
    language: string,
  ): void {
    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trend.map((point) => point.date),
        datasets: [
          {
            label: this.i18n.translate('branchReports.score'),
            data: trend.map((point) => point.score),
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
        layout: {
          padding: {
            top: 8,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const point = trend[context.dataIndex];
                return `${this.i18n.translate('branchReports.responses')}: ${point?.responsesCount ?? 0}`;
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
