import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Building2,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  LayoutDashboard,
  LucideIconData,
  MessageSquareText,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
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
    roles: ['BRANCH_ADMIN']
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
    roles: ['DEPARTMENT_ADMIN']
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
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN']
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
    return MENU_ITEMS.filter((item) => role !== null && item.roles.includes(role));
  });
}
