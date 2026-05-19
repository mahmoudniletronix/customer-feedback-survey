import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FileText } from 'lucide-angular';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ReportCardComponent } from '../components/report-card.component';
import { ReportsStore } from '../state/reports.store';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [IconComponent, TranslatePipe, ReportCardComponent],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPageComponent implements OnInit {
  readonly reportsStore = inject(ReportsStore);
  readonly reportIcon = FileText;

  ngOnInit(): void {
    this.reportsStore.load();
  }
}
