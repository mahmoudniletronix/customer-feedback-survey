import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, take } from 'rxjs';
import {
  ArrowLeft,
  Building2,
  Check,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  UserX,
  X,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { UserPasswordResetService } from '../../../../auth/data/user-password-reset.service';
import {
  BranchAreaBranch,
  BranchAreaDetails,
  UpdateBranchAreaPayload,
} from '../../domain/branch-area.model';
import { BranchAreaDetailsStore } from '../state/branch-area-details.store';

interface ResetPasswordTarget {
  readonly applicationUserId: string;
  readonly label: string;
}

@Component({
  selector: 'app-branch-area-details-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ReactiveFormsModule,
    ResetPasswordModalComponent,
    TranslatePipe,
  ],
  templateUrl: './branch-area-details-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAreaDetailsPageComponent implements OnInit {
  readonly detailsStore = inject(BranchAreaDetailsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly userPasswordResetService = inject(UserPasswordResetService);

  readonly arrowLeftIcon = ArrowLeft;
  readonly buildingIcon = Building2;
  readonly cancelIcon = X;
  readonly checkIcon = Check;
  readonly deactivateIcon = UserX;
  readonly editIcon = Pencil;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly resetPasswordIcon = KeyRound;
  readonly restoreIcon = RotateCcw;
  readonly saveIcon = Save;
  readonly shieldIcon = ShieldCheck;
  readonly usersIcon = UsersRound;
  readonly userIcon = UserRound;
  readonly assignBranchesMode = signal(false);
  readonly editMode = signal(false);
  readonly assignBranchIds = signal<readonly string[]>([]);
  readonly canAssignBranches = computed(() => this.authStore.canAssignBranchAreaBranches());
  readonly canDeactivate = computed(() => this.authStore.canDeactivateBranchAreas());
  readonly canRestore = computed(() => this.authStore.canRestoreBranchAreas());
  readonly canUpdate = computed(() => this.authStore.canUpdateBranchAreas());
  readonly resetPasswordModalOpen = signal(false);
  readonly resetPasswordTarget = signal<ResetPasswordTarget | null>(null);
  readonly resettingPassword = signal(false);
  readonly resetPasswordSuccess = signal<string | null>(null);
  readonly resetPasswordError = signal<string | null>(null);

  readonly editForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', Validators.maxLength(200)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', Validators.maxLength(50)],
  });

  private patchedBranchAreaId = '';

  constructor() {
    effect(() => {
      const branchArea = this.detailsStore.details();
      if (!branchArea || branchArea.branchAreaId === this.patchedBranchAreaId) {
        return;
      }

      this.patchEditForm();
      this.patchedBranchAreaId = branchArea.branchAreaId;
    });
  }

  ngOnInit(): void {
    const branchAreaId = this.route.snapshot.paramMap.get('branchAreaId') ?? '';
    this.detailsStore.load(branchAreaId);
  }

  goBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    this.patchEditForm();
    this.detailsStore.clearUpdateMessages();
    this.assignBranchesMode.set(false);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.patchEditForm();
    this.detailsStore.clearUpdateMessages();
    this.editMode.set(false);
  }

  enableAssignBranches(): void {
    const branchArea = this.detailsStore.details();
    if (!branchArea) {
      return;
    }

    this.assignBranchIds.set(branchArea.branches.map((branch) => branch.id));
    this.detailsStore.clearAssignmentMessages();
    this.detailsStore.loadBranchSelection();
    this.editMode.set(false);
    this.assignBranchesMode.set(true);
  }

  cancelAssignBranches(): void {
    const branchArea = this.detailsStore.details();
    this.assignBranchIds.set(branchArea?.branches.map((branch) => branch.id) ?? []);
    this.detailsStore.clearAssignmentMessages();
    this.assignBranchesMode.set(false);
  }

  updateBranchArea(): void {
    const branchArea = this.detailsStore.details();
    this.editForm.markAllAsTouched();

    if (!branchArea || this.editForm.invalid || this.detailsStore.updating()) {
      return;
    }

    this.detailsStore.update(branchArea.branchAreaId, this.buildUpdatePayload(), () => {
      this.editMode.set(false);
    });
  }

  deactivateBranchArea(): void {
    const branchArea = this.detailsStore.details();
    if (!branchArea || !branchArea.isActive || this.detailsStore.deactivating()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchAreas.deactivateConfirm'));
    if (!confirmed) {
      return;
    }

    this.editMode.set(false);
    this.assignBranchesMode.set(false);
    this.detailsStore.deactivate(branchArea.branchAreaId);
  }

  restoreBranchArea(): void {
    const branchArea = this.detailsStore.details();
    if (!branchArea || branchArea.isActive || this.detailsStore.restoring()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchAreas.restoreConfirm'));
    if (!confirmed) {
      return;
    }

    this.editMode.set(false);
    this.assignBranchesMode.set(false);
    this.detailsStore.restore(branchArea.branchAreaId);
  }

  canResetPassword(applicationUserId: string): boolean {
    const normalizedApplicationUserId = applicationUserId.trim();
    return (
      normalizedApplicationUserId.length > 0 &&
      this.authStore.canResetUserPassword('BRANCH_ADMIN', normalizedApplicationUserId)
    );
  }

  openResetPassword(branchArea: BranchAreaDetails): void {
    if (!this.canResetPassword(branchArea.applicationUserId)) {
      return;
    }

    this.resetPasswordSuccess.set(null);
    this.resetPasswordError.set(null);
    this.resetPasswordTarget.set({
      applicationUserId: branchArea.applicationUserId,
      label: this.branchAreaDisplayName(branchArea),
    });
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

  assignBranches(): void {
    const branchArea = this.detailsStore.details();
    if (!branchArea || this.detailsStore.assigningBranches()) {
      return;
    }

    this.detailsStore.assignBranches(branchArea.branchAreaId, this.assignBranchIds(), () => {
      this.assignBranchesMode.set(false);
    });
  }

  toggleAssignBranchSelection(branchId: string): void {
    this.assignBranchIds.update((branchIds) =>
      branchIds.includes(branchId)
        ? branchIds.filter((currentBranchId) => currentBranchId !== branchId)
        : [...branchIds, branchId],
    );
    this.detailsStore.clearAssignmentMessages();
  }

  isAssignBranchSelected(branchId: string): boolean {
    return this.assignBranchIds().includes(branchId);
  }

  branchName(branch: BranchAreaBranch): string {
    if (this.i18n.language() === 'ar') {
      return branch.nameAr || branch.nameEn || branch.code || branch.id;
    }

    return branch.nameEn || branch.nameAr || branch.code || branch.id;
  }

  branchDisplayName(branch: BranchAreaBranch): string {
    const name = this.branchName(branch);
    return branch.code ? `${name} - ${branch.code}` : name;
  }

  displayValue(value: string | null | undefined): string {
    const text = value?.trim() ?? '';
    return text.length > 0 ? text : '-';
  }

  branchAreaDisplayName(branchArea: BranchAreaDetails): string {
    return this.displayValue(branchArea.nameEn || branchArea.nameAr || branchArea.userName || branchArea.email);
  }

  fieldError(field: keyof typeof this.editForm.controls): string {
    const control = this.editForm.controls[field];
    const backendEmailError = field === 'email' ? this.detailsStore.emailError() : null;
    if (backendEmailError) {
      return backendEmailError;
    }

    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'nameEn' ? 'branchAreas.updateNameEnRequired' : 'branchAreas.updateEmailRequired';
    }

    if (control.hasError('email')) {
      return 'branchAreas.updateEmailInvalid';
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    return 'branchAreas.updateValidationError';
  }

  clearEmailError(): void {
    this.detailsStore.clearEmailError();
  }

  private patchEditForm(): void {
    const branchArea = this.detailsStore.details();
    if (!branchArea) {
      this.editForm.reset();
      return;
    }

    this.editForm.setValue({
      nameEn: branchArea.nameEn,
      nameAr: branchArea.nameAr ?? '',
      email: branchArea.email,
      phoneNumber: branchArea.phoneNumber ?? '',
    });
  }

  private buildUpdatePayload(): UpdateBranchAreaPayload {
    const formValue = this.editForm.getRawValue();

    return {
      nameEn: formValue.nameEn.trim(),
      nameAr: this.toNullableText(formValue.nameAr),
      email: formValue.email.trim(),
      phoneNumber: this.toNullableText(formValue.phoneNumber),
    };
  }

  private toNullableText(value: string): string | null {
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  private maxLengthErrorKey(field: keyof typeof this.editForm.controls): string {
    const errorKeys: Record<keyof typeof this.editForm.controls, string> = {
      nameEn: 'branchAreas.updateNameEnMaxLength',
      nameAr: 'branchAreas.updateNameArMaxLength',
      email: 'branchAreas.updateEmailMaxLength',
      phoneNumber: 'branchAreas.updatePhoneNumberMaxLength',
    };

    return errorKeys[field];
  }
}
