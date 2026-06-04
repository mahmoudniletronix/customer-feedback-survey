import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BRAND_ASSETS, BRANDING } from '../../../../core/theme/brand-assets';

interface BrowserTabBranding {
  readonly title: string;
  readonly faviconHref: string;
  readonly faviconType: string;
}

@Injectable({ providedIn: 'root' })
export class PublicSurveyBrandingService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly appBranding = this.readCurrentBranding();

  applyPublicSurveyBranding(): void {
    this.title.setTitle(BRANDING.publicSurveyTitle);
    this.setFavicon(BRAND_ASSETS.favicon, BRANDING.faviconType);
  }

  restoreAppBranding(): void {
    this.title.setTitle(this.appBranding.title);
    this.setFavicon(this.appBranding.faviconHref, this.appBranding.faviconType);
  }

  private setFavicon(href: string, type: string): void {
    let favicon = this.currentFavicon();

    if (!favicon) {
      favicon = this.document.createElement('link');
      favicon.rel = 'icon';
      this.document.head.appendChild(favicon);
    }

    if (type.length > 0) {
      favicon.type = type;
    } else {
      favicon.removeAttribute('type');
    }

    favicon.setAttribute('href', href);
  }

  private readCurrentBranding(): BrowserTabBranding {
    const favicon = this.currentFavicon();

    return {
      title: this.title.getTitle(),
      faviconHref: favicon?.getAttribute('href') ?? '',
      faviconType: favicon?.getAttribute('type') ?? '',
    };
  }

  private currentFavicon(): HTMLLinkElement | null {
    return this.document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  }
}
