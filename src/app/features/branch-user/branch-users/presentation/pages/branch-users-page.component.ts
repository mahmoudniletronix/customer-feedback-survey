import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChevronLeft, ChevronRight, KeyRound, Pencil, RotateCcw, Search, SlidersHorizontal, Trash2, UserPlus, UsersRound } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { BackButtonComponent } from '../../../../../shared/ui/back-button/back-button.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import {
  BranchUser,
  BranchUsersOrderSort,
  CreateBranchUserPayload,
  UpdateBranchUserPayload,
} from '../../domain/branch-user.model';
import { BranchUsersStore } from '../state/branch-users.store';

@Component({
  selector: 'app-branch-users-page',
  standalone: true,
  imports: [
    ButtonComponent,
    BackButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    ResetPasswordModalComponent,
    TranslatePipe,
  ],
  templateUrl: './branch-users-page.component.html',
  styleUrl: './branch-users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchUsersPageComponent implements OnInit {
  readonly branchUsersStore = inject(BranchUsersStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly editIcon = Pencil;
  readonly resetPasswordIcon = KeyRound;
  readonly deleteIcon = Trash2;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;

  readonly advancedFiltersOpen = signal(true);

  readonly userPlusIcon = UserPlus;
  readonly usersIcon = UsersRound;

  readonly createUserModalOpen = signal(false);
  readonly editUserModalOpen = signal(false);
  readonly resetPasswordModalOpen = signal(false);
  readonly assignRolesModalOpen = signal(false);
  readonly selectedBranchUser = signal<BranchUser | null>(null);
  readonly createRoleIds = signal<readonly string[]>([]);
  readonly assignRoleIds = signal<readonly string[]>([]);
  readonly canCreate = computed(() => this.authStore.canManageBranchUsers('Create'));
  readonly canUpdate = computed(() => this.authStore.canManageBranchUsers('Update'));
  readonly canDelete = computed(() => this.authStore.canManageBranchUsers('Delete'));
  readonly canRestore = computed(() => this.authStore.canManageBranchUsers('Restore'));
  readonly canResetBranchUserPassword = computed(() =>
    this.authStore.canResetBranchUserPassword(),
  );
  readonly canAssignRoles = computed(() => this.authStore.canManageBranchUsers('AssignRoles'));
  readonly canUseActiveActions = computed(
    () =>
      this.canAssignRoles() ||
      this.canUpdate() ||
      this.canResetBranchUserPassword() ||
      this.canDelete(),
  );
  readonly selectedResetPasswordUserLabel = computed(() => {
    const user = this.selectedBranchUser();
    return user ? `${user.nameEn} - ${user.userName}` : '';
  });

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    pageSize: [10],
    orderSort: this.formBuilder.nonNullable.control<BranchUsersOrderSort>('Newest'),
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

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  ngOnInit(): void {
    if (this.canCreate() || this.canAssignRoles()) {
      this.branchUsersStore.loadRoles();
    }
    this.branchUsersStore.load();
  }

  searchBranchUsers(): void {
    const formValue = this.searchForm.getRawValue();
    this.branchUsersStore.search(formValue.searchText);
  }

  clearBranchUserSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      pageSize: 10,
      orderSort: 'Newest',
    });
    this.branchUsersStore.load({
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      orderSort: 'Newest',
    });
  }

  changePageSizeFromEvent(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.searchForm.controls.pageSize.setValue(value);
    this.branchUsersStore.changePageSize(value);
  }

  changeOrderSortFromEvent(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const orderSort: BranchUsersOrderSort = value === 'Oldest' ? 'Oldest' : 'Newest';
    this.searchForm.controls.orderSort.setValue(orderSort);
    this.branchUsersStore.changeOrderSort(orderSort);
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
      this.buildCreatePayload(),
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

    this.branchUsersStore.updateBranchUser(user.applicationUserId, this.buildUpdatePayload(), () =>
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
    if (!this.canResetPassword(user)) {
      return;
    }

    this.branchUsersStore.clearMessages();
    this.selectedBranchUser.set(user);
    this.resetPasswordModalOpen.set(true);
  }

  closeResetPassword(): void {
    this.selectedBranchUser.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(payload: ResetPasswordModalValue): void {
    const user = this.selectedBranchUser();
    if (!user || this.branchUsersStore.resettingPassword()) {
      return;
    }

    this.branchUsersStore.resetPassword(user.applicationUserId, payload, () =>
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
    this.branchUsersStore.clearCreateFieldError('roleIds');
    this.createRoleIds.update((roleIds) => this.toggleRoleId(roleIds, roleId));
  }

  toggleAssignRole(roleId: string): void {
    this.branchUsersStore.clearAssignRolesError();
    this.assignRoleIds.update((roleIds) => this.toggleRoleId(roleIds, roleId));
  }

  branchUserFieldError(field: keyof typeof this.branchUserForm.controls): string {
    const control = this.branchUserForm.controls[field];
    const backendError = this.createBackendFieldError(field);
    if (backendError.length > 0) {
      return backendError;
    }

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
    const backendError = field === 'email' ? this.branchUsersStore.updateEmailError() ?? '' : '';
    if (backendError.length > 0) {
      return backendError;
    }

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

  createRolesError(): string {
    const backendError = this.branchUsersStore.createRoleIdsError();
    if (backendError) {
      return backendError;
    }

    return this.branchUserForm.touched && this.createRoleIds().length === 0 ? 'branchUsers.roleIdsRequired' : '';
  }

  assignRolesError(): string {
    const backendError = this.branchUsersStore.assignRoleIdsError();
    if (backendError) {
      return backendError;
    }

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

  clearCreateFieldError(field: 'userName' | 'email'): void {
    this.branchUsersStore.clearCreateFieldError(field);
  }

  clearUpdateFieldError(field: 'email'): void {
    this.branchUsersStore.clearUpdateFieldError(field);
  }

  canResetPassword(user: BranchUser): boolean {
    return user.isActive && this.authStore.canResetBranchUserPassword(user.applicationUserId);
  }

  private buildCreatePayload(): CreateBranchUserPayload {
    const value = this.branchUserForm.getRawValue();

    return {
      nameEn: value.nameEn.trim(),
      nameAr: this.toNullableText(value.nameAr),
      userName: value.userName.trim(),
      email: value.email.trim(),
      phoneNumber: this.toNullableText(value.phoneNumber),
      password: value.password,
      roleIds: this.createRoleIds(),
    };
  }

  private buildUpdatePayload(): UpdateBranchUserPayload {
    const value = this.editBranchUserForm.getRawValue();

    return {
      nameEn: value.nameEn.trim(),
      nameAr: this.toNullableText(value.nameAr),
      email: value.email.trim(),
      phoneNumber: this.toNullableText(value.phoneNumber),
    };
  }

  private toNullableText(value: string): string | null {
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  private createBackendFieldError(field: keyof typeof this.branchUserForm.controls): string {
    if (field === 'userName') {
      return this.branchUsersStore.createUserNameError() ?? '';
    }

    if (field === 'email') {
      return this.branchUsersStore.createEmailError() ?? '';
    }

    return '';
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

}
