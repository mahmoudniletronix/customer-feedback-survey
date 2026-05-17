import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  Building2,
  ChartColumnIncreasing,
  ClipboardList,
  LucideIconData,
  MessageSquareText,
  ShieldCheck,
  SquarePen,
  UserCog,
  UsersRound
} from 'lucide-angular';
import { Kpi, KpiIcon } from '../../domain/dashboard.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  readonly kpi = input.required<Kpi>();
  readonly icons: Record<KpiIcon, LucideIconData> = {
    branches: Building2,
    admins: UsersRound,
    response: ChartColumnIncreasing,
    departments: UserCog,
    surveys: ClipboardList,
    nps: ShieldCheck,
    questions: SquarePen,
    feedback: MessageSquareText
  };

  readonly badgeClasses = computed(() => {
    const tone = this.kpi().tone;
    if (tone === 'primary') {
      return 'bg-cyan-50 text-[#11A7C9]';
    }
    if (tone === 'accent') {
      return 'bg-rose-50 text-[#D94B5A]';
    }
    return 'bg-slate-100 text-slate-600';
  });

  readonly iconClasses = computed(() => {
    const tone = this.kpi().tone;
    if (tone === 'primary') {
      return 'bg-cyan-50 text-[#11A7C9]';
    }
    if (tone === 'accent') {
      return 'bg-rose-50 text-[#D94B5A]';
    }
    return 'bg-slate-100 text-slate-600';
  });
}
