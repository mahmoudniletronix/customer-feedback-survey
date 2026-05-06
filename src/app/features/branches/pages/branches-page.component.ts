import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Building2, CirclePlus, Plus, UserPlus } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { BranchTableComponent } from '../components/branch-table.component';
import { BranchesStore } from '../state/branches.store';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
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
  private readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);

  readonly createModalOpen = signal(false);
  readonly createAdminModalOpen = signal(false);
  readonly buildingIcon = Building2;
  readonly circlePlusIcon = CirclePlus;
  readonly plusIcon = Plus;
  readonly userPlusIcon = UserPlus;

  readonly branchForm = this.formBuilder.nonNullable.group({
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

  ngOnInit(): void {
    this.branchesStore.load();
  }

  branchFieldError(field: keyof typeof this.branchForm.controls): string {
    const control = this.branchForm.controls[field];
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
}
