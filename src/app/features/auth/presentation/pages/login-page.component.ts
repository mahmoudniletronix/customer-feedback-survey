import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArrowLeft, Building2, LogIn } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { BRAND_ASSETS } from '../../../../core/theme/brand-assets';
import { LoginBranchSelection } from '../../domain/auth.model';
import { AuthStore } from '../state/auth.store';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AppFooterComponent } from '../../../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    IconComponent,
    TranslatePipe,
    AppFooterComponent,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);
  readonly brandAssets = BRAND_ASSETS;
  readonly backIcon = ArrowLeft;
  readonly branchIcon = Building2;
  readonly loginIcon = LogIn;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({
    userNameOrEmail: ['', [Validators.required, Validators.maxLength(200)]],
    password: ['', [Validators.required, Validators.maxLength(200)]],
  });

  userNameOrEmailError(): string {
    const control = this.form.controls.userNameOrEmail;
    if (!control.touched || control.valid) {
      return '';
    }
    return control.hasError('maxlength')
      ? this.i18n.translate('auth.userNameOrEmailMaxLength')
      : this.i18n.translate('auth.userNameOrEmailRequired');
  }

  passwordError(): string {
    const control = this.form.controls.password;
    if (!control.touched || control.valid) {
      return '';
    }
    return control.hasError('maxlength')
      ? this.i18n.translate('auth.passwordMaxLength')
      : this.i18n.translate('auth.passwordRequired');
  }

  branchName(branch: LoginBranchSelection): string {
    if (this.i18n.language() === 'ar') {
      return branch.nameAr || branch.nameEn || branch.code || branch.id;
    }

    return branch.nameEn || branch.nameAr || branch.code || branch.id;
  }

  selectBranch(branchId: string): void {
    this.authStore.selectBranch(branchId);
  }

  backToLogin(): void {
    this.authStore.cancelBranchSelection();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.authStore.login(this.form.getRawValue());
  }
}
