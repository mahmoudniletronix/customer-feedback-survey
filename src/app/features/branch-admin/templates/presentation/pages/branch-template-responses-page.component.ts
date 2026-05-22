import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BranchResponsesHistoryPageComponent } from '../../../dashboard/presentation/pages/branch-responses-history-page.component';

@Component({
  selector: 'app-branch-template-responses-page',
  standalone: true,
  imports: [BranchResponsesHistoryPageComponent],
  template: '<app-branch-responses-history-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateResponsesPageComponent {}
