import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  FileAudio,
  FileText,
  ListChecks,
  MessageSquareText,
  Pencil,
  Save,
  Trash2,
  X,
  Plus,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  isSingleChoiceAnswerType,
  QuestionAnswerOption,
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { QuestionAnswerPreviewComponent } from '../../../../../shared/ui/question-answer-preview/question-answer-preview.component';
import {
  BranchSurveyResponseCustomInputPreview,
  BranchSurveyResponseListItem,
} from '../../../dashboard/domain/branch-dashboard.model';
import { BranchResponseDetailsModalComponent } from '../../../dashboard/presentation/components/branch-response-details-modal.component';
import { BranchResponsesHistoryStore } from '../../../dashboard/presentation/state/branch-responses-history.store';
import {
  BranchTemplateQuestionTreeComponent,
  BranchTemplateQuestionTreeItem,
} from '../components/branch-template-question-tree.component';
import {
  BranchTemplate,
  BranchTemplateDetailsQuestion,
  BranchTemplateQuestionGroupSelection,
  BranchTemplateQuestionSelectionItem,
} from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

type CustomInputTypeFormValue = '1' | '2';
type TemplateFieldName = 'nameEn' | 'nameAr' | 'description' | 'activeFrom' | 'expireTo';
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

interface TemplateDetailsQuestionGroupView {
  groupId: string;
  nameEn: string;
  nameAr: string;
  isGlobal: boolean;
  scopeName: string;
  questions: readonly TemplateDetailsQuestionView[];
}

interface TemplateDetailsQuestionView {
  questionId: string;
  textEn: string;
  textAr: string;
  type: string;
  scopeName: string;
  isGlobal: boolean;
  isEditable: boolean;
  isSelected: boolean;
  isActive: boolean;
  order: number | null;
  options: BranchTemplateQuestionSelectionItem['options'];
}

