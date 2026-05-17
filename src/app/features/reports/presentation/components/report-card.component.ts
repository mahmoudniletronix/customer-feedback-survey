import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartColumnIncreasing, LucideIconData, MessageSquareText, TriangleAlert } from 'lucide-angular';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ReportIcon, ReportSummary } from '../../domain/report.model';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './report-card.component.html',
  styleUrl: './report-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportCardComponent {
  readonly report = input.required<ReportSummary>();
  readonly icons: Record<ReportIcon, LucideIconData> = {
    satisfaction: ChartColumnIncreasing,
    feedback: MessageSquareText,
    risk: TriangleAlert
  };
}
