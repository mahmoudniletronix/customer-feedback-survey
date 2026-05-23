import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChevronLeft } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <button
      class="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-extrabold text-slate-600 shadow-sm shadow-slate-200/50 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11A7C9]/20"
      type="button"
      [attr.aria-label]="'common.back' | t"
      (click)="goBack()"
    >
      <app-icon [icon]="chevronLeftIcon" [size]="13" />
      {{ 'common.back' | t }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  private readonly location = inject(Location);

  readonly chevronLeftIcon = ChevronLeft;

  goBack(): void {
    this.location.back();
  }
}
