import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';
import { FileText, Network, UserCog, UsersRound } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { BranchAdminBranchDetails, BranchAdminTemplate } from '../../branch/domain/branch-admin-branch.model';
import { BranchAdminBranchStore } from '../../branch/presentation/state/branch-admin-branch.store';
import { BranchSatisfactionReportPanelComponent } from '../../reports/presentation/components/branch-satisfaction-report-panel.component';

@Component({
  selector: 'app-branch-admin-overview-page',
  standalone: true,
  imports: [
    BranchSatisfactionReportPanelComponent,
    DatePipe,
    IconComponent,
    TranslatePipe,
  ],
  templateUrl: './branch-admin-overview-page.component.html',
  styleUrl: './branch-admin-overview-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAdminOverviewPageComponent implements OnInit {
  readonly branchStore = inject(BranchAdminBranchStore);
  private readonly i18n = inject(I18nService);

  readonly departmentIcon = Network;
  readonly templateIcon = FileText;
  readonly userCogIcon = UserCog;
  readonly usersIcon = UsersRound;

  ngOnInit(): void {
    this.branchStore.load();
  }

  branchName(branch: BranchAdminBranchDetails): string {
    if (this.i18n.language() === 'ar') {
      return branch.nameAr || branch.nameEn || '-';
    }

    return branch.nameEn || branch.nameAr || '-';
  }

  templateName(template: BranchAdminTemplate): string {
    if (this.i18n.language() === 'ar') {
      return template.nameAr || template.nameEn || '-';
    }

    return template.nameEn || template.nameAr || '-';
  }

  templateDescription(template: BranchAdminTemplate): string {
    return template.description || '-';
  }
}
