import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Pencil, Trash2 } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { Branch } from '../models/branch.model';

@Component({
  selector: 'app-branch-table',
  standalone: true,
  imports: [ButtonComponent, DatePipe, IconComponent, TranslatePipe],
  templateUrl: './branch-table.component.html',
  styleUrl: './branch-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BranchTableComponent {
  readonly branches = input<readonly Branch[]>([]);
  readonly editBranch = output<Branch>();
  readonly deleteBranch = output<Branch>();
  readonly branchSelected = output<Branch>();
  readonly editIcon = Pencil;
  readonly deleteIcon = Trash2;

  selectBranch(branch: Branch): void {
    this.branchSelected.emit(branch);
  }

  editSelectedBranch(branch: Branch, event: MouseEvent): void {
    event.stopPropagation();
    this.editBranch.emit(branch);
  }

  deleteSelectedBranch(branch: Branch, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteBranch.emit(branch);
  }
}
