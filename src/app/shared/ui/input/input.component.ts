import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Eye, EyeOff } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent implements ControlValueAccessor {
  private readonly i18n = inject(I18nService);

  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly size = input<'sm' | 'md'>('md');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly showPasswordToggle = input(true);

  readonly invalid = computed(() => this.error().length > 0);
  readonly isPassword = computed(() => this.type() === 'password');
  readonly canTogglePassword = computed(() => this.isPassword() && this.showPasswordToggle());
  readonly inputType = computed(() => (this.canTogglePassword() && this.passwordVisible() ? 'text' : this.type()));
  readonly inputClasses = computed(() => {
    const size =
      this.size() === 'sm'
        ? 'h-8 rounded-md px-2.5 py-1.5 text-[11px]'
        : 'h-10 rounded-lg px-3 py-2 text-sm';

    return [
      'w-full border text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#11A7C9] focus:ring-2 focus:ring-[#11A7C9]/10 disabled:bg-slate-100',
      size,
      this.canTogglePassword() ? 'pe-12' : '',
    ].join(' ');
  });
  readonly labelClasses = computed(() =>
    this.size() === 'sm'
      ? 'mb-1 block text-[10px] font-semibold text-slate-700'
      : 'mb-1.5 block text-xs font-semibold text-slate-700',
  );
  readonly feedbackClasses = computed(() =>
    this.size() === 'sm'
      ? 'mt-1.5 block text-[10px]'
      : 'mt-2 block text-xs',
  );
  readonly passwordToggleIcon = computed(() => (this.passwordVisible() ? EyeOff : Eye));
  readonly passwordToggleLabel = computed(() =>
    this.i18n.translate(this.passwordVisible() ? 'common.hidePassword' : 'common.showPassword')
  );

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly passwordVisible = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
  }

  registerOnChange(fn: unknown): void {
    if (typeof fn === 'function') {
      this.onChange = fn as (value: string) => void;
    }
  }

  registerOnTouched(fn: unknown): void {
    if (typeof fn === 'function') {
      this.onTouched = fn as () => void;
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  togglePasswordVisibility(): void {
    if (!this.canTogglePassword() || this.disabled()) {
      return;
    }

    this.passwordVisible.update((visible) => !visible);
  }

  handleInput(event: Event): void {
    const nextValue = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.value.set(nextValue);
    this.onChange(nextValue);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
