import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly pressed = output<MouseEvent>();

  readonly classes = computed(() => {
    const base =
      'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-extrabold leading-none transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
    const size = this.size() === 'sm' ? 'h-8 px-3 text-[11px]' : 'h-9 px-4 text-[12px]';
    const width = this.fullWidth() ? 'w-full' : '';
    const variant: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--theme-color-primary)] text-white shadow-sm shadow-cyan-900/10 hover:bg-[var(--theme-color-secondary)] focus:ring-[var(--theme-color-accent)]',
      secondary:
        'border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-text)] hover:bg-slate-50 focus:ring-[var(--theme-color-accent)]',
      ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
      danger: 'bg-[var(--theme-color-danger)] text-white shadow-sm hover:brightness-95 focus:ring-[var(--theme-color-danger)]',
    };

    return [base, size, width, variant[this.variant()]].join(' ');
  });
}
