import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Building2,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  FileText,
  HelpCircle,
  History,
  LucideIconData,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  UserCog,
  UsersRound,
} from 'lucide-angular';
import { Role } from '../../shared/models/role.model';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface MenuItem {
  label: string;
  labelKey: string;
  superAdminLabelKey?: string;
  path: string;
  icon: LucideIconData;
  roles: readonly Role[];
  feature?:
    | 'templates'
    | 'questionGroups'
    | 'questions'
    | 'globalQuestionGroups'
    | 'globalQuestions'
    | 'anonymousTemplates'
    | 'surveyDashboard'
    | 'systemReports'
    | 'departmentReports'
    | 'branchDashboard';
  exact?: boolean;
  child?: boolean;
}

const MENU_ITEMS: readonly MenuItem[] = [
  {
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    superAdminLabelKey: 'nav.branchesDashboard',
    path: '/reports/survey-dashboard',
    icon: ChartNoAxesColumnIncreasing,
    roles: [],
    feature: 'surveyDashboard',
    exact: true,
  },
  {
    label: 'System Dashboard',
    labelKey: 'nav.systemDashboard',
    path: '/reports/system-dashboard',
    icon: ChartNoAxesColumnIncreasing,
    roles: [],
    feature: 'systemReports',
    exact: true,
  },
  {
    label: 'System Responses History',
    labelKey: 'nav.systemResponsesHistory',
    path: '/reports/system-responses',
    icon: History,
    roles: [],
    feature: 'systemReports',
    exact: true,
    child: true,
  },
  {
    label: 'Department Reports',
    labelKey: 'nav.reports',
    path: '/reports/department/dashboard',
    icon: ChartNoAxesColumnIncreasing,
    roles: [],
    feature: 'departmentReports',
    exact: true,
  },
  {
    label: 'Templates PDF Report',
    labelKey: 'nav.branchTemplatesPdfReport',
    path: '/branch-admin/reports/templates-pdf',
    icon: FileText,
    roles: [],
    feature: 'branchDashboard',
    exact: true,
    child: true,
  },
  {
    label: 'Branch users',
    labelKey: 'branchUsers.title',
    path: '/branch-admin/users',
    icon: UsersRound,
    roles: ['BRANCH_ADMIN'],
    exact: true,
    child: true,
  },
  {
    label: 'Templates',
    labelKey: 'branchTemplates.title',
    path: '/branch-admin/templates',
    icon: FileText,
    roles: ['BRANCH_ADMIN'],
    feature: 'templates',
    exact: true,
    child: true,
  },
  {
    label: 'Questions',
    labelKey: 'questions.title',
    path: '/branch-admin/questions',
    icon: HelpCircle,
    roles: ['BRANCH_ADMIN'],
    feature: 'questions',
    exact: true,
    child: true,
  },
  {
    label: 'Question groups',
    labelKey: 'questionGroups.title',
    path: '/branch-admin/question-groups',
    icon: ClipboardList,
    roles: ['BRANCH_ADMIN'],
    feature: 'questionGroups',
    exact: true,
    child: true,
  },
  {
    label: 'Branches',
    labelKey: 'nav.branches',
    path: '/branches',
    icon: Building2,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Departments',
    labelKey: 'nav.departments',
    path: '/departments',
    icon: Network,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Global question groups',
    labelKey: 'nav.globalQuestionGroups',
    path: '/global-question-groups',
    icon: ClipboardList,
    roles: [],
    feature: 'globalQuestionGroups',
  },
  {
    label: 'Global questions',
    labelKey: 'nav.globalQuestions',
    path: '/global-questions',
    icon: HelpCircle,
    roles: [],
    feature: 'globalQuestions',
  },
  {
    label: 'Anonymous templates',
    labelKey: 'nav.anonymousTemplates',
    path: '/anonymous-templates',
    icon: QrCode,
    roles: [],
    feature: 'anonymousTemplates',
    exact: true,
  },
  {
    label: 'Surveys',
    labelKey: 'nav.surveys',
    path: '/survey',
    icon: ClipboardList,
    roles: [],
  },
  {
    label: 'Operators',
    labelKey: 'operators.title',
    path: '/operators',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
  },
  {
    label: 'My templates',
    labelKey: 'operatorTemplates.title',
    path: '/operator/templates',
    icon: FileText,
    roles: ['OPERATOR'],
  },
  // {
  //   label: 'Users',
  //   labelKey: 'nav.users',
  //   path: '/users',
  //   icon: UsersRound,
  //   roles: ['SUPER_ADMIN']
  // },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly toggle = output<void>();
  readonly close = output<void>();
  readonly panelLeftCloseIcon = PanelLeftClose;
  readonly panelLeftOpenIcon = PanelLeftOpen;

  private readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);

  readonly menuItems = computed(() => {
    const role = this.authStore.role();
    return MENU_ITEMS.filter(
      (item) => (role !== null && item.roles.includes(role)) || this.canAccessFeature(item.feature),
    ).map((item) =>
      role === 'SUPER_ADMIN' && item.superAdminLabelKey
        ? { ...item, labelKey: item.superAdminLabelKey }
        : item,
    );
  });

  private canAccessFeature(feature: MenuItem['feature']): boolean {
    if (feature === 'templates') {
      return this.authStore.canAccessTemplates();
    }
    if (feature === 'questionGroups') {
      return this.authStore.canAccessQuestionGroups();
    }
    if (feature === 'questions') {
      return this.authStore.canAccessQuestions();
    }
    if (feature === 'globalQuestionGroups') {
      return this.authStore.canAccessGlobalQuestionGroups();
    }
    if (feature === 'globalQuestions') {
      return this.authStore.canAccessGlobalQuestions();
    }
    if (feature === 'anonymousTemplates') {
      return this.authStore.canAccessAnonymousTemplates();
    }
    if (feature === 'surveyDashboard') {
      return this.authStore.canAccessSurveyDashboard();
    }
    if (feature === 'systemReports') {
      return this.authStore.canAccessSystemReports();
    }
    if (feature === 'departmentReports') {
      return this.authStore.canAccessDepartmentReports();
    }
    if (feature === 'branchDashboard') {
      return this.authStore.canAccessBranchDashboard();
    }
    return false;
  }
}
