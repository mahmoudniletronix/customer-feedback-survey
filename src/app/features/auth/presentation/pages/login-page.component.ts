import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LogIn } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { AuthStore } from '../state/auth.store';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    IconComponent,
    TranslatePipe
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);
  readonly loginIcon = LogIn;
  readonly currentYear = new Date().getFullYear();

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    userNameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  userNameOrEmailError(): string {
    const control = this.form.controls.userNameOrEmail;
    if (!control.touched || control.valid) {
      return '';
    }
    return this.i18n.translate('auth.userNameOrEmailRequired');
  }

  passwordError(): string {
    const control = this.form.controls.password;
    if (!control.touched || control.valid) {
      return '';
    }
    return control.hasError('minlength')
      ? this.i18n.translate('auth.passwordLength')
      : this.i18n.translate('auth.passwordRequired');
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.authStore.login(this.form.getRawValue());
  }
}
