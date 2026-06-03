import { DOCUMENT, DatePipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  ArrowLeft,
  Copy,
  Download,
  Edit,
  FileText,
  GitBranch,
  ListChecks,
  MessageSquareText,
  Plus,
  QrCode,
  Trash2,
  Calendar,
  Clock,
  Activity,
  Building2,
} from 'lucide-angular';
import { AuthStore } from '../../../auth/presentation/state/auth.store';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  AnonymousTemplate,
  AnonymousTemplateCustomInputType,
  AnonymousTemplateQuestion,
  AnonymousTemplateQuestionCondition,
  UpdateAnonymousTemplateCustomInputPayload,
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

interface ConditionView {
  condition: AnonymousTemplateQuestionCondition;
  parent: AnonymousTemplateQuestion | null;
  child: AnonymousTemplateQuestion | null;
}

@Component({
  selector: 'app-anonymous-template-details-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './anonymous-template-details-page.component.html',
  styleUrl: './anonymous-template-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateDetailsPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly copyIcon = Copy;
  readonly downloadIcon = Download;
  readonly editIcon = Edit;
  readonly fileTextIcon = FileText;
  readonly flowIcon = GitBranch;
  readonly listChecksIcon = ListChecks;
  readonly responsesIcon = MessageSquareText;
  readonly plusIcon = Plus;
  readonly qrCodeIcon = QrCode;
  readonly deleteIcon = Trash2;
  readonly calendarIcon = Calendar;
  readonly clockIcon = Clock;
  readonly activityIcon = Activity;
  readonly buildingIcon = Building2;
  readonly copiedPublicUrl = signal(false);
  readonly editModalOpen = signal(false);
  private readonly openEditFromRoute = signal(false);
  readonly canUpdate = computed(() => this.authStore.canManageAnonymousTemplates('Update'));
  readonly canAssignQuestions = computed(() =>
    this.authStore.canManageAnonymousTemplates('AssignQuestions'),
  );
  readonly canManageQuestionConditions = computed(() =>
    this.authStore.canManageAnonymousTemplates('ManageQuestionConditions'),
  );
  readonly canViewResponses = computed(() =>
    this.authStore.canManageAnonymousTemplates('ViewResponses'),
  );

  readonly editForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    activeFrom: ['', [Validators.required]],
    expireTo: [''],
    customInputs: this.formBuilder.array<CustomInputFormGroup>([]),
  });

  readonly conditionViews = computed<readonly ConditionView[]>(() => {
    const template = this.anonymousTemplatesStore.selectedTemplate();
    if (!template) {
      return [];
    }

    const questionsByInstanceId = new Map(
      template.questions.map((question) => [question.anonymousTemplateQuestionId, question]),
    );

    return template.questionConditions.map((condition) => ({
      condition,
      parent: questionsByInstanceId.get(condition.parentAnonymousTemplateQuestionId) ?? null,
      child: questionsByInstanceId.get(condition.childAnonymousTemplateQuestionId) ?? null,
    }));
  });

  readonly conditionViewsByParent = computed<ReadonlyMap<string, readonly ConditionView[]>>(() => {
    const groupedConditions = new Map<string, ConditionView[]>();

    this.conditionViews().forEach((conditionView) => {
      const parentId = conditionView.condition.parentAnonymousTemplateQuestionId;
      groupedConditions.set(parentId, [...(groupedConditions.get(parentId) ?? []), conditionView]);
    });

    return groupedConditions;
  });

  readonly orphanConditionViews = computed<readonly ConditionView[]>(() =>
    this.conditionViews().filter((conditionView) => conditionView.parent === null),
  );

  private readonly openRequestedEditModal = effect(() => {
    if (!this.openEditFromRoute() || this.editModalOpen()) {
      return;
    }

    const template = this.anonymousTemplatesStore.selectedTemplate();
    if (!template || !this.canUpdateTemplate(template)) {
      return;
    }

    this.openEditFromRoute.set(false);
    this.openEditTemplate(template);
  });

  ngOnInit(): void {
    const anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
    if (anonymousTemplateId.length === 0) {
      this.anonymousTemplatesStore.clearDetails();
      return;
    }

    this.openEditFromRoute.set(this.route.snapshot.queryParamMap.get('edit') === 'true');
    this.anonymousTemplatesStore.loadDetails(anonymousTemplateId);
  }

  get customInputsArray(): FormArray<CustomInputFormGroup> {
    return this.editForm.controls.customInputs;
  }

  goBack(): void {
    this.location.back();
  }

  openEditTemplate(template: AnonymousTemplate): void {
    if (!this.canUpdateTemplate(template)) {
      return;
    }

    this.populateEditForm(template);
    this.anonymousTemplatesStore.clearMessages();
    this.editModalOpen.set(true);
  }

  closeEditTemplate(): void {
    this.editModalOpen.set(false);
    this.resetEditForm();
  }

  updateTemplate(template: AnonymousTemplate): void {
    this.editForm.markAllAsTouched();
    this.validateTemplateDates();
    this.validateCustomInputs();

    if (this.editForm.invalid || this.anonymousTemplatesStore.updating()) {
      return;
    }

    const formValue = this.editForm.getRawValue();
    this.anonymousTemplatesStore.updateTemplate(
      template.anonymousTemplateId,
      {
        nameEn: formValue.nameEn.trim(),
        nameAr: this.toNullableTrimmedText(formValue.nameAr),
        description: this.toNullableTrimmedText(formValue.description),
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
        customInputs: this.toCustomInputsPayload(),
      },
      () => {
        this.editModalOpen.set(false);
        this.resetEditForm();
      },
    );
  }

  addCustomInput(): void {
    this.customInputsArray.push(
      this.createCustomInputGroup({
        customInputId: null,
        name: '',
        labelEn: '',
        labelAr: '',
        type: 1,
        isRequired: true,
        minLength: null,
        maxLength: null,
        minValue: null,
        maxValue: null,
        order: this.customInputsArray.length + 1,
      }),
    );
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

  hasExistingCustomInput(inputGroup: CustomInputFormGroup): boolean {
    return inputGroup.controls.customInputId.value !== null;
  }

  canUpdateTemplate(template: AnonymousTemplate): boolean {
    if (!this.canUpdate() || !template.isActive) {
      return false;
    }

    if (this.authStore.role() === 'SUPER_ADMIN') {
      return template.isGlobal;
    }

    if (this.authStore.role() === 'BRANCH_ADMIN' || this.authStore.hasApiRole('Template Editor')) {
      return !template.isGlobal;
    }

    return this.authStore.hasPermission('AnonymousTemplates.Update');
  }

  canManageQuestions(template: AnonymousTemplate): boolean {
    if (
      (!this.canAssignQuestions() && !this.canManageQuestionConditions()) ||
      !template.isActive
    ) {
      return false;
    }

    if (this.authStore.role() === 'SUPER_ADMIN') {
      return template.isGlobal;
    }

    if (this.authStore.role() === 'BRANCH_ADMIN' || this.authStore.hasApiRole('Template Editor')) {
      return !template.isGlobal;
    }

    return (
      this.authStore.hasPermission('AnonymousTemplates.AssignQuestions') ||
      this.authStore.hasPermission('AnonymousTemplates.ManageQuestionConditions')
    );
  }

  canViewTemplateResponses(template: AnonymousTemplate): boolean {
    if (!this.canViewResponses()) {
      return false;
    }

    if (this.authStore.role() === 'SUPER_ADMIN') {
      return template.isGlobal;
    }

    if (this.authStore.role() === 'BRANCH_ADMIN' || this.authStore.hasApiRole('Template Editor')) {
      return !template.isGlobal;
    }

    return this.authStore.hasPermission('AnonymousTemplates.ViewResponses');
  }

  templateFieldError(field: AnonymousTemplateFieldName): string {
    const control = this.editForm.controls[field];
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

    if (control.hasError('typeChanged')) {
      return 'anonymousTemplates.customInputTypeCannotBeChanged';
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
    }
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

  templateDisplayName(template: { nameEn: string | null; nameAr: string | null }): string {
    return this.localizedText(template.nameEn, template.nameAr);
  }

  branchDisplayName(template: { branchNameEn: string | null; branchNameAr: string | null }): string {
    return this.localizedText(template.branchNameEn, template.branchNameAr);
  }

  customInputDisplayLabel(input: {
    labelEn: string | null;
    labelAr: string | null;
    name: string;
  }): string {
    return this.localizedText(input.labelEn ?? input.name, input.labelAr, input.name);
  }

  customInputValidationText(input: {
    type: AnonymousTemplateCustomInputType;
    minLength: number | null;
    maxLength: number | null;
    minValue: number | null;
    maxValue: number | null;
  }): string {
    const validationParts: string[] = [];

    if (input.type === 1) {
      if (input.minLength !== null) {
        validationParts.push(
          `${this.i18n.translate('branchTemplates.customInputMinLength')}: ${input.minLength}`,
        );
      }
      if (input.maxLength !== null) {
        validationParts.push(
          `${this.i18n.translate('branchTemplates.customInputMaxLength')}: ${input.maxLength}`,
        );
      }
    } else {
      if (input.minValue !== null) {
        validationParts.push(
          `${this.i18n.translate('branchTemplates.customInputMinValue')}: ${input.minValue}`,
        );
      }
      if (input.maxValue !== null) {
        validationParts.push(
          `${this.i18n.translate('branchTemplates.customInputMaxValue')}: ${input.maxValue}`,
        );
      }
    }

    return validationParts.length > 0
      ? validationParts.join(' / ')
      : this.i18n.translate('anonymousTemplates.noValidationLimits');
  }

  customInputTypeDisplayName(typeName: string): string {
    const normalizedTypeName = typeName.trim().toLowerCase();

    if (normalizedTypeName === 'integer') {
      return this.i18n.language() === 'ar' ? 'رقم صحيح' : 'Integer';
    }

    if (normalizedTypeName === 'string') {
      return this.i18n.language() === 'ar' ? 'نص' : 'Text';
    }

    return typeName || '-';
  }

  questionDisplayText(question: { textEn: string | null; textAr?: string | null }): string {
    return this.localizedText(question.textEn, question.textAr);
  }

  questionTypeDisplayName(typeName: string): string {
    const normalizedTypeName = typeName.trim().toLowerCase();
    const isArabic = this.i18n.language() === 'ar';

    if (normalizedTypeName === 'singlechoice' || normalizedTypeName === 'single choice') {
      return isArabic ? 'اختيار واحد' : 'Single choice';
    }

    if (normalizedTypeName === 'singlechoiceoption' || normalizedTypeName === 'single choice option') {
      return isArabic ? 'اختيار محدد' : 'Selected option';
    }

    if (normalizedTypeName === 'multichoice' || normalizedTypeName === 'multi choice') {
      return isArabic ? 'اختيار متعدد' : 'Multi choice';
    }

    if (normalizedTypeName === 'freetext' || normalizedTypeName === 'free text') {
      return isArabic ? 'إجابة نصية' : 'Free text';
    }

    if (normalizedTypeName === 'smiles') {
      return isArabic ? 'تقييم بالوجوه' : 'Smiles';
    }

    if (normalizedTypeName === 'stars' || normalizedTypeName === 'starrating') {
      return isArabic ? 'تقييم بالنجوم' : 'Star rating';
    }

    return typeName || '-';
  }

  questionGroupDisplayName(question: {
    groupNameEn: string | null;
    groupNameAr?: string | null;
  }): string {
    return this.localizedText(question.groupNameEn, question.groupNameAr);
  }

  optionDisplayText(option: { textEn: string | null; textAr?: string | null }): string {
    return this.localizedText(option.textEn, option.textAr);
  }

  conditionsForQuestion(question: AnonymousTemplateQuestion): readonly ConditionView[] {
    return this.conditionViewsByParent().get(question.anonymousTemplateQuestionId) ?? [];
  }

  conditionQuestionDisplayText(
    question: AnonymousTemplateQuestion | null,
    _fallbackId: string,
  ): string {
    return question ? this.questionDisplayText(question) : '-';
  }

  conditionTriggerDisplay(conditionView: ConditionView): string {
    const triggerType = this.questionTypeDisplayName(conditionView.condition.triggerTypeName);
    const selectedOption = conditionView.parent?.options.find(
      (option) => option.optionId === conditionView.condition.selectedQuestionOptionId,
    );
    const selectedOptionText = selectedOption ? this.optionDisplayText(selectedOption) : '';
    const selectedOptionValue =
      selectedOption?.value ?? conditionView.condition.triggerValue ?? null;

    if (selectedOptionText.length > 0 && selectedOptionValue !== null) {
      return `${triggerType} - ${selectedOptionText} - ${this.i18n.translate('anonymousTemplates.value')} ${selectedOptionValue}`;
    }

    if (selectedOptionText.length > 0) {
      return `${triggerType} - ${selectedOptionText}`;
    }

    if (selectedOptionValue !== null) {
      return `${triggerType} - ${this.i18n.translate('anonymousTemplates.value')} ${selectedOptionValue}`;
    }

    return triggerType;
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

  private populateEditForm(template: AnonymousTemplate): void {
    this.editForm.reset({
      nameEn: template.nameEn,
      nameAr: template.nameAr ?? '',
      description: template.description ?? '',
      activeFrom: this.toDateTimeLocalValue(template.activeFrom),
      expireTo: template.expireTo ? this.toDateTimeLocalValue(template.expireTo) : '',
    });
    this.customInputsArray.clear();
    template.customInputs.forEach((customInput) => {
      this.customInputsArray.push(
        this.createCustomInputGroup({
          customInputId: customInput.customInputId,
          name: customInput.name,
          labelEn: customInput.labelEn ?? '',
          labelAr: customInput.labelAr ?? '',
          type: customInput.type,
          isRequired: customInput.isRequired,
          minLength: customInput.minLength,
          maxLength: customInput.maxLength,
          minValue: customInput.minValue,
          maxValue: customInput.maxValue,
          order: customInput.order,
        }),
      );
    });
  }

  private resetEditForm(): void {
    this.editForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: '',
      expireTo: '',
    });
    this.customInputsArray.clear();
  }

  private createCustomInputGroup(value: {
    customInputId: string | null;
    name: string;
    labelEn: string;
    labelAr: string;
    type: AnonymousTemplateCustomInputType;
    isRequired: boolean;
    minLength: number | null;
    maxLength: number | null;
    minValue: number | null;
    maxValue: number | null;
    order: number;
  }): CustomInputFormGroup {
    const type = String(value.type) === '2' ? '2' : '1';
    const group = this.formBuilder.group<CustomInputFormControls>({
      customInputId: new FormControl<string | null>(value.customInputId),
      originalType: new FormControl<CustomInputTypeFormValue | null>(
        value.customInputId ? type : null,
      ),
      name: this.formBuilder.nonNullable.control(value.name, [
        Validators.required,
        Validators.maxLength(100),
      ]),
      labelEn: this.formBuilder.nonNullable.control(value.labelEn, [Validators.maxLength(200)]),
      labelAr: this.formBuilder.nonNullable.control(value.labelAr, [Validators.maxLength(200)]),
      type: this.formBuilder.nonNullable.control<CustomInputTypeFormValue>(type, [
        Validators.required,
      ]),
      isRequired: this.formBuilder.nonNullable.control(value.isRequired),
      minLength: new FormControl<number | null>(value.minLength, [Validators.max(3000)]),
      maxLength: new FormControl<number | null>(value.maxLength, [Validators.max(3000)]),
      minValue: new FormControl<number | null>(value.minValue),
      maxValue: new FormControl<number | null>(value.maxValue),
      order: this.formBuilder.nonNullable.control(value.order, [
        Validators.required,
        Validators.min(1),
      ]),
    });

    if (value.customInputId) {
      group.controls.type.disable({ emitEvent: false });
    }

    return group;
  }

  private validateCustomInputs(): void {
    const names = new Map<string, number[]>();
    const orders = new Map<number, number[]>();
    const ids = new Map<string, number[]>();

    this.customInputsArray.controls.forEach((inputGroup, index) => {
      this.clearCustomInputManualErrors(inputGroup);

      const value = inputGroup.getRawValue();
      const name = value.name.trim().toLowerCase();
      if (name.length === 0) {
        this.setControlError(inputGroup.controls.name, 'required');
      } else {
        names.set(name, [...(names.get(name) ?? []), index]);
      }

      if (value.customInputId) {
        ids.set(value.customInputId, [...(ids.get(value.customInputId) ?? []), index]);
      }

      if (!Number.isInteger(value.order) || value.order <= 0) {
        this.setControlError(inputGroup.controls.order, 'invalidOrder');
      } else {
        orders.set(value.order, [...(orders.get(value.order) ?? []), index]);
      }

      if (value.originalType !== null && value.originalType !== value.type) {
        this.setControlError(inputGroup.controls.type, 'typeChanged');
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

    ids.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((index) =>
          this.setControlError(this.customInputsArray.at(index).controls.name, 'duplicatedName'),
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
        typeChanged: _typeChanged,
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

  private toCustomInputsPayload(): readonly UpdateAnonymousTemplateCustomInputPayload[] {
    return this.customInputsArray.controls.map((inputGroup) => {
      const value = inputGroup.getRawValue();
      const type: AnonymousTemplateCustomInputType = Number(value.type) === 2 ? 2 : 1;

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

  private validateTemplateDates(): void {
    const activeFrom = this.editForm.controls.activeFrom.value;
    const expireTo = this.editForm.controls.expireTo.value;
    const expireToControl = this.editForm.controls.expireTo;

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

  private toNullableTrimmedText(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private capitalizeField(field: CustomInputFieldName): string {
    return `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  }

  private toUtcIsoDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private toDateTimeLocalValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
