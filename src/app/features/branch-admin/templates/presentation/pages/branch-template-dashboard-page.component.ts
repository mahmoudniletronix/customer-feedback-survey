import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BackButtonComponent } from '../../../../../shared/ui/back-button/back-button.component';
import { BranchDashboardPageComponent } from '../../../dashboard/presentation/pages/branch-dashboard-page.component';

@Component({
  selector: 'app-branch-template-dashboard-page',
  standalone: true,
  imports: [BackButtonComponent, BranchDashboardPageComponent],
  template: `
    <div class="w-full space-y-3">
      <app-back-button />
      <app-branch-dashboard-page />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateDashboardPageComponent {}
