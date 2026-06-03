import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  Bell,
  Briefcase,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-angular';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';
import { BranchContextService } from '../../core/services/branch-context.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { SidebarComponent } from './sidebar.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { AppFooterComponent } from '../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, IconComponent, TranslatePipe, AppFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  readonly authStore = inject(AuthStore);
  readonly branchContext = inject(BranchContextService);
  readonly i18n = inject(I18nService);
  readonly sidebarCollapsed = signal(false);
  readonly mobileSidebarOpen = signal(false);
  readonly languagesIcon = Languages;
  readonly logoutIcon = LogOut;
  readonly menuIcon = Menu;
  readonly userIcon = UserRound;
  readonly notificationIcon = Bell;
  readonly chevronDownIcon = ChevronDown;
  readonly branchIcon = Store;
  private readonly desktopSidebarMediaQuery = '(min-width: 1280px)';

  readonly userInitial = computed(
    () => this.authStore.user()?.name?.charAt(0).toUpperCase() ?? 'U',
  );
  readonly userDisplayName = computed(() => this.authStore.user()?.name ?? 'User');
  readonly userEmail = computed(() => this.authStore.user()?.email ?? '');
  readonly branchDisplayName = computed(() => {
    const branch = this.branchContext.branch();
    if (branch) {
      const branchName = this.localizedText(branch.nameEn, branch.nameAr);
      if (branchName.length > 0) {
        return branchName;
      }
    }

    const user = this.authStore.user();
    if (!user) {
      return '';
    }

    return this.localizedText(user.branchNameEn ?? '', user.branchNameAr ?? '');
  });

  constructor() {
    effect(() => {
      const user = this.authStore.user();
      const role = this.authStore.role();

      if (!user || role === 'SUPER_ADMIN') {
        this.branchContext.clear();
        return;
      }

      this.branchContext.loadCurrentBranch(user.branchId, role);
    });
  }

  private localizedText(englishText: string, arabicText: string): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '';
    }

    return englishText || arabicText || '';
  }

  readonly roleIcon = computed(() => {
    const role = this.authStore.role();
    if (role === 'SUPER_ADMIN') return ShieldCheck;
    if (role === 'BRANCH_ADMIN' || role === 'BRANCH_USER') return Store;
    return Briefcase;
  });

  readonly roleBadgeLabel = computed(() => {
    const role = this.authStore.role();
    if (role === 'BRANCH_USER') {
      return this.userDisplayName();
    }
    if (role === 'SUPER_ADMIN') {
      return this.i18n.translate('common.superAdmin');
    }
    if (role === 'BRANCH_ADMIN') {
      return this.i18n.translate('common.branchAdmin');
    }
    if (role === 'DEPARTMENT_ADMIN') {
      return this.i18n.translate('common.departmentAdmin');
    }
    if (role === 'OPERATOR') {
      return this.i18n.translate('common.operator');
    }
    return '';
  });

  readonly pageTitle = computed(() => {
    const role = this.authStore.role();
    if (role === 'SUPER_ADMIN') {
      return this.i18n.translate('layout.globalAdministration');
    }
    if (role === 'BRANCH_ADMIN') {
      return this.i18n.translate('layout.branchOperations');
    }
    if (role === 'BRANCH_USER') {
      return this.branchUserTitle();
    }
    if (role === 'OPERATOR') {
      return this.i18n.translate('layout.operatorWorkspace');
    }
    return this.i18n.translate('layout.departmentWorkspace');
  });

  private branchUserTitle(): string {
    const assignedRoles = this.authStore
      .apiRoles()
      .filter((role) => this.normalizeRole(role) !== 'branchuser');

    return assignedRoles.length > 0 ? assignedRoles.join(', ') : this.userDisplayName();
  }

  private normalizeRole(role: string): string {
    return role.replace(/[\s_-]/g, '').toLowerCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  openMobileSidebar(): void {
    if (this.isDesktopSidebarViewport()) {
      this.mobileSidebarOpen.set(false);
      return;
    }

    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  @HostListener('window:resize')
  closeMobileSidebarOnDesktop(): void {
    if (this.isDesktopSidebarViewport()) {
      this.mobileSidebarOpen.set(false);
    }
  }

  logout(): void {
    this.authStore.logout();
  }

  private isDesktopSidebarViewport(): boolean {
    return globalThis.matchMedia?.(this.desktopSidebarMediaQuery).matches ?? false;
  }
}
