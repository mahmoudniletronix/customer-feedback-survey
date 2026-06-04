import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const THEME_COLOR_VARIABLES = {
  primary: '--theme-color-primary',
  secondary: '--theme-color-secondary',
  accent: '--theme-color-accent',
  background: '--theme-color-background',
  text: '--theme-color-text',
  success: '--theme-color-success',
  warning: '--theme-color-warning',
  danger: '--theme-color-danger',
  page: '--theme-color-page',
  border: '--theme-color-border',
  gridLine: '--theme-color-grid-line',
} as const;

const THEME_RGB_VARIABLES = {
  primary: '--theme-primary-rgb',
  secondary: '--theme-secondary-rgb',
  accent: '--theme-accent-rgb',
  success: '--theme-success-rgb',
  warning: '--theme-warning-rgb',
  danger: '--theme-danger-rgb',
} as const;

type ThemeColorName = keyof typeof THEME_COLOR_VARIABLES;
type ThemeRgbName = keyof typeof THEME_RGB_VARIABLES;

@Injectable({ providedIn: 'root' })
export class ThemeColorService {
  private readonly document = inject(DOCUMENT);

  color(name: ThemeColorName, fallback = ''): string {
    return this.cssVariable(THEME_COLOR_VARIABLES[name], fallback);
  }

  rgba(name: ThemeRgbName, alpha: number, fallback = ''): string {
    const rgb = this.cssVariable(THEME_RGB_VARIABLES[name]);
    const channels = rgb.split(/\s+/).map((channel) => Number(channel));

    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
      return fallback;
    }

    const [red, green, blue] = channels;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  private cssVariable(name: string, fallback = ''): string {
    return (
      this.document.defaultView
        ?.getComputedStyle(this.document.documentElement)
        .getPropertyValue(name)
        .trim() || fallback
    );
  }
}
