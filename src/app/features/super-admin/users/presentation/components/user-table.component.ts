import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { KeyRound } from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ManagedUser } from '../../domain/user-management.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslatePipe],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent {
  readonly users = input<readonly ManagedUser[]>([]);
  readonly resetPasswordRequested = output<ManagedUser>();
  readonly resetPasswordIcon = KeyRound;

  private readonly authStore = inject(AuthStore);
  private readonly i18n = inject(I18nService);

  roleLabel(role: ManagedUser['role']): string {
    const key = {
      SUPER_ADMIN: 'common.superAdmin',
      BRANCH_ADMIN: 'common.branchAdmin',
      DEPARTMENT_ADMIN: 'common.departmentAdmin',
      BRANCH_USER: 'common.branchUser',
      OPERATOR: 'common.operator',
    }[role];

    return this.i18n.translate(key);
  }

  statusLabel(status: ManagedUser['status']): string {
    return this.i18n.translate(status === 'ACTIVE' ? 'common.active' : 'common.invited');
  }

  canResetPassword(user: ManagedUser): boolean {
    return user.status === 'ACTIVE' && this.authStore.canResetUserPassword(user.role, user.id);
  }

  requestResetPassword(user: ManagedUser): void {
    if (!this.canResetPassword(user)) {
      return;
    }

    this.resetPasswordRequested.emit(user);
  }
}
