import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, take } from 'rxjs';
import { ArrowLeft, KeyRound, Pencil, Save, Trash2, UserPlus, X } from 'lucide-angular';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../../core/services/i18n.service';
import { Role } from '../../../../../shared/models/role.model';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { BranchAdminsStore } from '../../../branch-admins/presentation/state/branch-admins.store';
import { DepartmentAdminsStore } from '../../../../department-admin/department-admins/presentation/state/department-admins.store';
import { DepartmentsStore } from '../../../departments/presentation/state/departments.store';
import { BranchDetailsBranchAdmin, BranchDetailsDepartment } from '../../domain/branch.model';
import { BranchesStore } from '../state/branches.store';

interface ResetPasswordTarget {
  readonly applicationUserId: string;
  readonly label: string;
  readonly role: Role;
}

@Component({
  selector: 'app-branch-details-page',
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
  templateUrl: './branch-details-page.component.html',
  styleUrl: './branch-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDetailsPageComponent implements OnInit {
  readonly branchesStore = inject(BranchesStore);
  readonly branchAdminsStore = inject(BranchAdminsStore);
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
  readonly editIcon = Pencil;
  readonly resetPasswordIcon = KeyRound;
  readonly saveIcon = Save;
  readonly deleteIcon = Trash2;
  readonly userPlusIcon = UserPlus;
  readonly editMode = signal(false);
  readonly branchAdminDetailsModalOpen = signal(false);
  readonly departmentDetailsModalOpen = signal(false);
  readonly createDepartmentAdminModalOpen = signal(false);
  readonly selectedBranchAdmin = signal<BranchDetailsBranchAdmin | null>(null);
  readonly selectedDepartment = signal<BranchDetailsDepartment | null>(null);
  readonly selectedDepartmentDetails = signal<BranchDetailsDepartment | null>(null);
  readonly resetPasswordModalOpen = signal(false);
  readonly resetPasswordTarget = signal<ResetPasswordTarget | null>(null);
  readonly resettingPassword = signal(false);
  readonly resetPasswordSuccess = signal<string | null>(null);
  readonly resetPasswordError = signal<string | null>(null);

  readonly branchForm = this.formBuilder.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    code: ['', Validators.required],
    address: ['', Validators.required],
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

  readonly branchAdminDetailsForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
  });

  readonly departmentDetailsForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
  });

  private patchedBranchId = '';

  constructor() {
    effect(() => {
      const branch = this.branchesStore.selectedBranchDetails();
      if (!branch || branch.id === this.patchedBranchId) {
        return;
      }

      this.branchForm.setValue({
        nameEn: branch.nameEn,
        nameAr: branch.nameAr,
        code: branch.code,
        address: branch.address,
      });
      this.patchedBranchId = branch.id;
    });
  }

  ngOnInit(): void {
    const branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
    if (branchId.length === 0) {
      this.branchesStore.clearDetails();
      return;
    }

    this.branchesStore.loadDetails(branchId);
  }

  goBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    if (branch) {
      this.branchForm.setValue({
        nameEn: branch.nameEn,
        nameAr: branch.nameAr,
        code: branch.code,
        address: branch.address,
      });
    }
    this.editMode.set(false);
  }

  updateBranch(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    this.branchForm.markAllAsTouched();

    if (!branch || this.branchForm.invalid || this.branchesStore.updating()) {
      return;
    }

    this.branchesStore.updateBranch(branch.id, this.branchForm.getRawValue());
    this.editMode.set(false);
  }

  deleteBranch(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    if (!branch || this.branchesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branches.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchesStore.deleteBranch(branch.id, () => this.goBack());
  }

  openCreateDepartmentAdmin(department: BranchDetailsDepartment): void {
    this.departmentAdminsStore.clearMessages();
    this.selectedDepartment.set(department);
    this.departmentAdminForm.reset();
    this.departmentAdminForm.controls.departmentId.setValue(department.departmentId);
    this.createDepartmentAdminModalOpen.set(true);
  }

  closeCreateDepartmentAdminModal(): void {
    this.departmentAdminForm.reset();
    this.selectedDepartment.set(null);
    this.createDepartmentAdminModalOpen.set(false);
  }

  createDepartmentAdmin(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    this.departmentAdminForm.markAllAsTouched();

    if (!branch || this.departmentAdminForm.invalid || this.departmentAdminsStore.creating()) {
      return;
    }

    this.departmentAdminsStore.createDepartmentAdmin(this.departmentAdminForm.getRawValue(), () => {
      this.closeCreateDepartmentAdminModal();
      this.branchesStore.loadDetails(branch.id);
    });
  }

  openBranchAdminDetails(admin: BranchDetailsBranchAdmin): void {
    this.branchAdminsStore.clearMessages();
    this.selectedBranchAdmin.set(admin);
    this.branchAdminDetailsForm.setValue({
      nameEn: admin.nameEn,
      nameAr: admin.nameAr,
      userName: admin.userName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
    });
    this.branchAdminDetailsModalOpen.set(true);
  }

  closeBranchAdminDetails(): void {
    this.branchAdminDetailsForm.reset();
    this.selectedBranchAdmin.set(null);
    this.branchAdminDetailsModalOpen.set(false);
  }

  updateBranchAdmin(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    const admin = this.selectedBranchAdmin();
    this.branchAdminDetailsForm.markAllAsTouched();

    if (!branch || !admin || this.branchAdminDetailsForm.invalid || this.branchAdminsStore.updating()) {
      return;
    }

    this.branchAdminsStore.updateBranchAdmin(admin.branchAdminId, this.branchAdminDetailsForm.getRawValue(), () => {
      this.closeBranchAdminDetails();
      this.branchesStore.loadDetails(branch.id);
    });
  }

  deleteBranchAdmin(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    const admin = this.selectedBranchAdmin();
    if (!branch || !admin || this.branchAdminsStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchAdmins.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchAdminsStore.deleteBranchAdmin(admin.branchAdminId, () => {
      this.closeBranchAdminDetails();
      this.branchesStore.loadDetails(branch.id);
    });
  }

  openDepartmentDetails(department: BranchDetailsDepartment): void {
    this.departmentsStore.clearMessages();
    this.selectedDepartmentDetails.set(department);
    this.departmentDetailsForm.setValue({
      nameEn: department.nameEn,
      nameAr: department.nameAr,
    });
    this.departmentDetailsModalOpen.set(true);
  }

  closeDepartmentDetails(): void {
    this.departmentDetailsForm.reset();
    this.selectedDepartmentDetails.set(null);
    this.departmentDetailsModalOpen.set(false);
  }

  updateDepartment(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    const department = this.selectedDepartmentDetails();
    this.departmentDetailsForm.markAllAsTouched();

    if (!branch || !department || this.departmentDetailsForm.invalid || this.departmentsStore.updating()) {
      return;
    }

    this.departmentsStore.updateDepartment(department.departmentId, this.departmentDetailsForm.getRawValue(), () => {
      this.closeDepartmentDetails();
      this.branchesStore.loadDetails(branch.id);
    });
  }

  deleteDepartment(): void {
    const branch = this.branchesStore.selectedBranchDetails();
    const department = this.selectedDepartmentDetails();
    if (!branch || !department || this.departmentsStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departments.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.departmentsStore.deleteDepartment(department.departmentId, () => {
      this.closeDepartmentDetails();
      this.branchesStore.loadDetails(branch.id);
    });
  }

  fieldError(field: keyof typeof this.branchForm.controls): string {
    const control = this.branchForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    return 'branches.fieldRequired';
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

  branchAdminDetailsFieldError(field: keyof typeof this.branchAdminDetailsForm.controls): string {
    const control = this.branchAdminDetailsForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'email' ? 'departmentAdmins.emailRequired' : 'branches.fieldRequired';
    }

    if (control.hasError('email')) {
      return 'departmentAdmins.emailInvalid';
    }

    if (control.hasError('maxlength')) {
      return field === 'phoneNumber'
        ? 'departmentAdmins.phoneNumberMaxLength'
        : 'branchAdmins.fieldMaxLength';
    }

    return 'branches.fieldRequired';
  }

  departmentDetailsFieldError(field: keyof typeof this.departmentDetailsForm.controls): string {
    const control = this.departmentDetailsForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return 'departments.fieldMaxLength';
    }

    return 'branches.fieldRequired';
  }

  canResetPassword(role: Role, applicationUserId: string): boolean {
    return this.authStore.canResetUserPassword(role, applicationUserId);
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

  localizedDisplayName(entity: { nameEn: string | null; nameAr?: string | null }): string {
    return this.localizedText(entity.nameEn, entity.nameAr);
  }

  codedDisplayName(entity: {
    nameEn: string | null;
    nameAr?: string | null;
    code?: string | null;
  }): string {
    const name = this.localizedDisplayName(entity);
    return entity.code ? `${name} - ${entity.code}` : name;
  }

  questionDisplayText(question: { textEn: string | null; textAr?: string | null }): string {
    return this.localizedText(question.textEn, question.textAr);
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
