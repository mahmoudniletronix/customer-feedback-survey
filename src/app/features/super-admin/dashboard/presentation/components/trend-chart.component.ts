import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ThemeColorService } from '../../../../../core/theme/theme-color.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { TrendPoint } from '../../domain/dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './trend-chart.component.html',
  styleUrl: './trend-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrendChartComponent implements OnDestroy {
  readonly data = input<readonly TrendPoint[]>([]);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly i18n = inject(I18nService);
  private readonly themeColors = inject(ThemeColorService);
  private chart: Chart<'bar', number[], string> | null = null;

  constructor() {
    effect(() => {
      const canvas = this.canvas();
      const data = this.data();
      if (!canvas || data.length === 0) {
        return;
      }

      this.render(canvas.nativeElement, data);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(canvas: HTMLCanvasElement, data: readonly TrendPoint[]): void {
    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map((point) => point.label),
        datasets: [
          {
            label: this.i18n.translate('survey.responses'),
            data: data.map((point) => point.value),
            backgroundColor: this.themeColors.color('accent'),
            borderRadius: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: this.themeColors.color('gridLine') }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}
