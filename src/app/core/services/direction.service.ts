import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type Direction = 'ltr' | 'rtl';

@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly document = inject(DOCUMENT);
  private readonly directionSignal = signal<Direction>('ltr');

  readonly direction = this.directionSignal.asReadonly();
  readonly isRtl = computed(() => this.directionSignal() === 'rtl');

  constructor() {
    effect(() => {
      this.document.documentElement.dir = this.directionSignal();
      this.document.documentElement.lang = this.isRtl() ? 'ar' : 'en';
    });
  }

  toggle(): void {
    this.directionSignal.update((direction) => (direction === 'ltr' ? 'rtl' : 'ltr'));
  }
}
