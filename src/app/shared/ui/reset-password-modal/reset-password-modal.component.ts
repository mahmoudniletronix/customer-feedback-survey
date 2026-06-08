import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { KeyRound } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputComponent } from '../input/input.component';
import { ModalComponent } from '../modal/modal.component';

export interface ResetPasswordModalValue {
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './reset-password-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordModalComponent {
  readonly open = input(false);
  readonly loading = input(false);
  readonly selectedUserLabel = input('');
  readonly closed = output<void>();
  readonly confirmed = output<ResetPasswordModalValue>();
  readonly resetPasswordIcon = KeyRound;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
      confirmNewPassword: ['', [Validators.required, Validators.maxLength(200)]],
    },
    { validators: this.matchingPasswordsValidator },
  );

  private readonly resetWhenClosed = effect(() => {
    if (!this.open()) {
      this.form.reset();
    }
  });

  newPasswordErrorKey(): string {
    const control = this.form.controls.newPassword;
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'auth.changePasswordNewPasswordRequired';
    }
    if (control.hasError('minlength')) {
      return 'auth.changePasswordNewPasswordMinLength';
    }

    return 'auth.changePasswordNewPasswordMaxLength';
  }

  confirmNewPasswordErrorKey(): string {
    const control = this.form.controls.confirmNewPassword;
    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'auth.changePasswordConfirmPasswordRequired';
    }
    if (this.form.hasError('passwordMismatch')) {
      return 'auth.changePasswordConfirmPasswordNotMatched';
    }

    return '';
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.confirmed.emit(this.form.getRawValue());
  }

  private matchingPasswordsValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmNewPassword = control.get('confirmNewPassword')?.value;
    if (
      typeof newPassword !== 'string' ||
      typeof confirmNewPassword !== 'string' ||
      confirmNewPassword.length === 0
    ) {
      return null;
    }

    return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
  }
}