@Component({
  selector: 'app-branch-template-details-page',
  standalone: true,
  imports: [
    ButtonComponent,
    BranchResponseDetailsModalComponent,
    BranchTemplateQuestionTreeComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    QuestionAnswerPreviewComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-template-details-page.component.html',
  styleUrl: './branch-template-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateDetailsPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  readonly responsesStore = inject(BranchResponsesHistoryStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly arrowLeftIcon = ArrowLeft;
  readonly cancelIcon = X;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly checkedIcon = CheckCircle2;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly eyeIcon = Eye;
  readonly voiceIcon = FileAudio;
  readonly fileTextIcon = FileText;
  readonly listChecksIcon = ListChecks;
  readonly complaintIcon = MessageSquareText;
  readonly plusIcon = Plus;
  readonly saveIcon = Save;
  readonly unselectedIcon = Circle;
  readonly editMode = signal(false);
  readonly questionGroups = computed<readonly TemplateDetailsQuestionGroupView[]>(() => {
    const selectionGroups = this.templatesStore.questionsSelection()?.groups ?? [];
    if (selectionGroups.length > 0) {
      return selectionGroups.map((group) => ({
        groupId: group.groupId,
        nameEn: group.nameEn,
        nameAr: group.nameAr,
        isGlobal: group.isGlobal,
        scopeName: group.scopeName,
        questions: group.questions,
      }));
    }

    return this.toQuestionGroups(this.templatesStore.selectedTemplate()?.questions ?? []);
  });
  readonly displaySelectedQuestionsCount = computed(() =>
    this.questionGroups().reduce(
      (total, group) => total + group.questions.filter((question) => question.isSelected).length,
      0,
    ),
  );
  readonly displayTotalQuestionsCount = computed(() =>
    this.questionGroups().reduce((total, group) => total + group.questions.length, 0),
  );
  readonly activeCustomInputs = computed(() =>
    [...(this.templatesStore.selectedTemplate()?.customInputs ?? [])]
      .filter((customInput) => customInput.isActive)
      .sort((first, second) => first.order - second.order),
  );
  readonly questionTreeQuestions = computed<readonly BranchTemplateQuestionTreeItem[]>(() => {
    const selectionGroups = this.templatesStore.questionsSelection()?.groups ?? [];
    if (selectionGroups.length > 0) {
      return selectionGroups.flatMap((group) => this.toQuestionTreeItems(group));
    }

    return this.templatesStore.selectedTemplate()?.questions ?? [];
  });
  readonly questionTreeConditions = computed(
    () =>
      this.templatesStore.questionsSelection()?.questionConditions ??
      this.templatesStore.selectedTemplate()?.questionConditions ??
      [],
  );

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: ['', [Validators.required]],
    expireTo: [''],
    customInputs: this.formBuilder.array<CustomInputFormGroup>([]),
  });

  private patchedTemplateId = '';

  constructor() {
    effect(() => {
      const template = this.templatesStore.selectedTemplate();
      if (!template || template.templateId === this.patchedTemplateId) {
        return;
      }

      this.patchTemplateForm(template);
      this.patchedTemplateId = template.templateId;
    });
  }

  get customInputsArray(): FormArray<CustomInputFormGroup> {
    return this.templateForm.controls.customInputs;
  }

  private patchTemplateForm(template: BranchTemplate): void {
    this.templateForm.patchValue({
        nameEn: template.nameEn,
        nameAr: template.nameAr,
        description: template.description,
        activeFrom: template.activeFrom
          ? this.toDateTimeLocalValue(new Date(template.activeFrom))
          : this.toDateTimeLocalValue(new Date()),
        expireTo: template.expireTo ? this.toDateTimeLocalValue(new Date(template.expireTo)) : '',
      });
    this.customInputsArray.clear();
    [...template.customInputs]
      .filter((customInput) => customInput.isActive)
      .sort((first, second) => first.order - second.order)
      .forEach((customInput) =>
        this.customInputsArray.push(this.createCustomInputGroup(customInput.order, customInput)),
      );
  }

  ngOnInit(): void {
    const templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
    if (templateId.length === 0) {
      this.templatesStore.clearDetails();
      return;
    }

    this.templatesStore.loadDetails(templateId);
    this.templatesStore.loadQuestionsSelection(templateId);
    this.responsesStore.load({ templateId, pageNumber: 1, pageSize: 10 });
  }

  goBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    const template = this.templatesStore.selectedTemplate();
    if (template) {
      this.patchTemplateForm(template);
    }
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const template = this.templatesStore.selectedTemplate();
    if (template) {
      this.patchTemplateForm(template);
    }
    this.editMode.set(false);
  }

  updateTemplate(): void {
    const template = this.templatesStore.selectedTemplate();
    this.templateForm.markAllAsTouched();
    this.validateTemplateDates();
    this.validateCustomInputs();

    if (!template || this.templateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.templatesStore.updateTemplate(template.templateId, {
      nameEn: formValue.nameEn,
      nameAr: formValue.nameAr,
      description: formValue.description,
      activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
      expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
      customInputs: this.toUpdateCustomInputsPayload(),
    }, () => {
      this.editMode.set(false);
    });
  }

  addCustomInput(): void {
    this.customInputsArray.push(this.createCustomInputGroup(this.customInputsArray.length + 1));
  }

  removeCustomInput(index: number): void {
    this.customInputsArray.removeAt(index);
    this.validateCustomInputs();
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

    this.validateCustomInputs();
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

    if (control.hasError('typeCannotBeChanged')) {
      return 'branchTemplates.customInputTypeCannotBeChanged';
    }

    if (control.hasError('stringValidation') || control.hasError('max')) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }

    if (control.hasError('integerValidation')) {
      return 'branchTemplates.customInputIntegerValidationInvalid';
    }

    return 'branchTemplates.fieldRequired';
  }

  deleteTemplate(): void {
    const template = this.templatesStore.selectedTemplate();
    if (!template || this.templatesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchTemplates.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.templatesStore.deleteTemplate(template.templateId, () => {
      void this.router.navigateByUrl('/branch-admin/templates');
    });
  }

  openQuestionsManager(): void {
    const template = this.templatesStore.selectedTemplate();
    if (!template) {
      return;
    }

    void this.router.navigate(['/branch-admin/templates', template.templateId, 'questions']);
  }

  changeResponsesPage(pageNumber: number): void {
    this.responsesStore.goToPage(pageNumber);
  }

  openResponseDetails(row: BranchSurveyResponseListItem): void {
    this.responsesStore.loadResponseDetails(row.surveyResponseId);
  }

  answerTypeLabel(type: QuestionAnswerTypeInput): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return typeof type === 'string' || typeof type === 'number' ? String(type) : '-';
  }

  isSingleChoiceQuestion(question: TemplateDetailsQuestionView): boolean {
    return isSingleChoiceAnswerType(question.type);
  }

  activeOptions(question: TemplateDetailsQuestionView): readonly QuestionAnswerOption[] {
    return [...question.options]
      .filter((option) => option.isActive)
      .sort((first, second) => first.order - second.order);
  }

  scoreStatus(row: BranchSurveyResponseListItem): 'Healthy' | 'Neutral' | 'Critical' | 'Not Scored' {
    if (!row.isScored) {
      return 'Not Scored';
    }
    if (row.scorePercentage >= 80) {
      return 'Healthy';
    }
    if (row.scorePercentage >= 60) {
      return 'Neutral';
    }
    return 'Critical';
  }

  scoreLabel(row: BranchSurveyResponseListItem): string {
    return row.isScored
      ? `${row.scorePercentage.toFixed(1)}%`
      : this.i18n.translate('branchResponsesHistory.notScored');
  }

  booleanLabel(value: boolean): string {
    return this.i18n.translate(value ? 'branchResponsesHistory.yes' : 'branchResponsesHistory.no');
  }

  customInputLabel(input: BranchSurveyResponseCustomInputPreview): string {
    return `${input.name}: ${input.value || '-'}`;
  }

  operatorName(row: BranchSurveyResponseListItem): string {
    return this.localized(row.operatorNameEn, row.operatorNameAr);
  }

  responsesPageStart(): number {
    const pagination = this.responsesStore.responses();
    if (!pagination || pagination.totalItems === 0) {
      return 0;
    }

    return (pagination.currentPage - 1) * pagination.pageSize + 1;
  }

  responsesPageEnd(): number {
    const pagination = this.responsesStore.responses();
    if (!pagination) {
      return 0;
    }

    return Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
  }

  customInputTypeLabel(type: BranchTemplate['customInputs'][number]['type']): string {
    return type === 2
      ? this.i18n.translate('branchTemplates.customInputTypeInteger')
      : this.i18n.translate('branchTemplates.customInputTypeString');
  }

  customInputValidationLabel(customInput: BranchTemplate['customInputs'][number]): string {
    if (customInput.type === 1) {
      const minLength = customInput.minLength ?? '-';
      const maxLength = customInput.maxLength ?? '-';
      return `${this.i18n.translate('branchTemplates.customInputMinLength')}: ${minLength} / ${this.i18n.translate('branchTemplates.customInputMaxLength')}: ${maxLength}`;
    }

    const minValue = customInput.minValue ?? '-';
    const maxValue = customInput.maxValue ?? '-';
    return `${this.i18n.translate('branchTemplates.customInputMinValue')}: ${minValue} / ${this.i18n.translate('branchTemplates.customInputMaxValue')}: ${maxValue}`;
  }

  optionPrimaryText(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    if (isArabic && option.textAr) {
      return option.textAr;
    }

    return option.textEn || option.textAr || '-';
  }

  optionSecondaryText(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    if (isArabic) {
      return option.textEn;
    }

    return option.textAr ?? '';
  }

  private toQuestionTreeItems(
    group: BranchTemplateQuestionGroupSelection,
  ): readonly BranchTemplateQuestionTreeItem[] {
    return group.questions
      .filter(
        (
          question,
        ): question is BranchTemplateQuestionSelectionItem & { templateQuestionId: string } =>
          question.isSelected &&
          question.isActive &&
          question.templateQuestionId !== null &&
          question.templateQuestionId.length > 0,
      )
      .map((question) => ({
        templateQuestionId: question.templateQuestionId,
        questionId: question.questionId,
        textEn: question.textEn,
        textAr: question.textAr,
        type: question.type,
        typeName: question.typeName,
        groupNameEn: group.nameEn,
        groupNameAr: group.nameAr,
        order: question.order,
        options: question.options,
      }));
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
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

  private toQuestionGroups(
    questions: readonly BranchTemplateDetailsQuestion[],
  ): readonly TemplateDetailsQuestionGroupView[] {
    const groupsById = new Map<string, TemplateDetailsQuestionGroupView>();

    for (const question of questions) {
      const groupId = question.groupId || 'ungrouped';
      const currentGroup = groupsById.get(groupId);
      const nextQuestion: TemplateDetailsQuestionView = {
        questionId: question.questionId,
        textEn: question.textEn,
        textAr: question.textAr,
        type: question.type,
        scopeName: question.scopeName,
        isGlobal: question.isGlobal,
        isEditable: question.isEditable,
        isSelected: true,
        isActive: question.isActive,
        order: question.order,
        options: question.options,
      };

      if (currentGroup) {
        groupsById.set(groupId, {
          ...currentGroup,
          questions: [...currentGroup.questions, nextQuestion],
        });
        continue;
      }

      groupsById.set(groupId, {
        groupId,
        nameEn: question.groupNameEn,
        nameAr: question.groupNameAr,
        isGlobal: question.isGlobal,
        scopeName: question.scopeName,
        questions: [nextQuestion],
      });
    }

    return [...groupsById.values()];
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

  private validateCustomInputs(): void {
    const names = new Map<string, number[]>();
    const orders = new Map<number, number[]>();

    this.customInputsArray.controls.forEach((inputGroup, index) => {
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
        this.setControlError(this.customInputsArray.at(index).controls.name, 'duplicatedName'),
      );
    });

    orders.forEach((indexes) => {
      if (indexes.length <= 1) {
        return;
      }
      indexes.forEach((index) =>
        this.setControlError(this.customInputsArray.at(index).controls.order, 'duplicatedOrder'),
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

  private toUpdateCustomInputsPayload() {
    return this.customInputsArray.controls.map((inputGroup) => {
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

  private toUtcIsoDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private toDateTimeLocalValue(date: Date): string {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}
