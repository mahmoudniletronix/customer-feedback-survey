import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Building2, ChartColumnIncreasing, ClipboardList, FileText, SquarePen, UserCog } from 'lucide-angular';
import { AuthStore } from '../../auth/state/auth.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DashboardStore } from '../state/dashboard.store';
import { KpiCardComponent } from '../components/kpi-card.component';
import { TrendChartComponent } from '../components/trend-chart.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, CardComponent, KpiCardComponent, TrendChartComponent, IconComponent, TranslatePipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  readonly dashboardStore = inject(DashboardStore);
  readonly authStore = inject(AuthStore);
  readonly buildingIcon = Building2;
  readonly chartIcon = ChartColumnIncreasing;
  readonly clipboardIcon = ClipboardList;
  readonly fileTextIcon = FileText;
  readonly squarePenIcon = SquarePen;
  readonly userCogIcon = UserCog;

  ngOnInit(): void {
    this.dashboardStore.load();
  }
}
