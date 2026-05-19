import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChevronLeft, ChevronRight, KeyRound, Pencil, RotateCcw, Search, Trash2, UserPlus, UsersRound } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { BranchUser } from '../../domain/branch-user.model';
import { BranchUsersStore } from '../state/branch-users.store';

@Component({
  selector: 'app-branch-users-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-users-page.component.html',
  styleUrl: './branch-users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchUsersPageComponent implements OnInit {
  readonly branchUsersStore = inject(BranchUsersStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly editIcon = Pencil;
  readonly resetPasswordIcon = KeyRound;
  readonly deleteIcon = Trash2;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly userPlusIcon = UserPlus;
  readonly usersIcon = UsersRound;

  readonly createUserModalOpen = signal(false);
  readonly editUserModalOpen = signal(false);
  readonly resetPasswordModalOpen = signal(false);
  readonly assignRolesModalOpen = signal(false);
  readonly selectedBranchUser = signal<BranchUser | null>(null);
  readonly createRoleIds = signal<readonly string[]>([]);
  readonly assignRoleIds = signal<readonly string[]>([]);

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
  });

  readonly branchUserForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  readonly editBranchUserForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
  });

  readonly resetPasswordForm = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.branchUsersStore.loadRoles();
    this.branchUsersStore.load();
  }

  searchBranchUsers(): void {
    const formValue = this.searchForm.getRawValue();
    this.branchUsersStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
    );
  }

  clearBranchUserSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      isActive: '',
    });
    this.branchUsersStore.search('', null);
  }

  goToPreviousBranchUsersPage(): void {
    this.branchUsersStore.previousPage();
  }

  goToNextBranchUsersPage(): void {
    this.branchUsersStore.nextPage();
  }

  openCreateBranchUser(): void {
    this.branchUsersStore.clearMessages();
    this.branchUserForm.reset();
    this.createRoleIds.set([]);
    this.createUserModalOpen.set(true);
  }

  closeCreateBranchUser(): void {
    this.branchUserForm.reset();
    this.createRoleIds.set([]);
    this.createUserModalOpen.set(false);
  }

  createBranchUser(): void {
    this.branchUserForm.markAllAsTouched();
    if (
      this.branchUserForm.invalid ||
      this.createRoleIds().length === 0 ||
      this.branchUsersStore.creating()
    ) {
      return;
    }

    this.branchUsersStore.createBranchUser(
      {
        ...this.branchUserForm.getRawValue(),
        roleIds: this.createRoleIds(),
      },
      () => this.closeCreateBranchUser(),
    );
  }

  openEditBranchUser(user: BranchUser): void {
    this.branchUsersStore.clearMessages();
    this.selectedBranchUser.set(user);
    this.editBranchUserForm.setValue({
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
    this.editUserModalOpen.set(true);
  }

  closeEditBranchUser(): void {
    this.editBranchUserForm.reset();
    this.selectedBranchUser.set(null);
    this.editUserModalOpen.set(false);
  }

  updateBranchUser(): void {
    const user = this.selectedBranchUser();
    this.editBranchUserForm.markAllAsTouched();
    if (!user || this.editBranchUserForm.invalid || this.branchUsersStore.updating()) {
      return;
    }

    this.branchUsersStore.updateBranchUser(user.applicationUserId, this.editBranchUserForm.getRawValue(), () =>
      this.closeEditBranchUser(),
    );
  }

  deleteBranchUser(user: BranchUser): void {
    if (!user.isActive || this.branchUsersStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchUsers.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchUsersStore.deleteBranchUser(user.applicationUserId, () => undefined);
  }

  restoreBranchUser(user: BranchUser): void {
    if (user.isActive || this.branchUsersStore.restoring()) {
      return;
    }

    this.branchUsersStore.restoreBranchUser(user.applicationUserId, () => undefined);
  }

  openResetPassword(user: BranchUser): void {
    this.branchUsersStore.clearMessages();
    this.selectedBranchUser.set(user);
    this.resetPasswordForm.reset();
    this.resetPasswordModalOpen.set(true);
  }

  closeResetPassword(): void {
    this.resetPasswordForm.reset();
    this.selectedBranchUser.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(): void {
    const user = this.selectedBranchUser();
    this.resetPasswordForm.markAllAsTouched();
    if (!user || this.resetPasswordForm.invalid || this.branchUsersStore.resettingPassword()) {
      return;
    }

    this.branchUsersStore.resetPassword(user.applicationUserId, this.resetPasswordForm.getRawValue(), () =>
      this.closeResetPassword(),
    );
  }

  openAssignRoles(user: BranchUser): void {
    this.branchUsersStore.clearMessages();
    this.selectedBranchUser.set(user);
    this.assignRoleIds.set(user.roles.map((role) => role.roleId));
    this.assignRolesModalOpen.set(true);
  }

  closeAssignRoles(): void {
    this.selectedBranchUser.set(null);
    this.assignRoleIds.set([]);
    this.assignRolesModalOpen.set(false);
  }

  assignRoles(): void {
    const user = this.selectedBranchUser();
    if (!user || this.assignRoleIds().length === 0 || this.branchUsersStore.assigningRoles()) {
      return;
    }

    this.branchUsersStore.assignRoles(
      user.applicationUserId,
      { roleIds: this.assignRoleIds() },
      () => this.closeAssignRoles(),
    );
  }

  isCreateRoleSelected(roleId: string): boolean {
    return this.createRoleIds().includes(roleId);
  }

  isAssignRoleSelected(roleId: string): boolean {
    return this.assignRoleIds().includes(roleId);
  }

  toggleCreateRole(roleId: string): void {
    this.createRoleIds.update((roleIds) => this.toggleRoleId(roleIds, roleId));
  }

  toggleAssignRole(roleId: string): void {
    this.assignRoleIds.update((roleIds) => this.toggleRoleId(roleIds, roleId));
  }

  branchUserFieldError(field: keyof typeof this.branchUserForm.controls): string {
    const control = this.branchUserForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }

    if (control.hasError('email')) {
      return 'departmentAdmins.emailInvalid';
    }

    if (control.hasError('minlength')) {
      return 'departmentAdmins.passwordMinLength';
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    return 'branches.fieldRequired';
  }

  editBranchUserFieldError(field: keyof typeof this.editBranchUserForm.controls): string {
    const control = this.editBranchUserForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      const errorKeys: Record<keyof typeof this.editBranchUserForm.controls, string> = {
        nameEn: 'branchUsers.nameEnRequired',
        nameAr: 'branches.fieldRequired',
        email: 'departmentAdmins.emailRequired',
        phoneNumber: 'branches.fieldRequired',
      };

      return errorKeys[field];
    }

    if (control.hasError('email')) {
      return 'departmentAdmins.emailInvalid';
    }

    if (control.hasError('maxlength')) {
      const errorKeys: Record<keyof typeof this.editBranchUserForm.controls, string> = {
        nameEn: 'branchUsers.nameEnMaxLength',
        nameAr: 'branchUsers.nameArMaxLength',
        email: 'departmentAdmins.emailMaxLength',
        phoneNumber: 'departmentAdmins.phoneNumberMaxLength',
      };

      return errorKeys[field];
    }

    return 'branches.fieldRequired';
  }

  resetPasswordFieldError(): string {
    const control = this.resetPasswordForm.controls.newPassword;
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'departmentAdmins.passwordRequired';
    }

    if (control.hasError('minlength')) {
      return 'departmentAdmins.passwordMinLength';
    }

    if (control.hasError('maxlength')) {
      return 'departmentAdmins.passwordMaxLength';
    }

    return 'branches.fieldRequired';
  }

  createRolesError(): string {
    return this.branchUserForm.touched && this.createRoleIds().length === 0
      ? 'branchUsers.roleIdsRequired'
      : '';
  }

  assignRolesError(): string {
    return this.assignRoleIds().length === 0 ? 'branchUsers.roleIdsRequired' : '';
  }

  createdByName(user: BranchUser): string {
    if (!user.createdBy) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return user.createdBy.nameAr || user.createdBy.nameEn || '-';
    }

    return user.createdBy.nameEn || user.createdBy.nameAr || '-';
  }

  private toggleRoleId(roleIds: readonly string[], roleId: string): readonly string[] {
    return roleIds.includes(roleId)
      ? roleIds.filter((currentRoleId) => currentRoleId !== roleId)
      : [...roleIds, roleId];
  }

  private requiredErrorKey(field: keyof typeof this.branchUserForm.controls): string {
    const errorKeys: Record<keyof typeof this.branchUserForm.controls, string> = {
      nameEn: 'branchUsers.nameEnRequired',
      nameAr: 'branches.fieldRequired',
      userName: 'departmentAdmins.userNameRequired',
      email: 'departmentAdmins.emailRequired',
      phoneNumber: 'branches.fieldRequired',
      password: 'departmentAdmins.passwordRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: keyof typeof this.branchUserForm.controls): string {
    const errorKeys: Record<keyof typeof this.branchUserForm.controls, string> = {
      nameEn: 'branchUsers.nameEnMaxLength',
      nameAr: 'branchUsers.nameArMaxLength',
      userName: 'departmentAdmins.userNameMaxLength',
      email: 'departmentAdmins.emailMaxLength',
      phoneNumber: 'departmentAdmins.phoneNumberMaxLength',
      password: 'departmentAdmins.passwordMaxLength',
    };

    return errorKeys[field];
  }

  private toIsActiveFilter(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  }
}
