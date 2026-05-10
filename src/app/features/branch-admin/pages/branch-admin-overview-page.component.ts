import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Network,
  Search,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { BranchAdminBranchStore } from '../branch/state/branch-admin-branch.store';
import { BranchUser } from '../branch-users/models/branch-user.model';
import { BranchUsersStore } from '../branch-users/state/branch-users.store';

@Component({
  selector: 'app-branch-admin-overview-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    TranslatePipe,
  ],
  templateUrl: './branch-admin-overview-page.component.html',
  styleUrl: './branch-admin-overview-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAdminOverviewPageComponent implements OnInit {
  readonly branchStore = inject(BranchAdminBranchStore);
  readonly branchUsersStore = inject(BranchUsersStore);
  private readonly formBuilder = inject(FormBuilder);

  readonly buildingIcon = Building2;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly departmentIcon = Network;
  readonly searchIcon = Search;
  readonly userPlusIcon = UserPlus;
  readonly userCogIcon = UserCog;
  readonly usersIcon = UsersRound;
  readonly createUserModalOpen = signal(false);
  readonly assignRolesModalOpen = signal(false);
  readonly selectedBranchUser = signal<BranchUser | null>(null);
  readonly createRoleIds = signal<readonly string[]>([]);
  readonly assignRoleIds = signal<readonly string[]>([]);

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
  });

  readonly branchUserForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.branchStore.load();
    this.branchUsersStore.loadRoles();
    this.branchUsersStore.load();
  }

  searchBranchUsers(): void {
    this.branchUsersStore.search(this.searchForm.controls.searchText.value);
  }

  clearBranchUserSearch(): void {
    this.searchForm.reset();
    this.branchUsersStore.search('');
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
    if (this.branchUserForm.invalid || this.createRoleIds().length === 0 || this.branchUsersStore.creating()) {
      return;
    }

    this.branchUsersStore.createBranchUser(
      {
        ...this.branchUserForm.getRawValue(),
        roleIds: this.createRoleIds(),
      },
      () => this.closeCreateBranchUser()
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

    this.branchUsersStore.assignRoles(user.applicationUserId, { roleIds: this.assignRoleIds() }, () =>
      this.closeAssignRoles()
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

  createRolesError(): string {
    return this.branchUserForm.touched && this.createRoleIds().length === 0 ? 'branchUsers.roleIdsRequired' : '';
  }

  assignRolesError(): string {
    return this.assignRoleIds().length === 0 ? 'branchUsers.roleIdsRequired' : '';
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
