import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { TableColumn, TableRow } from '../../../shared/models/table.model';
import { ManagedUser } from '../models/user-management.model';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTableComponent {
  readonly users = input<readonly ManagedUser[]>([]);
  private readonly i18n = inject(I18nService);

  readonly columns = computed<readonly TableColumn[]>(() => [
    { key: 'id', label: this.i18n.translate('common.id') },
    { key: 'name', label: this.i18n.translate('common.name') },
    { key: 'role', label: this.i18n.translate('common.role') },
    { key: 'scope', label: this.i18n.translate('common.scope') },
    { key: 'status', label: this.i18n.translate('common.status') }
  ]);

  readonly rows = computed<readonly TableRow[]>(() =>
    this.users().map((user) => ({
      id: user.id,
      name: user.name,
      role: this.roleLabel(user.role),
      scope: user.scope,
      status: this.i18n.translate(user.status === 'ACTIVE' ? 'common.active' : 'common.invited')
    }))
  );

  private roleLabel(role: ManagedUser['role']): string {
    const key = {
      SUPER_ADMIN: 'common.superAdmin',
      BRANCH_ADMIN: 'common.branchAdmin',
      DEPARTMENT_ADMIN: 'common.departmentAdmin',
      BRANCH_USER: 'common.branchUser'
    }[role];

    return this.i18n.translate(key);
  }
}
