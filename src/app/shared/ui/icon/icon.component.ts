import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideIconData } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';

interface IconNodeViewModel {
  readonly id: number;
  readonly tag: string;
  readonly attrs: Record<string, string | number>;
}

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  private readonly i18n = inject(I18nService);

  readonly icon = input.required<LucideIconData>();
  readonly size = input(18);
  readonly strokeWidth = input(2);
  readonly decorative = input(true);
  readonly flipRtl = input(false);

  readonly shouldFlip = computed(() => this.flipRtl() && this.i18n.isRtl());

  readonly nodes = computed<readonly IconNodeViewModel[]>(() =>
    this.icon().map(([tag, attrs], index) => ({
      id: index,
      tag,
      attrs: attrs as Record<string, string | number>
    }))
  );
}
