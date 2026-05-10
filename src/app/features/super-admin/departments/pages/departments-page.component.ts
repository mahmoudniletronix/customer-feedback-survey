import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChevronLeft, ChevronRight, CirclePlus, Eye, Network, Pencil, Search, Trash2 } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Department } from '../models/department.model';
import { DepartmentsStore } from '../state/departments.store';

@Component({
  selector: 'app-departments-page',
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
  templateUrl: './departments-page.component.html',
  styleUrl: './departments-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentsPageComponent implements OnInit {
  readonly departmentsStore = inject(DepartmentsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly selectedDepartment = signal<Department | null>(null);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly createIcon = CirclePlus;
  readonly detailsIcon = Eye;
  readonly departmentIcon = Network;
  readonly editIcon = Pencil;
  readonly searchIcon = Search;
  readonly deleteIcon = Trash2;

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
  });

  readonly createForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
  });

  readonly editForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
  });

  ngOnInit(): void {
    this.departmentsStore.load();
  }

  searchDepartments(): void {
    this.departmentsStore.search(this.searchForm.controls.searchText.value);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.departmentsStore.search('');
  }

  goToPreviousPage(): void {
    this.departmentsStore.previousPage();
  }

  goToNextPage(): void {
    this.departmentsStore.nextPage();
  }

  openDetails(department: Department): void {
    void this.router.navigate(['/departments', department.id]);
  }

  openCreate(): void {
    this.createForm.reset();
    this.createModalOpen.set(true);
  }

  closeCreate(): void {
    this.createForm.reset();
    this.createModalOpen.set(false);
  }

  createDepartment(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid || this.departmentsStore.creating()) {
      return;
    }

    this.departmentsStore.createDepartment(this.createForm.getRawValue());
    this.closeCreate();
  }

  openEdit(department: Department, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedDepartment.set(department);
    this.editForm.setValue({
      nameEn: department.nameEn,
      nameAr: department.nameAr,
    });
    this.editModalOpen.set(true);
  }

  closeEdit(): void {
    this.editForm.reset();
    this.selectedDepartment.set(null);
    this.editModalOpen.set(false);
  }

  updateDepartment(): void {
    const department = this.selectedDepartment();
    this.editForm.markAllAsTouched();

    if (!department || this.editForm.invalid || this.departmentsStore.updating()) {
      return;
    }

    this.departmentsStore.updateDepartment(department.id, this.editForm.getRawValue(), () => {
      this.closeEdit();
    });
  }

  deleteDepartment(department: Department, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.departmentsStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('departments.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.departmentsStore.deleteDepartment(department.id, () => {
      this.closeEdit();
    });
  }

  fieldError(field: keyof typeof this.createForm.controls): string {
    const control = this.createForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return this.i18n.translate('departments.fieldMaxLength');
    }

    return this.i18n.translate('departments.nameEnRequired');
  }

  editFieldError(field: keyof typeof this.editForm.controls): string {
    const control = this.editForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return this.i18n.translate('departments.fieldMaxLength');
    }

    return this.i18n.translate('departments.nameEnRequired');
  }
}
