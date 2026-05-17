import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastPayload } from './toast.model';

const DEFAULT_TOAST_DURATION_MS = 6000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<readonly ToastMessage[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.toastsSignal.asReadonly();

  show(payload: ToastPayload): void {
    const id = this.nextId++;
    const toast: ToastMessage = {
      id,
      variant: payload.variant,
      title: payload.title,
      description: payload.description ?? '',
      createdAt: Date.now(),
    };

    this.toastsSignal.update((toasts) => [toast, ...toasts].slice(0, 5));

    const durationMs = payload.durationMs ?? DEFAULT_TOAST_DURATION_MS;
    if (durationMs > 0) {
      const timer = setTimeout(() => this.dismiss(id), durationMs);
      this.timers.set(id, timer);
    }
  }

  success(title: string, description = ''): void {
    this.show({ variant: 'success', title, description });
  }

  error(title: string, description = ''): void {
    this.show({ variant: 'error', title, description, durationMs: 8000 });
  }

  warning(title: string, description = ''): void {
    this.show({ variant: 'warning', title, description });
  }

  info(title: string, description = ''): void {
    this.show({ variant: 'info', title, description });
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
