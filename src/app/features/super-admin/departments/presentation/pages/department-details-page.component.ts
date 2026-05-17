import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ArrowLeft, Pencil, Save, Trash2, UserPlus, UsersRound, X } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { DepartmentAdminsStore } from '../../../department-admins/presentation/state/department-admins.store';
import { DepartmentsStore } from '../state/departments.store';

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
    TranslatePipe,
  ],
  templateUrl: './department-details-page.component.html',
  styleUrl: './department-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDetailsPageComponent implements OnInit {
  readonly departmentsStore = inject(DepartmentsStore);
  readonly departmentAdminsStore = inject(DepartmentAdminsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly cancelIcon = X;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly saveIcon = Save;
  readonly userPlusIcon = UserPlus;
  readonly usersIcon = UsersRound;
  readonly editMode = signal(false);
  readonly createDepartmentAdminModalOpen = signal(false);

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
    if (!department || this.departmentsStore.deleting()) {
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

  openCreateDepartmentAdmin(): void {
    const department = this.departmentsStore.selectedDetails();
    if (!department) {
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
