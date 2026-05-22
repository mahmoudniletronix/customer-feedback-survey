import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  BranchTemplate,
  CreateBranchTemplateCustomInputPayload,
  UpdateBranchTemplateCustomInputPayload,
} from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

type TemplateFieldName = 'nameEn' | 'nameAr' | 'description' | 'activeFrom' | 'expireTo';
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
  customInputId: FormControl<string | null>;
  originalType: FormControl<CustomInputTypeFormValue | null>;
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
  selector: 'app-branch-templates-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './branch-templates-page.component.html',
  styleUrl: './branch-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatesPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly dashboardIcon = BarChart3;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly fileTextIcon = FileText;
  readonly historyIcon = History;
  readonly listChecksIcon = ListChecks;
  readonly plusIcon = Plus;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;
  readonly advancedFiltersOpen = signal(true);
  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly selectedTemplate = signal<BranchTemplate | null>(null);

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
    orderSort: [''],
  });

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: [this.toDateTimeLocalValue(new Date()), [Validators.required]],
    expireTo: [''],
    customInputs: this.formBuilder.array<CustomInputFormGroup>([]),
  });

  readonly editTemplateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: ['', [Validators.required]],
    expireTo: [''],
    customInputs: this.formBuilder.array<CustomInputFormGroup>([]),
  });

  ngOnInit(): void {
    this.templatesStore.load();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  get customInputsArray(): FormArray<CustomInputFormGroup> {
    return this.templateForm.controls.customInputs;
  }

  get editCustomInputsArray(): FormArray<CustomInputFormGroup> {
    return this.editTemplateForm.controls.customInputs;
  }

  searchTemplates(): void {
    const formValue = this.searchForm.getRawValue();
    this.templatesStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
      formValue.orderSort,
    );
  }

  clearTemplateSearch(): void {
    this.searchForm.reset();
    this.templatesStore.search('', null, '');
  }

  goToPreviousTemplatesPage(): void {
    this.templatesStore.previousPage();
  }

  goToNextTemplatesPage(): void {
    this.templatesStore.nextPage();
  }

  openCreateTemplate(): void {
    this.templatesStore.clearMessages();
    this.templateForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: this.toDateTimeLocalValue(new Date()),
      expireTo: '',
    });
    this.customInputsArray.clear();
    this.createModalOpen.set(true);
  }

  closeCreateTemplate(): void {
    this.templateForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: this.toDateTimeLocalValue(new Date()),
      expireTo: '',
    });
    this.customInputsArray.clear();
    this.createModalOpen.set(false);
  }

  createTemplate(): void {
    this.templateForm.markAllAsTouched();
    this.validateCreateTemplateDates();
    this.validateCustomInputs(this.customInputsArray);
    if (this.templateForm.invalid || this.templatesStore.creating()) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.templatesStore.createTemplate(
      {
        nameEn: formValue.nameEn,
        nameAr: formValue.nameAr,
        description: formValue.description,
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
        customInputs: this.toCustomInputsPayload(),
      },
      () => {
        this.closeCreateTemplate();
      },
    );
  }

  addCustomInput(): void {
    this.customInputsArray.push(this.createCustomInputGroup(this.customInputsArray.length + 1));
  }

  removeCustomInput(index: number): void {
    this.customInputsArray.removeAt(index);
    this.validateCustomInputs(this.customInputsArray);
  }

  changeCustomInputType(inputGroup: CustomInputFormGroup): void {
    const originalType = inputGroup.controls.originalType.value;
    if (inputGroup.controls.customInputId.value && originalType) {
      inputGroup.controls.type.setValue(originalType, { emitEvent: false });
      return;
    }

    const type = inputGroup.controls.type.value;

    if (type === '1') {
      inputGroup.controls.minValue.setValue(null);
      inputGroup.controls.maxValue.setValue(null);
    } else {
      inputGroup.controls.minLength.setValue(null);
      inputGroup.controls.maxLength.setValue(null);
    }

    this.validateCustomInputs(this.customInputsArray);
  }

  customInputFieldError(index: number, field: CustomInputFieldName): string {
    return this.customInputFieldErrorFor(this.customInputsArray, index, field);
  }

  customInputFieldErrorFor(
    inputsArray: FormArray<CustomInputFormGroup>,
    index: number,
    field: CustomInputFieldName,
  ): string {
    const group = inputsArray.at(index);
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

    if (control.hasError('typeCannotBeChanged')) {
      return 'branchTemplates.customInputTypeCannotBeChanged';
    }

    if (control.hasError('stringValidation')) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }

    if (control.hasError('integerValidation')) {
      return 'branchTemplates.customInputIntegerValidationInvalid';
    }

    if (control.hasError('max')) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }

    return 'branchTemplates.fieldRequired';
  }

  addEditCustomInput(): void {
    this.editCustomInputsArray.push(
      this.createCustomInputGroup(this.editCustomInputsArray.length + 1),
    );
  }

  removeEditCustomInput(index: number): void {
    this.editCustomInputsArray.removeAt(index);
    this.validateCustomInputs(this.editCustomInputsArray);
  }

  changeEditCustomInputType(inputGroup: CustomInputFormGroup): void {
    const originalType = inputGroup.controls.originalType.value;
    if (inputGroup.controls.customInputId.value && originalType) {
      inputGroup.controls.type.setValue(originalType, { emitEvent: false });
      return;
    }

    this.changeCustomInputType(inputGroup);
    this.validateCustomInputs(this.editCustomInputsArray);
  }

  editCustomInputFieldError(index: number, field: CustomInputFieldName): string {
    return this.customInputFieldErrorFor(this.editCustomInputsArray, index, field);
  }

  customInputTypeLabel(type: number): string {
    return type === 2
      ? this.i18n.translate('branchTemplates.customInputTypeInteger')
      : this.i18n.translate('branchTemplates.customInputTypeString');
  }

  openEditTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    this.templatesStore.clearMessages();
    this.selectedTemplate.set(template);
    this.editTemplateForm.patchValue({
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      description: template.description,
      activeFrom: template.activeFrom
        ? this.toDateTimeLocalValue(new Date(template.activeFrom))
        : this.toDateTimeLocalValue(new Date()),
      expireTo: template.expireTo ? this.toDateTimeLocalValue(new Date(template.expireTo)) : '',
    });
    this.editCustomInputsArray.clear();
    [...template.customInputs]
      .filter((customInput) => customInput.isActive)
      .sort((first, second) => first.order - second.order)
      .forEach((customInput) =>
        this.editCustomInputsArray.push(this.createCustomInputGroup(customInput.order, customInput)),
      );
    this.editModalOpen.set(true);
  }

  openTemplateQuestions(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    void this.router.navigate([template.templateId, 'questions'], { relativeTo: this.route });
  }

  closeEditTemplate(): void {
    this.editTemplateForm.reset();
    this.editCustomInputsArray.clear();
    this.selectedTemplate.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedTemplate(): void {
    const template = this.selectedTemplate();
    this.editTemplateForm.markAllAsTouched();
    this.validateTemplateDates(this.editTemplateForm);
    this.validateCustomInputs(this.editCustomInputsArray);

    if (!template || this.editTemplateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    const formValue = this.editTemplateForm.getRawValue();
    this.templatesStore.updateTemplate(
      template.templateId,
      {
        nameEn: formValue.nameEn,
        nameAr: formValue.nameAr,
        description: formValue.description,
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
        customInputs: this.toUpdateCustomInputsPayload(),
      },
      () => {
        this.closeEditTemplate();
      },
    );
  }

  deleteTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    if (!template.isActive || this.templatesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchTemplates.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.templatesStore.deleteTemplate(template.templateId, () => {});
  }

  restoreTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    if (template.isActive || this.templatesStore.restoring()) {
      return;
    }

    this.templatesStore.restoreTemplate(template.templateId, () => {});
  }

  validityLabelKey(template: BranchTemplate): string {
    const now = Date.now();
    const activeFromTime = template.activeFrom ? new Date(template.activeFrom).getTime() : null;
    const expireToTime = template.expireTo ? new Date(template.expireTo).getTime() : null;

    if (expireToTime !== null && !Number.isNaN(expireToTime) && expireToTime <= now) {
      return 'branchTemplates.expired';
    }

    if (activeFromTime !== null && !Number.isNaN(activeFromTime) && activeFromTime > now) {
      return 'branchTemplates.scheduled';
    }

    if (expireToTime === null) {
      return 'branchTemplates.open';
    }

    return 'common.active';
  }

  validityBadgeClass(template: BranchTemplate): string {
    const labelKey = this.validityLabelKey(template);
    if (labelKey === 'branchTemplates.expired') {
      return 'bg-rose-50 text-rose-700';
    }
    if (labelKey === 'branchTemplates.scheduled') {
      return 'bg-amber-50 text-amber-700';
    }
    if (labelKey === 'branchTemplates.open') {
      return 'bg-cyan-50 text-[#0d94b3]';
    }
    return 'bg-emerald-50 text-emerald-700';
  }

  createdByName(template: BranchTemplate): string {
    if (!template.createdBy) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return template.createdBy.nameAr || template.createdBy.nameEn || '-';
    }

    return template.createdBy.nameEn || template.createdBy.nameAr || '-';
  }

  templateFieldError(field: TemplateFieldName): string {
    const control = this.templateForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    if (control.hasError('dateRange')) {
      return 'branchTemplates.expireToAfterActiveFrom';
    }

    return 'branchTemplates.fieldRequired';
  }

  editTemplateFieldError(field: TemplateFieldName): string {
    const control = this.editTemplateForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    if (control.hasError('dateRange')) {
      return 'branchTemplates.expireToAfterActiveFrom';
    }

    return 'branchTemplates.fieldRequired';
  }

  private requiredErrorKey(field: TemplateFieldName): string {
    const errorKeys: Record<TemplateFieldName, string> = {
      nameEn: 'branchTemplates.nameEnRequired',
      nameAr: 'branchTemplates.nameArRequired',
      description: 'branchTemplates.descriptionRequired',
      activeFrom: 'branchTemplates.activeFromRequired',
      expireTo: 'branchTemplates.fieldRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: TemplateFieldName): string {
    const errorKeys: Record<TemplateFieldName, string> = {
      nameEn: 'branchTemplates.nameEnMaxLength',
      nameAr: 'branchTemplates.nameArMaxLength',
      description: 'branchTemplates.descriptionMaxLength',
      activeFrom: 'branchTemplates.fieldRequired',
      expireTo: 'branchTemplates.fieldRequired',
    };

    return errorKeys[field];
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

  private validateCreateTemplateDates(): void {
    this.validateTemplateDates(this.templateForm);
  }

  private createCustomInputGroup(
    order: number,
    customInput: BranchTemplate['customInputs'][number] | null = null,
  ): CustomInputFormGroup {
    const type: CustomInputTypeFormValue = customInput?.type === 2 ? '2' : '1';

    return this.formBuilder.group<CustomInputFormControls>({
      customInputId: new FormControl<string | null>(customInput?.customInputId || null),
      originalType: new FormControl<CustomInputTypeFormValue | null>(customInput ? type : null),
      name: this.formBuilder.nonNullable.control(customInput?.name ?? '', [
        Validators.required,
        Validators.maxLength(100),
      ]),
      labelEn: this.formBuilder.nonNullable.control(customInput?.labelEn ?? '', [
        Validators.maxLength(200),
      ]),
      labelAr: this.formBuilder.nonNullable.control(customInput?.labelAr ?? '', [
        Validators.maxLength(200),
      ]),
      type: this.formBuilder.nonNullable.control<CustomInputTypeFormValue>(type, [
        Validators.required,
      ]),
      isRequired: this.formBuilder.nonNullable.control(customInput?.isRequired ?? true),
      minLength: new FormControl<number | null>(customInput?.minLength ?? null, [
        Validators.max(3000),
      ]),
      maxLength: new FormControl<number | null>(customInput?.maxLength ?? null, [
        Validators.max(3000),
      ]),
      minValue: new FormControl<number | null>(customInput?.minValue ?? null),
      maxValue: new FormControl<number | null>(customInput?.maxValue ?? null),
      order: this.formBuilder.nonNullable.control(customInput?.order ?? order, [
        Validators.required,
        Validators.min(1),
      ]),
    });
  }

  private validateCustomInputs(inputsArray: FormArray<CustomInputFormGroup>): void {
    const names = new Map<string, number[]>();
    const orders = new Map<number, number[]>();

    inputsArray.controls.forEach((inputGroup, index) => {
      this.clearCustomInputManualErrors(inputGroup);

      const value = inputGroup.getRawValue();
      if (value.customInputId && value.originalType && value.type !== value.originalType) {
        this.setControlError(inputGroup.controls.type, 'typeCannotBeChanged');
      }

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
      if (indexes.length <= 1) {
        return;
      }
      indexes.forEach((index) =>
        this.setControlError(inputsArray.at(index).controls.name, 'duplicatedName'),
      );
    });

    orders.forEach((indexes) => {
      if (indexes.length <= 1) {
        return;
      }
      indexes.forEach((index) =>
        this.setControlError(inputsArray.at(index).controls.order, 'duplicatedOrder'),
      );
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
        typeCannotBeChanged: _typeCannotBeChanged,
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

  private toCustomInputsPayload(): readonly CreateBranchTemplateCustomInputPayload[] {
    return this.customInputsArray.controls.map((inputGroup) => {
      const value = inputGroup.getRawValue();
      const type: 1 | 2 = Number(value.type) === 2 ? 2 : 1;

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

  private toUpdateCustomInputsPayload(): readonly UpdateBranchTemplateCustomInputPayload[] {
    return this.editCustomInputsArray.controls.map((inputGroup) => {
      const value = inputGroup.getRawValue();
      const type: 1 | 2 = Number(value.type) === 2 ? 2 : 1;

      return {
        customInputId: value.customInputId,
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

  private toNullableTrimmedText(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private capitalizeField(field: CustomInputFieldName): string {
    return `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  }

  private validateTemplateDates(form: typeof this.templateForm | typeof this.editTemplateForm): void {
    const activeFrom = form.controls.activeFrom.value;
    const expireTo = form.controls.expireTo.value;
    const expireToControl = form.controls.expireTo;

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

  private toUtcIsoDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private toDateTimeLocalValue(date: Date): string {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
