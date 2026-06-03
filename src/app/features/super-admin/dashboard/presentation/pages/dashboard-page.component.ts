import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertTriangle,
  Building2,
  ChartColumnIncreasing,
  ClipboardList,
  FileText,
  LucideIconData,
  SquarePen,
  UserCog,
} from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { DashboardStore } from '../state/dashboard.store';
import { KpiCardComponent } from '../components/kpi-card.component';
import { TrendChartComponent } from '../components/trend-chart.component';

interface WorkspaceAction {
  labelKey: string;
  path: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, TrendChartComponent, IconComponent, TranslatePipe],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  readonly dashboardStore = inject(DashboardStore);
  readonly authStore = inject(AuthStore);
  readonly alertTriangleIcon = AlertTriangle;
  readonly buildingIcon = Building2;
  readonly chartIcon = ChartColumnIncreasing;
  readonly clipboardIcon = ClipboardList;
  readonly fileTextIcon = FileText;
  readonly squarePenIcon = SquarePen;
  readonly userCogIcon = UserCog;
  readonly workspaceActions = computed<readonly WorkspaceAction[]>(() => {
    const role = this.authStore.role();

    if (role === 'SUPER_ADMIN') {
      const superAdminActions: WorkspaceAction[] = [
        { labelKey: 'dashboard.actionManageBranches', path: '/branches', icon: this.buildingIcon },
        { labelKey: 'superAdminTemplates.title', path: '/templates', icon: this.fileTextIcon },
        { labelKey: 'operators.title', path: '/operators', icon: this.userCogIcon },
      ];
      if (this.authStore.canAccessSystemReports()) {
        superAdminActions.push({
          labelKey: 'dashboard.actionReviewGlobalReports',
          path: '/reports/system-dashboard',
          icon: this.chartIcon,
        });
      }
      return superAdminActions;
    }

    if (role === 'BRANCH_ADMIN') {
      return [
        { labelKey: 'branchUsers.title', path: '/branch-admin/users', icon: this.userCogIcon },
        { labelKey: 'branchTemplates.title', path: '/branch-admin/templates', icon: this.fileTextIcon },
        { labelKey: 'questions.title', path: '/branch-admin/questions', icon: this.squarePenIcon },
        { labelKey: 'questionGroups.title', path: '/branch-admin/question-groups', icon: this.clipboardIcon },
      ];
    }

    if (role === 'BRANCH_USER') {
      const branchUserActions: WorkspaceAction[] = [];
      if (this.authStore.canAccessTemplates()) {
        branchUserActions.push({
          labelKey: 'branchTemplates.title',
          path: '/branch-admin/templates',
          icon: this.fileTextIcon,
        });
      }
      if (this.authStore.canAccessQuestionGroups()) {
        branchUserActions.push({
          labelKey: 'questionGroups.title',
          path: '/branch-admin/question-groups',
          icon: this.clipboardIcon,
        });
      }
      if (this.authStore.canAccessQuestions()) {
        branchUserActions.push({
          labelKey: 'questions.title',
          path: '/branch-admin/questions',
          icon: this.squarePenIcon,
        });
      }
      if (this.authStore.canAccessBranchDashboard()) {
        branchUserActions.push({
          labelKey: 'nav.dashboard',
          path: '/branch-admin',
          icon: this.chartIcon,
        });
      }
      return branchUserActions;
    }

    if (role === 'DEPARTMENT_ADMIN') {
      return [
        { labelKey: 'operators.title', path: '/operators', icon: this.userCogIcon },
      ];
    }

    if (role === 'OPERATOR') {
      return [{ labelKey: 'operatorTemplates.title', path: '/operator/templates', icon: this.fileTextIcon }];
    }

    return [];
  });

  ngOnInit(): void {
    this.dashboardStore.load();
  }
}
