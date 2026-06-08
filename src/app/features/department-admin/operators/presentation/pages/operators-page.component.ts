import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  KeyRound,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCog,
  UserX,
} from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { OperatorListItem, OperatorTemplateSelectionItem } from '../../domain/operator.model';
import { OperatorsStore } from '../state/operators.store';

interface OperatorTemplateBranchGroup {
  readonly branchKey: string;
  readonly branchName: string;
  readonly branchCode: string;
  readonly expanded: boolean;
  readonly templates: readonly OperatorTemplateSelectionItem[];
}

@Component({
  selector: 'app-operators-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    ResetPasswordModalComponent,
    TranslatePipe,
  ],
  templateUrl: './operators-page.component.html',
  styleUrl: './operators-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorsPageComponent implements OnInit {
  readonly operatorsStore = inject(OperatorsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronRightIcon = ChevronRight;
  readonly editIcon = Pencil;
  readonly deactivateIcon = UserX;
  readonly restoreIcon = RotateCcw;
  readonly resetPasswordIcon = KeyRound;
  readonly templatesIcon = FileText;
  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;

  readonly advancedFiltersOpen = signal(true);

  readonly operatorIcon = UserCog;
  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly selectedOperator = signal<OperatorListItem | null>(null);
  readonly resetPasswordModalOpen = signal(false);
  readonly selectedResetPasswordOperator = signal<OperatorListItem | null>(null);
  readonly templatesModalOpen = signal(false);
  readonly selectedTemplatesOperator = signal<OperatorListItem | null>(null);
  readonly templatesSearchText = signal('');
  readonly selectedTemplateIds = signal<readonly string[]>([]);
  readonly expandedTemplateBranchKeys = signal<readonly string[]>([]);
  readonly isSuperAdmin = computed(() => this.authStore.role() === 'SUPER_ADMIN');
  readonly isDepartmentAdmin = computed(() => this.authStore.role() === 'DEPARTMENT_ADMIN');
  readonly currentDepartmentId = computed(() => this.authStore.user()?.departmentId ?? '');
  readonly canCreateOperator = computed(() => this.isSuperAdmin() || this.isDepartmentAdmin());
  readonly canResetOperatorPassword = computed(() =>
    this.authStore.canResetUserPassword('OPERATOR'),
  );
  readonly canDeactivateOperator = computed(() => this.authStore.canDeactivateOperators());
  readonly canRestoreOperator = computed(() => this.authStore.canRestoreOperators());
  readonly selectedResetPasswordOperatorLabel = computed(() => {
    const operator = this.selectedResetPasswordOperator();
    return operator ? `${operator.nameEn} - ${operator.userName}` : '';
  });
  readonly activeTemplateBranchesCount = computed(
    () =>
      new Set(
        this.operatorsStore
          .activeTemplates()
          .map((template) => template.branchId || template.branchCode)
          .filter((branchId) => branchId.length > 0),
      ).size,
  );
  readonly allTemplatesForModal = computed<readonly OperatorTemplateSelectionItem[]>(() => {
    const selection = this.operatorsStore.templatesSelection();
    if (!selection) {
      return [];
    }

    const templateIds = new Set<string>();
    return [...selection.selectedTemplates, ...selection.availableTemplates].filter((template) => {
      if (template.templateId.length === 0 || templateIds.has(template.templateId)) {
        return false;
      }

      templateIds.add(template.templateId);
      return true;
    });
  });
  readonly selectedTemplatesForModal = computed(() => {
    const selectedIds = new Set(this.selectedTemplateIds());
    return this.allTemplatesForModal().filter((template) => selectedIds.has(template.templateId));
  });
  readonly selectedTemplateBranchGroups = computed<readonly OperatorTemplateBranchGroup[]>(() =>
    this.groupTemplatesByBranch(this.selectedTemplatesForModal(), new Set(this.expandedTemplateBranchKeys())),
  );
  readonly availableTemplatesForModal = computed(() => {
    const selectedIds = new Set(this.selectedTemplateIds());
    return this.allTemplatesForModal().filter((template) => !selectedIds.has(template.templateId));
  });
  readonly hasTemplateSelectionChanges = computed(() => {
    const selection = this.operatorsStore.templatesSelection();
    if (!selection) {
      return false;
    }

    const originalIds = new Set(selection.selectedTemplates.map((template) => template.templateId));
    const currentIds = new Set(this.selectedTemplateIds());
    return originalIds.size !== currentIds.size || [...currentIds].some((templateId) => !originalIds.has(templateId));
  });

  private readonly syncSelectedTemplates = effect(() => {
    const selection = this.operatorsStore.templatesSelection();
    if (!this.templatesModalOpen() || !selection) {
      return;
    }

    this.selectedTemplateIds.set(selection.selectedTemplates.map((template) => template.templateId));
    this.expandedTemplateBranchKeys.set(this.templateBranchKeys(selection.selectedTemplates));
  });

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    departmentId: [''],
    pageSize: ['10'],
  });

  readonly operatorForm = this.formBuilder.nonNullable.group({
    departmentId: ['', [Validators.required]],
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  readonly editOperatorForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.maxLength(30)]],
  });

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  ngOnInit(): void {
    const departmentId = this.currentDepartmentId();
    this.configureDepartmentControls();
    this.searchForm.controls.departmentId.setValue(departmentId);
    this.operatorForm.controls.departmentId.setValue(departmentId);
    this.operatorsStore.load({ departmentId });

    if (this.isSuperAdmin()) {
      this.operatorsStore.loadDepartments();
    }
    if (this.isDepartmentAdmin()) {
      this.operatorsStore.loadActiveTemplates();
    }
  }

  openCreateOperator(): void {
    if (!this.canCreateOperator()) {
      return;
    }

    this.operatorsStore.clearMessages();
    this.operatorForm.reset();
    this.operatorForm.controls.departmentId.setValue(this.currentDepartmentId());
    this.createModalOpen.set(true);
  }

  closeCreateOperator(): void {
    this.operatorForm.reset();
    this.operatorForm.controls.departmentId.setValue(this.currentDepartmentId());
    this.createModalOpen.set(false);
  }

  createOperator(): void {
    this.operatorForm.markAllAsTouched();
    if (this.operatorForm.invalid || this.operatorsStore.creating() || !this.canCreateOperator()) {
      return;
    }

    const value = this.operatorForm.getRawValue();
    const departmentId = value.departmentId.trim();
    this.operatorsStore.createOperator(
      {
        ...(departmentId.length > 0 ? { departmentId } : {}),
        nameEn: value.nameEn.trim(),
        nameAr: value.nameAr.trim(),
        userName: value.userName.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim(),
        password: value.password,
      },
      () => {
        this.closeCreateOperator();
      },
    );
  }

  openEditOperator(operator: OperatorListItem): void {
    if (!operator.isActive) {
      return;
    }

    this.operatorsStore.clearMessages();
    this.selectedOperator.set(operator);
    this.editOperatorForm.setValue({
      nameEn: operator.nameEn,
      nameAr: operator.nameAr,
      email: operator.email,
      phoneNumber: operator.phoneNumber,
    });
    this.editModalOpen.set(true);
  }

  closeEditOperator(): void {
    this.editOperatorForm.reset();
    this.selectedOperator.set(null);
    this.editModalOpen.set(false);
  }

  updateOperator(): void {
    const operator = this.selectedOperator();
    this.editOperatorForm.markAllAsTouched();
    if (!operator || this.editOperatorForm.invalid || this.operatorsStore.updating()) {
      return;
    }

    const value = this.editOperatorForm.getRawValue();
    this.operatorsStore.updateOperator(
      operator.operatorId,
      {
        nameEn: value.nameEn.trim(),
        nameAr: value.nameAr.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim(),
      },
      () => {
        this.closeEditOperator();
      },
    );
  }

  openOperatorTemplates(operator: OperatorListItem): void {
    if (!operator.isActive) {
      return;
    }

    this.operatorsStore.clearMessages();
    this.selectedTemplatesOperator.set(operator);
    this.templatesSearchText.set('');
    this.templatesModalOpen.set(true);
    if (this.isDepartmentAdmin()) {
      this.operatorsStore.loadActiveTemplates();
    }
    this.operatorsStore.loadTemplatesSelection(operator.operatorId);
  }

  closeOperatorTemplates(): void {
    this.templatesModalOpen.set(false);
    this.selectedTemplatesOperator.set(null);
    this.templatesSearchText.set('');
    this.selectedTemplateIds.set([]);
    this.expandedTemplateBranchKeys.set([]);
    this.operatorsStore.clearTemplatesSelection();
  }

  openResetPassword(operator: OperatorListItem): void {
    if (!this.canResetPassword(operator)) {
      return;
    }

    this.operatorsStore.clearMessages();
    this.selectedResetPasswordOperator.set(operator);
    this.resetPasswordModalOpen.set(true);
  }

  deactivateOperator(operator: OperatorListItem): void {
    if (!operator.isActive || !this.canDeactivateOperator() || this.operatorsStore.deactivating()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('operators.deactivateConfirm'));
    if (!confirmed) {
      return;
    }

    this.operatorsStore.deactivateOperator(operator.operatorId, () => undefined);
  }

  restoreOperator(operator: OperatorListItem): void {
    if (operator.isActive || !this.canRestoreOperator() || this.operatorsStore.restoring()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('operators.restoreConfirm'));
    if (!confirmed) {
      return;
    }

    this.operatorsStore.restoreOperator(operator.operatorId, () => undefined);
  }

  closeResetPassword(): void {
    this.selectedResetPasswordOperator.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(payload: ResetPasswordModalValue): void {
    const operator = this.selectedResetPasswordOperator();
    if (!operator || this.operatorsStore.resettingPassword()) {
      return;
    }

    this.operatorsStore.resetPassword(operator.applicationUserId, payload, () =>
      this.closeResetPassword(),
    );
  }

  updateTemplatesSearchText(event: Event): void {
    this.templatesSearchText.set(event.target instanceof HTMLInputElement ? event.target.value : '');
  }

  searchOperatorTemplates(): void {
    const operator = this.selectedTemplatesOperator();
    if (!operator) {
      return;
    }

    this.operatorsStore.loadTemplatesSelection(operator.operatorId, this.templatesSearchText());
  }

  clearOperatorTemplatesSearch(): void {
    const operator = this.selectedTemplatesOperator();
    if (!operator) {
      return;
    }

    this.templatesSearchText.set('');
    this.operatorsStore.loadTemplatesSelection(operator.operatorId);
  }

  selectOperatorTemplate(templateId: string): void {
    if (templateId.length === 0 || this.selectedTemplateIds().includes(templateId)) {
      return;
    }

    this.selectedTemplateIds.update((templateIds) => [...templateIds, templateId]);
    const template = this.allTemplatesForModal().find((currentTemplate) => currentTemplate.templateId === templateId);
    if (template) {
      this.expandTemplateBranch(template);
    }
  }

  removeOperatorTemplate(templateId: string): void {
    this.selectedTemplateIds.update((templateIds) => templateIds.filter((currentTemplateId) => currentTemplateId !== templateId));
  }

  toggleTemplateBranch(branchKey: string): void {
    this.expandedTemplateBranchKeys.update((branchKeys) =>
      branchKeys.includes(branchKey)
        ? branchKeys.filter((currentBranchKey) => currentBranchKey !== branchKey)
        : [...branchKeys, branchKey],
    );
  }

  templateBranchName(template: OperatorTemplateSelectionItem): string {
    const primaryName = this.i18n.language() === 'ar' ? template.branchNameAr : template.branchNameEn;
    const fallbackName = this.i18n.language() === 'ar' ? template.branchNameEn : template.branchNameAr;
    return primaryName.trim() || fallbackName.trim() || template.branchCode.trim() || this.i18n.translate('operators.branch');
  }

  saveOperatorTemplates(): void {
    const operator = this.selectedTemplatesOperator();
    if (!operator || !this.hasTemplateSelectionChanges() || this.operatorsStore.templatesSelectionSaving()) {
      return;
    }

    this.operatorsStore.updateTemplatesSelection(
      operator.operatorId,
      {
        templateIds: this.selectedTemplateIds(),
      },
      this.templatesSearchText(),
    );
  }

  searchOperators(): void {
    const value = this.searchForm.getRawValue();
    this.operatorsStore.search(value.searchText, value.departmentId, this.toPageSize(value.pageSize));
  }

  clearOperatorSearch(): void {
    const departmentId = this.currentDepartmentId();
    this.searchForm.setValue({
      searchText: '',
      departmentId,
      pageSize: '10',
    });
    this.operatorsStore.search('', departmentId, 10);
  }

  goToPreviousOperatorsPage(): void {
    this.operatorsStore.previousPage();
  }

  goToNextOperatorsPage(): void {
    this.operatorsStore.nextPage();
  }

  createdByName(operator: OperatorListItem): string {
    if (!operator.createdBy) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return operator.createdBy.nameAr || operator.createdBy.nameEn || '-';
    }

    return operator.createdBy.nameEn || operator.createdBy.nameAr || '-';
  }

  canResetPassword(operator: OperatorListItem): boolean {
    return operator.isActive && this.authStore.canResetUserPassword('OPERATOR', operator.applicationUserId);
  }

  canDeactivate(operator: OperatorListItem): boolean {
    return operator.isActive && this.canDeactivateOperator();
  }

  canRestore(operator: OperatorListItem): boolean {
    return !operator.isActive && this.canRestoreOperator();
  }

  operatorFieldError(field: keyof typeof this.operatorForm.controls): string {
    const control = this.operatorForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }
    if (control.hasError('email')) {
      return 'operators.emailInvalid';
    }
    if (control.hasError('minlength')) {
      return 'operators.passwordMinLength';
    }
    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    return 'operators.validationError';
  }

  editOperatorFieldError(field: keyof typeof this.editOperatorForm.controls): string {
    const control = this.editOperatorForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'nameEn' ? 'operators.nameEnRequired' : 'operators.emailRequired';
    }
    if (control.hasError('email')) {
      return 'operators.emailInvalid';
    }
    if (control.hasError('maxlength')) {
      const errorKeys: Record<keyof typeof this.editOperatorForm.controls, string> = {
        nameEn: 'operators.nameEnMaxLength',
        nameAr: 'operators.nameArMaxLength',
        email: 'operators.emailMaxLength',
        phoneNumber: 'operators.phoneNumberMaxLength',
      };
      return errorKeys[field];
    }

    return 'operators.validationError';
  }

  private requiredErrorKey(field: keyof typeof this.operatorForm.controls): string {
    const errorKeys: Record<keyof typeof this.operatorForm.controls, string> = {
      departmentId: 'operators.departmentRequired',
      nameEn: 'operators.nameEnRequired',
      nameAr: 'operators.validationError',
      userName: 'operators.userNameRequired',
      email: 'operators.emailRequired',
      phoneNumber: 'operators.validationError',
      password: 'operators.passwordRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: keyof typeof this.operatorForm.controls): string {
    const errorKeys: Record<keyof typeof this.operatorForm.controls, string> = {
      departmentId: 'operators.validationError',
      nameEn: 'operators.nameEnMaxLength',
      nameAr: 'operators.nameArMaxLength',
      userName: 'operators.userNameMaxLength',
      email: 'operators.emailMaxLength',
      phoneNumber: 'operators.phoneNumberMaxLength',
      password: 'operators.passwordMaxLength',
    };

    return errorKeys[field];
  }

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }
    return Math.min(Math.max(pageSize, 1), 100);
  }

  private groupTemplatesByBranch(
    templates: readonly OperatorTemplateSelectionItem[],
    expandedBranchKeys: ReadonlySet<string>,
  ): readonly OperatorTemplateBranchGroup[] {
    const branchGroups = new Map<string, OperatorTemplateBranchGroup>();

    for (const template of templates) {
      const branchKey = this.templateBranchKey(template);
      const currentGroup = branchGroups.get(branchKey);

      if (currentGroup) {
        branchGroups.set(branchKey, {
          ...currentGroup,
          templates: [...currentGroup.templates, template],
        });
        continue;
      }

      branchGroups.set(branchKey, {
        branchKey,
        branchName: this.templateBranchName(template),
        branchCode: template.branchCode.trim(),
        expanded: expandedBranchKeys.has(branchKey),
        templates: [template],
      });
    }

    return [...branchGroups.values()];
  }

  private templateBranchKeys(templates: readonly OperatorTemplateSelectionItem[]): readonly string[] {
    return [...new Set(templates.map((template) => this.templateBranchKey(template)))];
  }

  private expandTemplateBranch(template: OperatorTemplateSelectionItem): void {
    const branchKey = this.templateBranchKey(template);
    this.expandedTemplateBranchKeys.update((branchKeys) => (branchKeys.includes(branchKey) ? branchKeys : [...branchKeys, branchKey]));
  }

  private templateBranchKey(template: OperatorTemplateSelectionItem): string {
    return (
      template.branchId.trim() ||
      template.branchCode.trim() ||
      template.branchNameEn.trim() ||
      template.branchNameAr.trim() ||
      'operators-unassigned-branch'
    );
  }

  private configureDepartmentControls(): void {
    const createDepartmentControl = this.operatorForm.controls.departmentId;

    if (this.isSuperAdmin()) {
      createDepartmentControl.setValidators([Validators.required]);
      createDepartmentControl.enable({ emitEvent: false });
      this.searchForm.controls.departmentId.enable({ emitEvent: false });
    } else {
      createDepartmentControl.clearValidators();
      createDepartmentControl.disable({ emitEvent: false });
      this.searchForm.controls.departmentId.disable({ emitEvent: false });
    }

    createDepartmentControl.updateValueAndValidity({ emitEvent: false });
  }
}
