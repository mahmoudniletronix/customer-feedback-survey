import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { BRAND_ASSETS } from '../../../../core/theme/brand-assets';
import { AppFooterComponent } from '../../../../shared/ui/app-footer/app-footer.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthStore } from '../state/auth.store';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    IconComponent,
    TranslatePipe,
    AppFooterComponent,
  ],
  templateUrl: './change-password-page.component.html',
  styleUrl: './change-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPageComponent {
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);
  readonly brandAssets = BRAND_ASSETS;
  readonly submitIcon = ShieldCheck;
  readonly passwordIcon = KeyRound;
  readonly logoutIcon = LogOut;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
      confirmNewPassword: ['', [Validators.required, Validators.maxLength(200)]],
    },
    { validators: this.matchingPasswordsValidator },
  );

  newPasswordError(): string {
    const control = this.form.controls.newPassword;
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.i18n.translate('auth.changePasswordNewPasswordRequired');
    }
    if (control.hasError('minlength')) {
      return this.i18n.translate('auth.changePasswordNewPasswordMinLength');
    }

    return this.i18n.translate('auth.changePasswordNewPasswordMaxLength');
  }

  confirmNewPasswordError(): string {
    const control = this.form.controls.confirmNewPassword;
    if (!control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return this.i18n.translate('auth.changePasswordConfirmPasswordRequired');
    }
    if (this.form.hasError('passwordMismatch')) {
      return this.i18n.translate('auth.changePasswordConfirmPasswordNotMatched');
    }

    return '';
  }

  reasonMessageKey(): string {
    const reason = this.authStore.passwordChangeReason();
    if (reason === 'expired') {
      return 'auth.changePasswordExpiredMessage';
    }
    if (reason === 'first-login') {
      return 'auth.changePasswordFirstLoginMessage';
    }

    return 'auth.changePasswordSelfServiceMessage';
  }

  logout(): void {
    this.authStore.logout();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.authStore.loading()) {
      return;
    }

    this.authStore.changePassword(this.form.getRawValue());
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
