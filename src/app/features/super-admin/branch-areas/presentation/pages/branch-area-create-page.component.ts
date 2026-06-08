import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ArrowLeft, Building2, Check, CirclePlus, Save } from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { BranchAreaBranch, CreateBranchAreaPayload } from '../../domain/branch-area.model';
import { BranchAreaCreateStore } from '../state/branch-area-create.store';

@Component({
  selector: 'app-branch-area-create-page',
  standalone: true,
  imports: [ButtonComponent, CardComponent, IconComponent, InputComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './branch-area-create-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAreaCreatePageComponent implements OnInit {
  readonly createStore = inject(BranchAreaCreateStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly arrowLeftIcon = ArrowLeft;
  readonly buildingIcon = Building2;
  readonly checkIcon = Check;
  readonly createIcon = CirclePlus;
  readonly saveIcon = Save;

  readonly createForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
    branchIds: this.formBuilder.nonNullable.control<readonly string[]>([], Validators.required),
  });

  ngOnInit(): void {
    this.createStore.loadBranches();
  }

  goBack(): void {
    this.location.back();
  }

  submit(): void {
    this.createForm.markAllAsTouched();
    this.createStore.clearCreateMessages();

    if (this.createForm.invalid || this.createStore.creating()) {
      return;
    }

    this.createStore.create(this.buildPayload(), (created) => {
      if (this.authStore.canViewBranchAreaDetails()) {
        void this.router.navigate(['/branch-areas', created.branchAreaId]);
        return;
      }

      void this.router.navigate(['/branch-areas']);
    });
  }

  toggleBranchSelection(branchId: string): void {
    const current = this.createForm.controls.branchIds.value;
    const nextBranchIds = current.includes(branchId)
      ? current.filter((selectedBranchId) => selectedBranchId !== branchId)
      : [...current, branchId];

    this.createForm.controls.branchIds.setValue(nextBranchIds);
    this.createForm.controls.branchIds.markAsTouched();
    this.createStore.clearFieldError('branchIds');
  }

  isBranchSelected(branchId: string): boolean {
    return this.createForm.controls.branchIds.value.includes(branchId);
  }

  branchDisplayName(branch: BranchAreaBranch): string {
    const name =
      this.i18n.language() === 'ar'
        ? branch.nameAr || branch.nameEn || branch.code || branch.id
        : branch.nameEn || branch.nameAr || branch.code || branch.id;

    return branch.code ? `${name} - ${branch.code}` : name;
  }

  fieldError(field: keyof typeof this.createForm.controls): string {
    const control = this.createForm.controls[field];
    const backendError = this.backendFieldError(field);
    if (backendError) {
      return backendError;
    }

    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }

    if (control.hasError('email')) {
      return 'branchAreas.createEmailInvalid';
    }

    if (control.hasError('minlength')) {
      return 'branchAreas.createPasswordMinLength';
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    return 'branchAreas.createValidationError';
  }

  clearBackendFieldError(field: 'userName' | 'email'): void {
    this.createStore.clearFieldError(field);
  }

  private buildPayload(): CreateBranchAreaPayload {
    const formValue = this.createForm.getRawValue();

    return {
      nameEn: formValue.nameEn.trim(),
      nameAr: this.toNullableText(formValue.nameAr),
      userName: formValue.userName.trim(),
      email: formValue.email.trim(),
      phoneNumber: this.toNullableText(formValue.phoneNumber),
      password: formValue.password,
      branchIds: formValue.branchIds,
    };
  }

  private toNullableText(value: string): string | null {
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  private backendFieldError(field: keyof typeof this.createForm.controls): string {
    if (field === 'userName') {
      return this.createStore.userNameError() ?? '';
    }

    if (field === 'email') {
      return this.createStore.emailError() ?? '';
    }

    if (field === 'branchIds') {
      return this.createStore.branchIdsError() ?? '';
    }

    return '';
  }

  private requiredErrorKey(field: keyof typeof this.createForm.controls): string {
    const errorKeys: Record<keyof typeof this.createForm.controls, string> = {
      nameEn: 'branchAreas.createNameEnRequired',
      nameAr: 'branchAreas.createValidationError',
      userName: 'branchAreas.createUserNameRequired',
      email: 'branchAreas.createEmailRequired',
      phoneNumber: 'branchAreas.createValidationError',
      password: 'branchAreas.createPasswordRequired',
      branchIds: 'branchAreas.createBranchesRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: keyof typeof this.createForm.controls): string {
    const errorKeys: Record<keyof typeof this.createForm.controls, string> = {
      nameEn: 'branchAreas.createNameEnMaxLength',
      nameAr: 'branchAreas.createNameArMaxLength',
      userName: 'branchAreas.createUserNameMaxLength',
      email: 'branchAreas.createEmailMaxLength',
      phoneNumber: 'branchAreas.createPhoneNumberMaxLength',
      password: 'branchAreas.createPasswordMaxLength',
      branchIds: 'branchAreas.createValidationError',
    };

    return errorKeys[field];
  }
}
