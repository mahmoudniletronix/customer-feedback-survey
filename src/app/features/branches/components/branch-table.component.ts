import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { TableColumn, TableRow } from '../../../shared/models/table.model';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { Branch } from '../models/branch.model';

@Component({
  selector: 'app-branch-table',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './branch-table.component.html',
  styleUrl: './branch-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BranchTableComponent {
  readonly branches = input<readonly Branch[]>([]);
  private readonly i18n = inject(I18nService);

  readonly columns = computed<readonly TableColumn[]>(() => [
    { key: 'code', label: this.i18n.translate('branches.code') },
    { key: 'nameEn', label: this.i18n.translate('branches.nameEn') },
    { key: 'nameAr', label: this.i18n.translate('branches.nameAr') },
    { key: 'address', label: this.i18n.translate('branches.address') }
  ]);

  readonly rows = computed<readonly TableRow[]>(() =>
    this.branches().map((branch) => ({
      id: branch.id,
      code: branch.code,
      nameEn: branch.nameEn,
      nameAr: branch.nameAr,
      address: branch.address
    }))
  );
}
