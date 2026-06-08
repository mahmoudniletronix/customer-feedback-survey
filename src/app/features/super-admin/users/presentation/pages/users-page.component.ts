import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CirclePlus, UsersRound } from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { ManagedUser } from '../../domain/user-management.model';
import { UserTableComponent } from '../components/user-table.component';
import { UsersStore } from '../state/users.store';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    ResetPasswordModalComponent,
    TranslatePipe,
    UserTableComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent implements OnInit {
  readonly usersStore = inject(UsersStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  readonly usersIcon = UsersRound;
  readonly createIcon = CirclePlus;
  readonly createSuperAdminModalOpen = signal(false);
  readonly resetPasswordModalOpen = signal(false);
  readonly selectedUser = signal<ManagedUser | null>(null);
  readonly canCreateSuperAdmin = computed(() => this.authStore.canCreateSuperAdmins());
  readonly selectedUserLabel = computed(() => {
    const user = this.selectedUser();
    return user ? `${user.name} - ${user.id}` : '';
  });
  readonly createSuperAdminForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.usersStore.load();
  }

  openResetPassword(user: ManagedUser): void {
    this.usersStore.clearMessages();
    this.selectedUser.set(user);
    this.resetPasswordModalOpen.set(true);
  }

  closeResetPassword(): void {
    this.selectedUser.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(payload: ResetPasswordModalValue): void {
    const user = this.selectedUser();
    if (!user || this.usersStore.resettingPassword()) {
      return;
    }

    this.usersStore.resetPassword(user.id, payload, () => this.closeResetPassword());
  }

  openCreateSuperAdmin(): void {
    if (!this.canCreateSuperAdmin()) {
      return;
    }

    this.usersStore.clearMessages();
    this.createSuperAdminForm.reset();
    this.createSuperAdminModalOpen.set(true);
  }

  closeCreateSuperAdmin(): void {
    this.createSuperAdminForm.reset();
    this.createSuperAdminModalOpen.set(false);
  }

  createSuperAdmin(): void {
    this.createSuperAdminForm.markAllAsTouched();
    if (
      this.createSuperAdminForm.invalid ||
      this.usersStore.creatingSuperAdmin() ||
      !this.canCreateSuperAdmin()
    ) {
      return;
    }

    const value = this.createSuperAdminForm.getRawValue();
    this.usersStore.createSuperAdmin(
      {
        nameEn: value.nameEn.trim(),
        nameAr: value.nameAr.trim(),
        userName: value.userName.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim(),
        password: value.password,
      },
      () => this.closeCreateSuperAdmin(),
    );
  }

  createSuperAdminFieldError(field: keyof typeof this.createSuperAdminForm.controls): string {
    const control = this.createSuperAdminForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.createSuperAdminRequiredError(field);
    }
    if (control.hasError('email')) {
      return 'users.emailInvalid';
    }
    if (control.hasError('minlength')) {
      return 'users.passwordMinLength';
    }
    if (control.hasError('maxlength')) {
      return this.createSuperAdminMaxLengthError(field);
    }

    return 'users.validationError';
  }

  private createSuperAdminRequiredError(field: keyof typeof this.createSuperAdminForm.controls): string {
    const errorKeys: Record<keyof typeof this.createSuperAdminForm.controls, string> = {
      nameEn: 'users.nameEnRequired',
      nameAr: 'users.validationError',
      userName: 'users.userNameRequired',
      email: 'users.emailRequired',
      phoneNumber: 'users.validationError',
      password: 'users.passwordRequired',
    };

    return errorKeys[field];
  }

  private createSuperAdminMaxLengthError(field: keyof typeof this.createSuperAdminForm.controls): string {
    const errorKeys: Record<keyof typeof this.createSuperAdminForm.controls, string> = {
      nameEn: 'users.nameEnMaxLength',
      nameAr: 'users.nameArMaxLength',
      userName: 'users.userNameMaxLength',
      email: 'users.emailMaxLength',
      phoneNumber: 'users.phoneNumberMaxLength',
      password: 'users.passwordMaxLength',
    };

    return errorKeys[field];
  }
}
