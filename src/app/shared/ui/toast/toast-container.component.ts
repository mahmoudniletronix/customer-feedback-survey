import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LucideIconData,
  TriangleAlert,
  X,
} from 'lucide-angular';
import { IconComponent } from '../icon/icon.component';
import { ToastMessage, ToastVariant } from './toast.model';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toast-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  readonly closeIcon = X;

  iconFor(toast: ToastMessage): LucideIconData {
    const icons: Record<ToastVariant, LucideIconData> = {
      success: CheckCircle2,
      error: AlertCircle,
      warning: TriangleAlert,
      info: Info,
    };

    return icons[toast.variant];
  }

  shellClass(toast: ToastMessage): string {
    const classes: Record<ToastVariant, string> = {
      success: 'border-emerald-200 bg-white/95 shadow-emerald-900/10',
      error: 'border-rose-200 bg-white/95 shadow-rose-900/10',
      warning: 'border-amber-200 bg-white/95 shadow-amber-900/10',
      info: 'border-cyan-200 bg-white/95 shadow-cyan-900/10',
    };

    return classes[toast.variant];
  }

  accentClass(toast: ToastMessage): string {
    const classes: Record<ToastVariant, string> = {
      success: 'bg-emerald-500',
      error: 'bg-rose-500',
      warning: 'bg-amber-500',
      info: 'bg-[#11A7C9]',
    };

    return classes[toast.variant];
  }

  iconClass(toast: ToastMessage): string {
    const classes: Record<ToastVariant, string> = {
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      error: 'bg-rose-50 text-rose-700 ring-rose-100',
      warning: 'bg-amber-50 text-amber-700 ring-amber-100',
      info: 'bg-cyan-50 text-[#0d94b3] ring-cyan-100',
    };

    return classes[toast.variant];
  }
}
