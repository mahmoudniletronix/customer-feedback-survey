import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { Role } from '../models/role.model';

const LABEL_KEYS: Record<Role, string> = {
  SUPER_ADMIN: 'common.superAdmin',
  BRANCH_ADMIN: 'common.branchAdmin',
  DEPARTMENT_ADMIN: 'common.departmentAdmin'
};

@Pipe({
  name: 'roleLabel',
  standalone: true,
  pure: false
})
export class RoleLabelPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: Role | null | undefined): string {
    return value ? this.i18n.translate(LABEL_KEYS[value]) : '';
  }
}
