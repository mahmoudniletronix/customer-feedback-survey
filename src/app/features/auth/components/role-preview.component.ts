import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShieldCheck } from 'lucide-angular';
import { Role } from '../../../shared/models/role.model';
import { RoleLabelPipe } from '../../../shared/pipes/role-label.pipe';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-role-preview',
  standalone: true,
  imports: [RoleLabelPipe, IconComponent],
  templateUrl: './role-preview.component.html',
  styleUrl: './role-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePreviewComponent {
  readonly role = input.required<Role>();
  readonly description = input.required<string>();
  readonly shieldIcon = ShieldCheck;
}
