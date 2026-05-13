import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Building2,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LucideIconData,
  MessageSquareText,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  UsersRound
} from 'lucide-angular';
import { Role } from '../../shared/models/role.model';
import { AuthStore } from '../../features/auth/state/auth.store';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface MenuItem {
  label: string;
  labelKey: string;
  path: string;
  icon: LucideIconData;
  roles: readonly Role[];
  feature?: 'templates' | 'questionGroups' | 'questions' | 'reports';
  exact?: boolean;
  child?: boolean;
}

const MENU_ITEMS: readonly MenuItem[] = [
  {
    label: 'Dashboard',
    labelKey: 'nav.dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'My Branch',
    labelKey: 'nav.branchWorkspace',
    path: '/branch-admin',
    icon: Building2,
    roles: ['BRANCH_ADMIN'],
    exact: true
  },
  {
    label: 'Branch users',
    labelKey: 'branchUsers.title',
    path: '/branch-admin/users',
    icon: UsersRound,
    roles: ['BRANCH_ADMIN'],
    exact: true,
    child: true
  },
  {
    label: 'Templates',
    labelKey: 'branchTemplates.title',
    path: '/branch-admin/templates',
    icon: FileText,
    roles: ['BRANCH_ADMIN'],
    feature: 'templates',
    exact: true,
    child: true
  },
  {
    label: 'Questions',
    labelKey: 'questions.title',
    path: '/branch-admin/questions',
    icon: HelpCircle,
    roles: ['BRANCH_ADMIN'],
    feature: 'questions',
    exact: true,
    child: true
  },
  {
    label: 'Question groups',
    labelKey: 'questionGroups.title',
    path: '/branch-admin/question-groups',
    icon: ClipboardList,
    roles: ['BRANCH_ADMIN'],
    feature: 'questionGroups',
    exact: true,
    child: true
  },
  {
    label: 'Branches',
    labelKey: 'nav.branches',
    path: '/branches',
    icon: Building2,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Departments',
    labelKey: 'nav.departments',
    path: '/departments',
    icon: Network,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Surveys',
    labelKey: 'nav.surveys',
    path: '/survey',
    icon: ClipboardList,
    roles: []
  },
  {
    label: 'Operators',
    labelKey: 'operators.title',
    path: '/operators',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN']
  },
  {
    label: 'My templates',
    labelKey: 'operatorTemplates.title',
    path: '/operator/templates',
    icon: FileText,
    roles: ['OPERATOR']
  },
  {
    label: 'Users',
    labelKey: 'nav.users',
    path: '/users',
    icon: UsersRound,
    roles: ['SUPER_ADMIN']
  },
  {
    label: 'Reports',
    labelKey: 'nav.reports',
    path: '/reports',
    icon: ChartNoAxesColumnIncreasing,
    roles: ['SUPER_ADMIN'],
    feature: 'reports'
  }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly toggle = output<void>();
  readonly close = output<void>();
  readonly brandIcon = MessageSquareText;
  readonly panelLeftCloseIcon = PanelLeftClose;
  readonly panelLeftOpenIcon = PanelLeftOpen;

  private readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);

  readonly menuItems = computed(() => {
    const role = this.authStore.role();
    return MENU_ITEMS.filter(
      (item) => (role !== null && item.roles.includes(role)) || this.canAccessFeature(item.feature)
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
    if (feature === 'reports') {
      return this.authStore.canAccessReports();
    }
    return false;
  }
}
