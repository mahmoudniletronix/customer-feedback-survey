import { DOCUMENT, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Globe2,
  Link,
  MessageSquareText,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthStore } from '../../../auth/presentation/state/auth.store';
import { BranchesService } from '../../../super-admin/branches/data/branches.service';
import { BranchSelection } from '../../../super-admin/branches/domain/branch.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  AnonymousTemplateListItem,
  AnonymousTemplateCustomInputType,
  AnonymousTemplateScope,
  CreateAnonymousTemplateCustomInputPayload,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

type AnonymousTemplateFieldName = 'nameEn' | 'nameAr' | 'description' | 'activeFrom' | 'expireTo';
type CustomInputTypeFormValue = '1' | '2';
type CustomInputFieldName =
  | 'name'
  | 'labelEn'
  | 'labelAr'
  | 'type'
  | 'isRequired'
  | 'minLength'
  | 'maxLength'
  | 'minValue'
  | 'maxValue'
  | 'order';

interface CustomInputFormControls {
  name: FormControl<string>;
  labelEn: FormControl<string>;
  labelAr: FormControl<string>;
  type: FormControl<CustomInputTypeFormValue>;
  isRequired: FormControl<boolean>;
  minLength: FormControl<number | null>;
  maxLength: FormControl<number | null>;
  minValue: FormControl<number | null>;
  maxValue: FormControl<number | null>;
  order: FormControl<number>;
}

type CustomInputFormGroup = FormGroup<CustomInputFormControls>;

