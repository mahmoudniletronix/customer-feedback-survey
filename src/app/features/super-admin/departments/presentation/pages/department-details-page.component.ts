import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, take } from 'rxjs';
import { ArrowLeft, KeyRound, Pencil, RotateCcw, Save, Trash2, UserPlus, UsersRound, UserX, X } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { Role } from '../../../../../shared/models/role.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { DepartmentAdminsStore } from '../../../../department-admin/department-admins/presentation/state/department-admins.store';
import { DepartmentDetailsUser } from '../../domain/department.model';
import { DepartmentsStore } from '../state/departments.store';

interface ResetPasswordTarget {
  readonly applicationUserId: string;
  readonly label: string;
  readonly role: Role;
}

@Component({
  selector: 'app-department-details-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ResetPasswordModalComponent,
    TranslatePipe,
  ],
  templateUrl: './department-details-page.component.html',
  styleUrl: './department-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDetailsPageComponent implements OnInit {
  readonly departmentsStore = inject(DepartmentsStore);
  readonly departmentAdminsStore = inject(DepartmentAdminsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly userPasswordResetService = inject(UserPasswordResetService);

  readonly arrowLeftIcon = ArrowLeft;
  readonly cancelIcon = X;
  readonly deactivateIcon = UserX;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly resetPasswordIcon = KeyRound;
  readonly restoreIcon = RotateCcw;
  readonly saveIcon = Save;
  readonly userPlusIcon = UserPlus;
  readonly usersIcon = UsersRound;
  readonly editMode = signal(false);
  readonly createDepartmentAdminModalOpen = signal(false);
  readonly resetPasswordModalOpen = signal(false);
  readonly resetPasswordTarget = signal<ResetPasswordTarget | null>(null);
  readonly resettingPassword = signal(false);
  readonly resetPasswordSuccess = signal<string | null>(null);
  readonly resetPasswordError = signal<string | null>(null);

  readonly departmentForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
  });

  readonly departmentAdminForm = this.formBuilder.nonNullable.group({
    departmentId: ['', Validators.required],
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  private patchedDepartmentId = '';

  constructor() {
    effect(() => {
      const department = this.departmentsStore.selectedDetails();
      if (!department || department.id === this.patchedDepartmentId) {
        return;
      }

      this.departmentForm.setValue({
        nameEn: department.nameEn,
        nameAr: department.nameAr,
      });
      this.patchedDepartmentId = department.id;
    });
  }

  ngOnInit(): void {
    const departmentId = this.route.snapshot.paramMap.get('departmentId') ?? '';
    if (departmentId.length === 0) {
      this.departmentsStore.clearDetails();
      return;
    }

    this.departmentsStore.loadDetails(departmentId);
  }

  goBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const department = this.departmentsStore.selectedDetails();
    if (department) {
      this.departmentForm.setValue({
        nameEn: department.nameEn,
        nameAr: department.nameAr,
      });
    }
    this.editMode.set(false);
  }

  updateDepartment(): void {
    const department = this.departmentsStore.selectedDetails();
    this.departmentForm.markAllAsTouched();

    if (!department || this.departmentForm.invalid || this.departmentsStore.updating()) {
      return;
    }

    this.departmentsStore.updateDepartment(department.id, this.departmentForm.getRawValue(), () => {
      this.editMode.set(false);
      this.departmentsStore.loadDetails(department.id, false);
    });
  }

  deleteDepartment(): void {
    const department = this.departmentsStore.selectedDetails();
    if (!department || !department.isActive || this.departmentsStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departments.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.departmentsStore.deleteDepartment(department.id, () => {
      this.departmentsStore.loadDetails(department.id, false);
    });
  }

  restoreDepartment(): void {
    const department = this.departmentsStore.selectedDetails();
    if (
      !department ||
      department.isActive ||
      !this.authStore.canRestoreDepartments() ||
      this.departmentsStore.restoring()
    ) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departments.restoreConfirm'));
    if (!confirmed) {
      return;
    }

    this.departmentsStore.restoreDepartment(department.id, () => {
      this.departmentsStore.loadDetails(department.id, false);
    });
  }

  openCreateDepartmentAdmin(): void {
    const department = this.departmentsStore.selectedDetails();
    if (!department || !department.isActive) {
      return;
    }

    this.departmentAdminsStore.clearMessages();
    this.departmentAdminForm.reset();
    this.departmentAdminForm.controls.departmentId.setValue(department.id);
    this.createDepartmentAdminModalOpen.set(true);
  }

  closeCreateDepartmentAdminModal(): void {
    this.departmentAdminForm.reset();
    this.createDepartmentAdminModalOpen.set(false);
  }

  createDepartmentAdmin(): void {
    const department = this.departmentsStore.selectedDetails();
    this.departmentAdminForm.markAllAsTouched();

    if (!department || this.departmentAdminForm.invalid || this.departmentAdminsStore.creating()) {
      return;
    }

    this.departmentAdminsStore.createDepartmentAdmin(this.departmentAdminForm.getRawValue(), () => {
      this.closeCreateDepartmentAdminModal();
      this.departmentsStore.loadDetails(department.id, false);
    });
  }

  canResetPassword(role: Role, applicationUserId: string): boolean {
    return this.authStore.canResetUserPassword(role, applicationUserId);
  }

  canRestoreDepartment(department: { isActive: boolean }): boolean {
    return !department.isActive && this.authStore.canRestoreDepartments();
  }

  canDeactivateDepartmentAdmin(admin: DepartmentDetailsUser): boolean {
    return Boolean(admin.departmentAdminId) && admin.isActive && this.authStore.canDeactivateDepartmentAdmins();
  }

  canRestoreDepartmentAdmin(admin: DepartmentDetailsUser): boolean {
    return Boolean(admin.departmentAdminId) && !admin.isActive && this.authStore.canRestoreDepartmentAdmins();
  }

  deactivateDepartmentAdmin(admin: DepartmentDetailsUser, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!admin.departmentAdminId || !this.canDeactivateDepartmentAdmin(admin) || this.departmentAdminsStore.deactivating()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departmentAdmins.deactivateConfirm'));
    if (!confirmed) {
      return;
    }

    const department = this.departmentsStore.selectedDetails();
    this.departmentAdminsStore.deactivateDepartmentAdmin(admin.departmentAdminId, () => {
      if (department) {
        this.departmentsStore.loadDetails(department.id, false);
      }
    });
  }

  restoreDepartmentAdmin(admin: DepartmentDetailsUser, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!admin.departmentAdminId || !this.canRestoreDepartmentAdmin(admin) || this.departmentAdminsStore.restoring()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departmentAdmins.restoreConfirm'));
    if (!confirmed) {
      return;
    }

    const department = this.departmentsStore.selectedDetails();
    this.departmentAdminsStore.restoreDepartmentAdmin(admin.departmentAdminId, () => {
      if (department) {
        this.departmentsStore.loadDetails(department.id, false);
      }
    });
  }

  openResetPassword(
    role: Role,
    applicationUserId: string,
    label: string,
    event?: MouseEvent,
  ): void {
    event?.stopPropagation();
    if (!this.canResetPassword(role, applicationUserId)) {
      return;
    }

    this.resetPasswordSuccess.set(null);
    this.resetPasswordError.set(null);
    this.resetPasswordTarget.set({ applicationUserId, label, role });
    this.resetPasswordModalOpen.set(true);
  }

  closeResetPassword(): void {
    this.resetPasswordTarget.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(payload: ResetPasswordModalValue): void {
    const target = this.resetPasswordTarget();
    if (!target || this.resettingPassword()) {
      return;
    }

    this.resettingPassword.set(true);
    this.resetPasswordSuccess.set(null);
    this.resetPasswordError.set(null);

    this.userPasswordResetService
      .resetPassword(target.applicationUserId, payload)
      .pipe(
        take(1),
        finalize(() => this.resettingPassword.set(false)),
      )
      .subscribe({
        next: () => {
          this.resetPasswordSuccess.set('users.resetPasswordSuccess');
          this.closeResetPassword();
        },
        error: () => this.resetPasswordError.set('users.resetPasswordError'),
      });
  }

  departmentDisplayName(department: { nameEn: string | null; nameAr?: string | null }): string {
    return this.localizedText(department.nameEn, department.nameAr);
  }

  personDisplayName(person: { nameEn: string | null; nameAr?: string | null }): string {
    return this.localizedText(person.nameEn, person.nameAr);
  }

  fieldError(field: keyof typeof this.departmentForm.controls): string {
    const control = this.departmentForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return 'departments.fieldMaxLength';
    }

    return 'departments.nameEnRequired';
  }

  departmentAdminFieldError(field: keyof typeof this.departmentAdminForm.controls): string {
    const control = this.departmentAdminForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.departmentAdminRequiredError(field);
    }

    if (control.hasError('email')) {
      return 'departmentAdmins.emailInvalid';
    }

    if (control.hasError('minlength')) {
      return 'departmentAdmins.passwordMinLength';
    }

    if (control.hasError('maxlength')) {
      return this.departmentAdminMaxLengthError(field);
    }

    return 'branches.fieldRequired';
  }

  private departmentAdminRequiredError(field: keyof typeof this.departmentAdminForm.controls): string {
    const errorKeys: Record<keyof typeof this.departmentAdminForm.controls, string> = {
      departmentId: 'departmentAdmins.departmentIdRequired',
      nameEn: 'departmentAdmins.nameEnRequired',
      nameAr: 'branches.fieldRequired',
      userName: 'departmentAdmins.userNameRequired',
      email: 'departmentAdmins.emailRequired',
      phoneNumber: 'branches.fieldRequired',
      password: 'departmentAdmins.passwordRequired',
    };

    return errorKeys[field];
  }

  private localizedText(
    enValue: string | null | undefined,
    arValue: string | null | undefined,
    fallback = '-',
  ): string {
    const englishText = enValue?.trim() ?? '';
    const arabicText = arValue?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || fallback;
    }

    return englishText || arabicText || fallback;
  }

  private departmentAdminMaxLengthError(field: keyof typeof this.departmentAdminForm.controls): string {
    const errorKeys: Record<keyof typeof this.departmentAdminForm.controls, string> = {
      departmentId: 'branches.fieldRequired',
      nameEn: 'departmentAdmins.nameEnMaxLength',
      nameAr: 'departmentAdmins.nameArMaxLength',
      userName: 'departmentAdmins.userNameMaxLength',
      email: 'departmentAdmins.emailMaxLength',
      phoneNumber: 'departmentAdmins.phoneNumberMaxLength',
      password: 'departmentAdmins.passwordMaxLength',
    };

    return errorKeys[field];
  }
}
