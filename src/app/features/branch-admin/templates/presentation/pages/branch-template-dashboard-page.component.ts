import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BranchDashboardPageComponent } from '../../../dashboard/presentation/pages/branch-dashboard-page.component';

@Component({
  selector: 'app-branch-template-dashboard-page',
  standalone: true,
  imports: [BranchDashboardPageComponent],
  template: '<app-branch-dashboard-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateDashboardPageComponent {}
