import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Network,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DepartmentsStore } from '../../departments/state/departments.store';
import { BranchTableComponent } from '../components/branch-table.component';
import { Branch } from '../models/branch.model';
import { BranchesStore } from '../state/branches.store';

@Component({
  selector: 'app-branches-page',
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
    BranchTableComponent,
  ],
  templateUrl: './branches-page.component.html',
  styleUrl: './branches-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchesPageComponent implements OnInit {
  readonly branchesStore = inject(BranchesStore);
  readonly departmentsStore = inject(DepartmentsStore);
  private readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly createModalOpen = signal(false);
  readonly editBranchModalOpen = signal(false);
  readonly createAdminModalOpen = signal(false);
  readonly createDepartmentModalOpen = signal(false);
  readonly branchDetailsModalOpen = signal(false);
  readonly selectedBranchForEdit = signal<Branch | null>(null);
  readonly buildingIcon = Building2;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly circlePlusIcon = CirclePlus;
  readonly deleteIcon = Trash2;
  readonly departmentIcon = Network;
  readonly plusIcon = Plus;
  readonly saveIcon = Save;
  readonly searchIcon = Search;
  readonly userPlusIcon = UserPlus;

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
  });

  readonly branchForm = this.formBuilder.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    code: ['', Validators.required],
    address: ['', Validators.required],
  });

  readonly editBranchForm = this.formBuilder.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    code: ['', Validators.required],
    address: ['', Validators.required],
  });

  readonly branchAdminForm = this.formBuilder.nonNullable.group({
    branchId: ['', Validators.required],
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly departmentForm = this.formBuilder.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
  });

  ngOnInit(): void {
    this.branchesStore.load();
    this.branchesStore.loadSelection();
  }

  searchBranches(): void {
    this.branchesStore.search(this.searchForm.controls.searchText.value);
  }

  clearBranchSearch(): void {
    this.searchForm.reset();
    this.branchesStore.search('');
  }

  goToPreviousBranchesPage(): void {
    this.branchesStore.previousPage();
  }

  goToNextBranchesPage(): void {
    this.branchesStore.nextPage();
  }

  openBranchDetails(branch: Branch): void {
    void this.router.navigate(['/branches', branch.id]);
  }

  openEditBranch(branch: Branch): void {
    this.selectedBranchForEdit.set(branch);
    this.editBranchForm.setValue({
      nameEn: branch.nameEn,
      nameAr: branch.nameAr,
      code: branch.code,
      address: branch.address,
    });
    this.editBranchModalOpen.set(true);
  }

  closeEditBranch(): void {
    this.editBranchForm.reset();
    this.selectedBranchForEdit.set(null);
    this.editBranchModalOpen.set(false);
  }

  updateBranch(): void {
    const branch = this.selectedBranchForEdit();
    this.editBranchForm.markAllAsTouched();

    if (!branch || this.editBranchForm.invalid || this.branchesStore.updating()) {
      return;
    }

    this.branchesStore.updateBranchFromList(branch.id, this.editBranchForm.getRawValue(), () => {
      this.closeEditBranch();
    });
  }

  deleteBranch(branch: Branch): void {
    if (this.branchesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branches.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchesStore.deleteBranchFromList(branch.id, () => {
      this.closeEditBranch();
    });
  }

  closeBranchDetails(): void {
    this.branchesStore.clearDetails();
    this.branchDetailsModalOpen.set(false);
  }

  branchFieldError(field: keyof typeof this.branchForm.controls): string {
    const control = this.branchForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    return this.i18n.translate('branches.fieldRequired');
  }

  editBranchFieldError(field: keyof typeof this.editBranchForm.controls): string {
    const control = this.editBranchForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    return this.i18n.translate('branches.fieldRequired');
  }

  branchAdminFieldError(field: keyof typeof this.branchAdminForm.controls): string {
    const control = this.branchAdminForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (field === 'email' && control.hasError('email')) {
      return this.i18n.translate('auth.emailInvalid');
    }
    if (field === 'password' && control.hasError('minlength')) {
      return this.i18n.translate('auth.passwordLength');
    }

    return this.i18n.translate('branches.fieldRequired');
  }

  departmentFieldError(field: keyof typeof this.departmentForm.controls): string {
    const control = this.departmentForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    return this.i18n.translate('branches.fieldRequired');
  }

  createBranch(): void {
    this.branchForm.markAllAsTouched();
    if (this.branchForm.invalid || this.branchesStore.creating()) {
      return;
    }

    this.branchesStore.createBranch(this.branchForm.getRawValue());
    this.branchForm.reset();
    this.createModalOpen.set(false);
  }

  createBranchAdmin(): void {
    this.branchAdminForm.markAllAsTouched();
    if (this.branchAdminForm.invalid || this.branchesStore.creatingAdmin()) {
      return;
    }

    this.branchesStore.createBranchAdmin(this.branchAdminForm.getRawValue());
    this.branchAdminForm.reset();
    this.createAdminModalOpen.set(false);
  }

  openCreateDepartment(): void {
    this.departmentForm.reset();
    this.createDepartmentModalOpen.set(true);
  }

  closeCreateDepartmentModal(): void {
    this.departmentForm.reset();
    this.createDepartmentModalOpen.set(false);
  }

  createDepartment(): void {
    this.departmentForm.markAllAsTouched();
    if (this.departmentForm.invalid || this.departmentsStore.creating()) {
      return;
    }

    this.departmentsStore.createDepartment(this.departmentForm.getRawValue());
    this.departmentForm.reset();
    this.createDepartmentModalOpen.set(false);
  }
}
