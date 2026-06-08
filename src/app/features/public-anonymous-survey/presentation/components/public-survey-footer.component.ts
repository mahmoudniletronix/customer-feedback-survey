import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';
import { BRAND_ASSETS } from '../../../../core/theme/brand-assets';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-survey-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer
      class="border-t border-white/20 bg-[var(--theme-color-primary)] px-4 py-3 text-center text-[11px] font-bold text-[var(--theme-color-on-primary)] shadow-[0_-10px_24px_rgb(var(--theme-shadow-rgb)/5%)]"
      [attr.aria-label]="'publicAnonymousTemplates.footerPoweredBy' | t"
      [attr.dir]="i18n.direction()"
    >
      <a
        class="inline-flex max-w-full flex-wrap items-center justify-center gap-2 transition duration-200 hover:text-white"
        href="https://www.niletronix.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="uppercase tracking-wide">
          {{ 'publicAnonymousTemplates.footerPoweredBy' | t }}
        </span>
        <span
          class="inline-flex min-h-6 items-center justify-center rounded-md border border-white/80 bg-white/95 px-1.5 py-0.5 shadow-sm shadow-slate-900/10"
        >
          <img class="h-4 w-auto object-contain" [src]="brandAssets.publicSurveyFooterLogo" alt="NILETRONIX" />
        </span>
        <span class="break-words text-[var(--theme-color-on-primary)] [unicode-bidi:isolate]" dir="ltr">
          www.niletronix.com
        </span>
      </a>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSurveyFooterComponent {
  readonly i18n = inject(I18nService);
  readonly brandAssets = BRAND_ASSETS;
}