@Component({
  selector: 'app-anonymous-templates-page',
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
  templateUrl: './anonymous-templates-page.component.html',
  styleUrl: './anonymous-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplatesPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly branchesService = inject(BranchesService);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly branchIcon = Building2;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly copyIcon = Copy;
  readonly downloadIcon = Download;
  readonly detailsIcon = Eye;
  readonly fileTextIcon = FileText;
  readonly globeIcon = Globe2;
  readonly linkIcon = Link;
  readonly responsesIcon = MessageSquareText;
  readonly plusIcon = Plus;
  readonly qrCodeIcon = QrCode;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly deleteIcon = Trash2;
  readonly copiedPublicUrl = signal(false);
  readonly copiedTemplateId = signal<string | null>(null);
  readonly branchOptions = signal<readonly BranchSelection[]>([]);
  readonly branchOptionsLoading = signal(false);
  readonly createModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly restoreModalOpen = signal(false);
  readonly templatePendingDelete = signal<AnonymousTemplateListItem | null>(null);
  readonly templatePendingRestore = signal<AnonymousTemplateListItem | null>(null);

  readonly canCreate = computed(() => this.authStore.canManageAnonymousTemplates('Create'));
  readonly canDelete = computed(() => this.authStore.canManageAnonymousTemplates('Delete'));
  readonly canRestore = computed(() => this.authStore.canManageAnonymousTemplates('Restore'));
  readonly canViewDetails = computed(() =>
    this.authStore.canManageAnonymousTemplates('ViewDetails'),
  );
  readonly canViewResponses = computed(() =>
    this.authStore.canManageAnonymousTemplates('ViewResponses'),
  );
  readonly showSuperAdminFilters = computed(() => this.authStore.role() === 'SUPER_ADMIN');
  readonly scope = computed<AnonymousTemplateScope | null>(() => {
    if (this.authStore.role() === 'SUPER_ADMIN') {
      return 2;
    }

    if (this.authStore.role() === 'BRANCH_ADMIN' || this.authStore.hasApiRole('Template Editor')) {
      return 1;
    }

    return null;
  });
  readonly scopeLabelKey = computed(() =>
    this.scope() === 2 ? 'anonymousTemplates.scopeGlobal' : 'anonymousTemplates.scopeBranch',
  );
  readonly scopeIcon = computed(() => (this.scope() === 2 ? this.globeIcon : this.branchIcon));

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    scope: [''],
    branchId: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    activeFrom: [this.toDateTimeLocalValue(new Date()), [Validators.required]],
    expireTo: [''],
    customInputs: this.formBuilder.array<CustomInputFormGroup>([]),
  });

  ngOnInit(): void {
    this.anonymousTemplatesStore.load();
    this.loadBranchOptionsForSuperAdmin();
  }

  get customInputsArray(): FormArray<CustomInputFormGroup> {
    return this.templateForm.controls.customInputs;
  }

  createTemplate(): void {
    this.templateForm.markAllAsTouched();
    this.validateTemplateDates();
    this.validateCustomInputs();

    const scope = this.scope();
    if (this.templateForm.invalid || this.anonymousTemplatesStore.creating() || !scope) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.anonymousTemplatesStore.createTemplate(
      {
        scope,
        nameEn: formValue.nameEn.trim(),
        nameAr: this.toNullableTrimmedText(formValue.nameAr),
        description: this.toNullableTrimmedText(formValue.description),
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
        customInputs: this.toCustomInputsPayload(),
      },
      () => {
        this.createModalOpen.set(false);
        this.resetCreateFormValues();
        this.anonymousTemplatesStore.load({ pageNumber: 1 });
      },
    );
  }

  openCreateTemplate(): void {
    if (!this.canCreate()) {
      return;
    }

    this.anonymousTemplatesStore.clearMessages();
    this.createModalOpen.set(true);
  }

  closeCreateTemplate(): void {
    this.createModalOpen.set(false);
    this.resetCreateFormValues();
  }

  searchTemplates(): void {
    const formValue = this.searchForm.getRawValue();
    this.anonymousTemplatesStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
      this.toPageSize(formValue.pageSize),
      formValue.orderSort,
      this.showSuperAdminFilters() ? this.toScopeFilter(formValue.scope) : null,
      this.showSuperAdminFilters() ? this.toNullableTrimmedText(formValue.branchId) : null,
    );
  }

  clearTemplateSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      scope: '',
      branchId: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    this.anonymousTemplatesStore.search('', null, 10, '', null, null);
  }

  goToPreviousTemplatesPage(): void {
    this.anonymousTemplatesStore.previousPage();
  }

  goToNextTemplatesPage(): void {
    this.anonymousTemplatesStore.nextPage();
  }

  openTemplateDetails(anonymousTemplateId: string): void {
    if (!this.canViewDetails() || anonymousTemplateId.length === 0) {
      return;
    }

    void this.router.navigate(['/anonymous-templates', anonymousTemplateId]);
  }

  openTemplateResponses(template: AnonymousTemplateListItem): void {
    if (!this.canViewTemplateResponses(template)) {
      return;
    }

    void this.router.navigate([
      '/anonymous-templates',
      template.anonymousTemplateId,
      'responses',
    ]);
  }

  openDeleteTemplate(template: AnonymousTemplateListItem): void {
    if (!this.canDeleteTemplate(template)) {
      return;
    }

    this.anonymousTemplatesStore.clearMessages();
    this.templatePendingDelete.set(template);
    this.deleteModalOpen.set(true);
  }

  closeDeleteTemplate(): void {
    this.templatePendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedTemplate(): void {
    const template = this.templatePendingDelete();
    if (
      !template ||
      this.anonymousTemplatesStore.deleting() ||
      !this.canDeleteTemplate(template)
    ) {
      return;
    }

    this.anonymousTemplatesStore.deleteTemplate(template.anonymousTemplateId, () => {
      this.closeDeleteTemplate();
    });
  }

  openRestoreTemplate(template: AnonymousTemplateListItem): void {
    if (!this.canRestoreTemplate(template)) {
      return;
    }

    this.anonymousTemplatesStore.clearMessages();
    this.templatePendingRestore.set(template);
    this.restoreModalOpen.set(true);
  }

  closeRestoreTemplate(): void {
    this.templatePendingRestore.set(null);
    this.restoreModalOpen.set(false);
  }

  restoreSelectedTemplate(): void {
    const template = this.templatePendingRestore();
    if (
      !template ||
      this.anonymousTemplatesStore.restoring() ||
      !this.canRestoreTemplate(template)
    ) {
      return;
    }

    this.anonymousTemplatesStore.restoreTemplate(template.anonymousTemplateId, () => {
      this.closeRestoreTemplate();
    });
  }

  canDeleteTemplate(template: AnonymousTemplateListItem): boolean {
    return this.canDelete() && template.isActive && this.canUseTemplateAction(template);
  }

  canRestoreTemplate(template: AnonymousTemplateListItem): boolean {
    return this.canRestore() && !template.isActive && this.canUseTemplateAction(template);
  }

  canViewTemplateResponses(template: AnonymousTemplateListItem): boolean {
    return this.canViewResponses() && this.canUseTemplateAction(template);
  }

  resetForm(): void {
    this.resetCreateFormValues();
    this.anonymousTemplatesStore.clearMessages();
  }

  private resetCreateFormValues(): void {
    this.templateForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: this.toDateTimeLocalValue(new Date()),
      expireTo: '',
    });
    this.customInputsArray.clear();
    this.copiedPublicUrl.set(false);
  }

  addCustomInput(): void {
    this.customInputsArray.push(this.createCustomInputGroup(this.customInputsArray.length + 1));
  }

  removeCustomInput(index: number): void {
    this.customInputsArray.removeAt(index);
    this.validateCustomInputs();
  }

  changeCustomInputType(inputGroup: CustomInputFormGroup): void {
    const type = inputGroup.controls.type.value;

    if (type === '1') {
      inputGroup.controls.minValue.setValue(null);
      inputGroup.controls.maxValue.setValue(null);
    } else {
      inputGroup.controls.minLength.setValue(null);
      inputGroup.controls.maxLength.setValue(null);
    }

    this.validateCustomInputs();
  }

  templateFieldError(field: AnonymousTemplateFieldName): string {
    const control = this.templateForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'activeFrom'
        ? 'branchTemplates.activeFromRequired'
        : 'branchTemplates.nameEnRequired';
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    if (control.hasError('dateRange')) {
      return 'branchTemplates.expireToAfterActiveFrom';
    }

    return 'branchTemplates.fieldRequired';
  }

  customInputFieldError(index: number, field: CustomInputFieldName): string {
    const group = this.customInputsArray.at(index);
    const control = group.controls[field];

    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return `branchTemplates.customInput${this.capitalizeField(field)}Required`;
    }

    if (control.hasError('maxlength')) {
      return `branchTemplates.customInput${this.capitalizeField(field)}MaxLength`;
    }

    if (control.hasError('min') || control.hasError('invalidOrder')) {
      return 'branchTemplates.customInputOrderInvalid';
    }

    if (control.hasError('duplicatedName')) {
      return 'branchTemplates.customInputNameDuplicated';
    }

    if (control.hasError('duplicatedOrder')) {
      return 'branchTemplates.customInputOrderDuplicated';
    }

    if (control.hasError('stringValidation') || control.hasError('max')) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }

    if (control.hasError('integerValidation')) {
      return 'branchTemplates.customInputIntegerValidationInvalid';
    }

    return 'branchTemplates.fieldRequired';
  }

  copyPublicUrl(publicUrl: string): void {
    if (!publicUrl) {
      return;
    }

    if (globalThis.navigator?.clipboard) {
      void globalThis.navigator.clipboard.writeText(publicUrl).then(() => {
        this.copiedPublicUrl.set(true);
      });
      return;
    }

    this.copiedPublicUrl.set(false);
  }

  copyTemplatePublicUrl(templateId: string, publicUrl: string): void {
    if (!publicUrl) {
      return;
    }

    if (globalThis.navigator?.clipboard) {
      void globalThis.navigator.clipboard.writeText(publicUrl).then(() => {
        this.copiedTemplateId.set(templateId);
      });
      return;
    }

    this.copiedTemplateId.set(null);
  }

  downloadQrCode(qrCode: string | null): void {
    if (!qrCode) {
      return;
    }

    const linkElement = this.document.createElement('a');
    linkElement.href = qrCode;
    linkElement.download = `anonymous-template-qr-${Date.now()}.png`;
    linkElement.click();
  }

  branchOptionDisplayName(branch: BranchSelection): string {
    return this.localizedText(branch.nameEn, branch.nameAr, branch.code);
  }

  templateDisplayName(template: { nameEn: string | null; nameAr: string | null }): string {
    return this.localizedText(template.nameEn, template.nameAr);
  }

  customInputDisplayLabel(input: {
    labelEn: string | null;
    labelAr: string | null;
    name: string;
  }): string {
    return this.localizedText(input.labelEn ?? input.name, input.labelAr, input.name);
  }

  branchDisplayName(template: { branchNameEn: string | null; branchNameAr: string | null }): string {
    return this.localizedText(template.branchNameEn, template.branchNameAr);
  }

  private localizedText(
    enValue: string | null | undefined,
    arValue: string | null | undefined,
    fallback = '-',
  ): string {
    const englishText = enValue?.trim() ?? '';
    const arabicText = arValue?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || fallback;
    }

    return englishText || arabicText || fallback;
  }

  private canUseTemplateAction(template: AnonymousTemplateListItem): boolean {
    if (this.authStore.role() === 'SUPER_ADMIN') {
      return template.isGlobal;
    }

    if (this.authStore.role() === 'BRANCH_ADMIN' || this.authStore.hasApiRole('Template Editor')) {
      return !template.isGlobal;
    }

    return this.authStore.hasPermission('AnonymousTemplates.Delete') ||
      this.authStore.hasPermission('AnonymousTemplates.Restore') ||
      this.authStore.hasPermission('AnonymousTemplates.ViewResponses');
  }

  private loadBranchOptionsForSuperAdmin(): void {
    if (!this.showSuperAdminFilters()) {
      return;
    }

    this.branchOptionsLoading.set(true);
    this.branchesService.selection().subscribe({
      next: (branches) => {
        this.branchOptions.set(branches);
        this.branchOptionsLoading.set(false);
      },
      error: () => {
        this.branchOptions.set([]);
        this.branchOptionsLoading.set(false);
      },
    });
  }

  private maxLengthErrorKey(field: AnonymousTemplateFieldName): string {
    const errorKeys: Record<AnonymousTemplateFieldName, string> = {
      nameEn: 'branchTemplates.nameEnMaxLength',
      nameAr: 'branchTemplates.nameArMaxLength',
      description: 'branchTemplates.descriptionMaxLength',
      activeFrom: 'branchTemplates.fieldRequired',
      expireTo: 'branchTemplates.fieldRequired',
    };

    return errorKeys[field];
  }

  private createCustomInputGroup(order: number): CustomInputFormGroup {
    return this.formBuilder.group<CustomInputFormControls>({
      name: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(100),
      ]),
      labelEn: this.formBuilder.nonNullable.control('', [Validators.maxLength(200)]),
      labelAr: this.formBuilder.nonNullable.control('', [Validators.maxLength(200)]),
      type: this.formBuilder.nonNullable.control<CustomInputTypeFormValue>('1', [
        Validators.required,
      ]),
      isRequired: this.formBuilder.nonNullable.control(true),
      minLength: new FormControl<number | null>(null, [Validators.max(3000)]),
      maxLength: new FormControl<number | null>(null, [Validators.max(3000)]),
      minValue: new FormControl<number | null>(null),
      maxValue: new FormControl<number | null>(null),
      order: this.formBuilder.nonNullable.control(order, [
        Validators.required,
        Validators.min(1),
      ]),
    });
  }

  private validateCustomInputs(): void {
    const names = new Map<string, number[]>();
    const orders = new Map<number, number[]>();

    this.customInputsArray.controls.forEach((inputGroup, index) => {
      this.clearCustomInputManualErrors(inputGroup);

      const value = inputGroup.getRawValue();
      const name = value.name.trim().toLowerCase();
      if (name.length === 0) {
        this.setControlError(inputGroup.controls.name, 'required');
      } else {
        names.set(name, [...(names.get(name) ?? []), index]);
      }

      if (!Number.isInteger(value.order) || value.order <= 0) {
        this.setControlError(inputGroup.controls.order, 'invalidOrder');
      } else {
        orders.set(value.order, [...(orders.get(value.order) ?? []), index]);
      }

      if (value.type === '1') {
        inputGroup.controls.minValue.setValue(null, { emitEvent: false });
        inputGroup.controls.maxValue.setValue(null, { emitEvent: false });
        this.validateStringCustomInput(inputGroup);
      } else {
        inputGroup.controls.minLength.setValue(null, { emitEvent: false });
        inputGroup.controls.maxLength.setValue(null, { emitEvent: false });
        this.validateIntegerCustomInput(inputGroup);
      }
    });

    names.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((index) =>
          this.setControlError(this.customInputsArray.at(index).controls.name, 'duplicatedName'),
        );
      }
    });

    orders.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((index) =>
          this.setControlError(this.customInputsArray.at(index).controls.order, 'duplicatedOrder'),
        );
      }
    });
  }

  private validateStringCustomInput(inputGroup: CustomInputFormGroup): void {
    const minLength = inputGroup.controls.minLength.value;
    const maxLength = inputGroup.controls.maxLength.value;

    if (minLength !== null && minLength < 0) {
      this.setControlError(inputGroup.controls.minLength, 'stringValidation');
    }

    if (maxLength !== null && maxLength > 3000) {
      this.setControlError(inputGroup.controls.maxLength, 'stringValidation');
    }

    if (minLength !== null && maxLength !== null && maxLength < minLength) {
      this.setControlError(inputGroup.controls.maxLength, 'stringValidation');
    }
  }

  private validateIntegerCustomInput(inputGroup: CustomInputFormGroup): void {
    const minValue = inputGroup.controls.minValue.value;
    const maxValue = inputGroup.controls.maxValue.value;

    if (minValue !== null && maxValue !== null && maxValue < minValue) {
      this.setControlError(inputGroup.controls.maxValue, 'integerValidation');
    }
  }

  private clearCustomInputManualErrors(inputGroup: CustomInputFormGroup): void {
    Object.values(inputGroup.controls).forEach((control) => {
      const errors = control.errors;
      if (!errors) {
        return;
      }

      const {
        duplicatedName: _duplicatedName,
        duplicatedOrder: _duplicatedOrder,
        invalidOrder: _invalidOrder,
        stringValidation: _stringValidation,
        integerValidation: _integerValidation,
        required: _manualRequired,
        ...remainingErrors
      } = errors;

      const shouldKeepRequired =
        control.hasValidator(Validators.required) &&
        (control.value === null ||
          (typeof control.value === 'string' && control.value.trim().length === 0));

      control.setErrors({
        ...(shouldKeepRequired ? { required: true } : {}),
        ...remainingErrors,
      });

      if (control.errors && Object.keys(control.errors).length === 0) {
        control.setErrors(null);
      }
    });
  }

  private setControlError(control: AbstractControl, errorKey: string): void {
    control.setErrors({ ...(control.errors ?? {}), [errorKey]: true });
    control.markAsTouched();
  }

  private toCustomInputsPayload(): readonly CreateAnonymousTemplateCustomInputPayload[] {
    return this.customInputsArray.controls.map((inputGroup) => {
      const value = inputGroup.getRawValue();
      const type: AnonymousTemplateCustomInputType = Number(value.type) === 2 ? 2 : 1;

      return {
        name: value.name.trim(),
        labelEn: this.toNullableTrimmedText(value.labelEn),
        labelAr: this.toNullableTrimmedText(value.labelAr),
        type,
        isRequired: value.isRequired,
        minLength: type === 1 ? value.minLength : null,
        maxLength: type === 1 ? value.maxLength : null,
        minValue: type === 2 ? value.minValue : null,
        maxValue: type === 2 ? value.maxValue : null,
        order: value.order,
      };
    });
  }

  private validateTemplateDates(): void {
    const activeFrom = this.templateForm.controls.activeFrom.value;
    const expireTo = this.templateForm.controls.expireTo.value;
    const expireToControl = this.templateForm.controls.expireTo;

    if (!expireTo) {
      const { dateRange: _dateRange, ...remainingErrors } = expireToControl.errors ?? {};
      expireToControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
      return;
    }

    const activeFromTime = new Date(activeFrom).getTime();
    const expireToTime = new Date(expireTo).getTime();

    if (
      Number.isNaN(activeFromTime) ||
      Number.isNaN(expireToTime) ||
      expireToTime <= activeFromTime
    ) {
      expireToControl.setErrors({ ...(expireToControl.errors ?? {}), dateRange: true });
      return;
    }

    const { dateRange: _dateRange, ...remainingErrors } = expireToControl.errors ?? {};
    expireToControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
  }

  private toNullableTrimmedText(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
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

  private toScopeFilter(value: string): AnonymousTemplateScope | null {
    return value === '1' || value === '2' ? (Number(value) as AnonymousTemplateScope) : null;
  }

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }
    return Math.min(Math.max(pageSize, 1), 100);
  }

  private capitalizeField(field: CustomInputFieldName): string {
    return `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  }

  private toUtcIsoDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private toDateTimeLocalValue(date: Date): string {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
