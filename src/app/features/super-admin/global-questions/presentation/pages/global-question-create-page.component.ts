import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-angular';
import {
  AnswerScaleValue,
  QuestionAnswerOption,
} from '../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import {
  CreateGlobalQuestionRequest,
  GLOBAL_QUESTION_TYPE,
  GLOBAL_QUESTION_TYPE_OPTIONS,
  GlobalQuestionListItem,
  GlobalQuestionOptionPayload,
  GlobalQuestionType,
  UpdateGlobalQuestionOptionPayload,
  UpdateGlobalQuestionRequest,
  toGlobalQuestionType,
} from '../../domain/global-question.model';
import { GlobalQuestionsStore } from '../state/global-questions.store';

type GlobalQuestionMainField = 'groupId' | 'textEn' | 'textAr' | 'type';
type GlobalQuestionOptionField = 'textEn' | 'textAr' | 'order' | 'value';

interface GlobalQuestionOptionFormControls {
  optionId: FormControl<string>;
  textEn: FormControl<string>;
  textAr: FormControl<string>;
  order: FormControl<string>;
  value: FormControl<string>;
}

interface GlobalQuestionFormControls {
  groupId: FormControl<string>;
  textEn: FormControl<string>;
  textAr: FormControl<string>;
  type: FormControl<string>;
  options: FormArray<FormGroup<GlobalQuestionOptionFormControls>>;
}

type GlobalQuestionFormGroup = FormGroup<GlobalQuestionFormControls>;
type GlobalQuestionOptionsFormArray = FormArray<FormGroup<GlobalQuestionOptionFormControls>>;
type GlobalQuestionFormValue = ReturnType<GlobalQuestionFormGroup['getRawValue']>;
type GlobalQuestionOptionFormValue = GlobalQuestionFormValue['options'][number];

@Component({
  selector: 'app-global-question-create-page',
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
  templateUrl: './global-question-create-page.component.html',
  styleUrl: './global-question-create-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalQuestionCreatePageComponent implements OnInit {
  readonly globalQuestionsStore = inject(GlobalQuestionsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly plusIcon = Plus;
  readonly questionIcon = HelpCircle;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly questionTypeOptions = GLOBAL_QUESTION_TYPE_OPTIONS;

  readonly createModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly questionPendingDelete = signal<GlobalQuestionListItem | null>(null);
  readonly selectedQuestion = signal<GlobalQuestionListItem | null>(null);
  readonly answerType = signal<GlobalQuestionType>(GLOBAL_QUESTION_TYPE.SingleChoice);
  readonly optionsError = signal('');
  readonly canViewGlobalQuestionGroups = computed(() => this.authStore.canAccessGlobalQuestionGroups());
  readonly canCreate = computed(() => this.authStore.canManageGlobalQuestions('Create'));
  readonly canDelete = computed(() => this.authStore.canManageGlobalQuestions('Delete'));
  readonly canRestore = computed(() => this.authStore.canManageGlobalQuestions('Restore'));
  readonly canUpdate = computed(() => this.authStore.canManageGlobalQuestions('Update'));
  readonly isSingleChoice = computed(() => this.answerType() === GLOBAL_QUESTION_TYPE.SingleChoice);
  readonly questionModalOpen = computed(() => this.createModalOpen() || this.editModalOpen());
  readonly questionModalTitle = computed(() =>
    this.editModalOpen() ? 'globalQuestions.updateTitle' : 'globalQuestions.createTitle',
  );
  readonly questionModalSubmitLabel = computed(() =>
    this.editModalOpen() ? 'common.save' : 'globalQuestions.createAction',
  );
  readonly questionModalSubmitIcon = computed(() =>
    this.editModalOpen() ? this.editIcon : this.plusIcon,
  );
  readonly questionModalLoading = computed(() =>
    this.editModalOpen()
      ? this.globalQuestionsStore.updating()
      : this.globalQuestionsStore.creating(),
  );

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    groupId: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly questionForm = this.createQuestionForm();

  get options(): GlobalQuestionOptionsFormArray {
    return this.questionForm.controls.options;
  }

  ngOnInit(): void {
    this.globalQuestionsStore.load();
    this.loadGroupsSelection();
  }

  searchQuestions(): void {
    const formValue = this.searchForm.getRawValue();
    this.globalQuestionsStore.search(
      formValue.searchText,
      formValue.groupId,
      this.toIsActiveFilter(formValue.isActive),
      this.toPageSize(formValue.pageSize),
      formValue.orderSort,
    );
  }

  clearQuestionSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      groupId: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    this.globalQuestionsStore.search('', '', null, 10, '');
  }

  goToPreviousQuestionsPage(): void {
    this.globalQuestionsStore.previousPage();
  }

  goToNextQuestionsPage(): void {
    this.globalQuestionsStore.nextPage();
  }

  openCreateQuestion(): void {
    if (!this.canCreate()) {
      return;
    }

    this.globalQuestionsStore.clearMessages();
    this.loadGroupsSelection();
    this.resetQuestionForm();
    this.createModalOpen.set(true);
  }

  closeCreateQuestion(): void {
    this.resetQuestionForm();
    this.createModalOpen.set(false);
  }

  createQuestion(): void {
    this.questionForm.markAllAsTouched();
    this.optionsError.set(this.validateOptions(this.answerType(), this.options));

    if (
      this.questionForm.invalid ||
      this.optionsError().length > 0 ||
      this.globalQuestionsStore.creating() ||
      this.globalQuestionsStore.groupsSelection().length === 0 ||
      !this.canCreate()
    ) {
      return;
    }

    this.globalQuestionsStore.createQuestion(this.toPayload(this.questionForm.getRawValue()), () => {
      this.closeCreateQuestion();
    });
  }

  submitQuestionModal(): void {
    if (this.editModalOpen()) {
      this.updateSelectedQuestion();
      return;
    }

    this.createQuestion();
  }

  closeQuestionModal(): void {
    if (this.editModalOpen()) {
      this.closeEditQuestion();
      return;
    }

    this.closeCreateQuestion();
  }

  openEditQuestion(event: MouseEvent, question: GlobalQuestionListItem): void {
    event.stopPropagation();
    if (!this.canEditQuestion(question) || this.globalQuestionsStore.detailsLoading()) {
      return;
    }

    this.globalQuestionsStore.clearMessages();
    this.loadGroupsSelection();
    this.globalQuestionsStore.loadQuestionDetails(question.questionId, (details) => {
      if (!this.canEditQuestion(details)) {
        return;
      }

      this.openEditQuestionForm(details);
    });
  }

  closeEditQuestion(): void {
    this.resetQuestionForm();
    this.selectedQuestion.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedQuestion(): void {
    const question = this.selectedQuestion();
    this.questionForm.markAllAsTouched();
    this.optionsError.set(this.validateOptions(this.answerType(), this.options));

    if (
      !question ||
      this.questionForm.invalid ||
      this.optionsError().length > 0 ||
      this.globalQuestionsStore.updating() ||
      !this.canEditQuestion(question)
    ) {
      return;
    }

    this.globalQuestionsStore.updateQuestion(
      question.questionId,
      this.toUpdatePayload(this.questionForm.getRawValue()),
      () => {
        this.closeEditQuestion();
      },
    );
  }

  canEditQuestion(question: GlobalQuestionListItem): boolean {
    return question.isEditable && this.canUpdate();
  }

  openDeleteQuestion(event: MouseEvent, question: GlobalQuestionListItem): void {
    event.stopPropagation();
    if (!this.canDeleteQuestion(question)) {
      return;
    }

    this.globalQuestionsStore.clearMessages();
    this.questionPendingDelete.set(question);
    this.deleteModalOpen.set(true);
  }

  closeDeleteQuestion(): void {
    this.questionPendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedQuestion(): void {
    const question = this.questionPendingDelete();
    if (
      !question ||
      this.globalQuestionsStore.deleting() ||
      !this.canDeleteQuestion(question)
    ) {
      return;
    }

    this.globalQuestionsStore.deleteQuestion(question.questionId, () => {
      this.closeDeleteQuestion();
    });
  }

  canDeleteQuestion(question: GlobalQuestionListItem): boolean {
    return question.isEditable && question.isActive && this.canDelete();
  }

  restoreQuestion(event: MouseEvent, question: GlobalQuestionListItem): void {
    event.stopPropagation();
    if (!this.canRestoreQuestion(question) || this.globalQuestionsStore.restoring()) {
      return;
    }

    this.globalQuestionsStore.clearMessages();
    this.globalQuestionsStore.restoreQuestion(question.questionId, () => undefined);
  }

  canRestoreQuestion(question: GlobalQuestionListItem): boolean {
    return question.isEditable && !question.isActive && this.canRestore();
  }

  clearForm(): void {
    this.globalQuestionsStore.clearMessages();
    this.resetQuestionForm();
  }

  reloadGroups(): void {
    this.loadGroupsSelection();
  }

  answerTypeLabel(type: GlobalQuestionType, fallbackTypeName = ''): string {
    const labelKey = this.questionTypeOptions.find((option) => option.value === type)?.labelKey;
    return labelKey ?? fallbackTypeName;
  }

  questionDisplayText(question: { textEn: string | null; textAr?: string | null }): string {
    return this.localizedText(question.textEn, question.textAr);
  }

  questionGroupDisplayName(question: {
    groupNameEn?: string | null;
    groupNameAr?: string | null;
  }): string {
    return this.localizedText(question.groupNameEn, question.groupNameAr);
  }

  groupSelectionDisplayName(group: { nameEn: string | null; nameAr?: string | null }): string {
    return this.localizedText(group.nameEn, group.nameAr);
  }

  optionDisplayText(option: { textEn: string | null; textAr?: string | null }): string {
    return this.localizedText(option.textEn, option.textAr);
  }

  onQuestionTypeChanged(event: Event): void {
    const answerType = this.readAnswerTypeFromEvent(event);
    this.answerType.set(answerType);
    this.syncOptionsState(answerType);
    this.optionsError.set('');
  }

  addOption(): void {
    this.options.push(this.createOptionForm(this.options.length + 1));
    this.optionsError.set('');
  }

  removeOption(index: number): void {
    if (!this.canRemoveOption()) {
      return;
    }

    this.options.removeAt(index);
    this.optionsError.set('');
  }

  canRemoveOption(): boolean {
    return this.options.length > 1;
  }

  questionFieldError(field: GlobalQuestionMainField): string {
    const control = this.questionForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  optionFieldError(index: number, field: GlobalQuestionOptionField): string {
    const option = this.options.at(index);
    const control = option.controls[field];

    if (!control.touched || control.valid) {
      return '';
    }

    if (field === 'textEn' && control.hasError('required')) {
      return 'globalQuestions.optionTextEnRequired';
    }

    if ((field === 'textEn' || field === 'textAr') && control.hasError('maxlength')) {
      return 'globalQuestions.optionTextMaxLength';
    }

    if (field === 'order' && control.hasError('required')) {
      return 'globalQuestions.optionOrderRequired';
    }

    if (field === 'order' && control.hasError('pattern')) {
      return 'globalQuestions.optionOrderPositive';
    }

    if (field === 'value' && control.hasError('required')) {
      return 'globalQuestions.optionValueRequired';
    }

    if (field === 'value' && control.hasError('pattern')) {
      return 'globalQuestions.optionValueScaleRange';
    }

    return '';
  }

  private createQuestionForm(): GlobalQuestionFormGroup {
    return this.formBuilder.nonNullable.group({
      groupId: ['', [Validators.required]],
      textEn: ['', [Validators.required, Validators.maxLength(1000)]],
      textAr: ['', [Validators.maxLength(1000)]],
      type: [String(GLOBAL_QUESTION_TYPE.SingleChoice), [Validators.required]],
      options: this.formBuilder.array<FormGroup<GlobalQuestionOptionFormControls>>([
        this.createOptionForm(1, 'Excellent', '', 5),
        this.createOptionForm(2, 'Good', '', 4),
      ]),
    });
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

  private createOptionForm(
    order: number,
    textEn = '',
    textAr = '',
    value: AnswerScaleValue = this.toDefaultOptionValue(order),
    optionId = '',
  ): FormGroup<GlobalQuestionOptionFormControls> {
    return this.formBuilder.nonNullable.group({
      optionId: [optionId],
      textEn: [textEn, [Validators.required, Validators.maxLength(500)]],
      textAr: [textAr, [Validators.maxLength(500)]],
      order: [String(order), [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      value: [String(value), [Validators.required, Validators.pattern(/^[1-5]$/)]],
    });
  }

  private resetQuestionForm(): void {
    const groupId = this.questionForm.controls.groupId.value;
    this.questionForm.reset({
      groupId,
      textEn: '',
      textAr: '',
      type: String(GLOBAL_QUESTION_TYPE.SingleChoice),
    });
    this.options.clear();
    this.options.push(this.createOptionForm(1, 'Excellent', '', 5));
    this.options.push(this.createOptionForm(2, 'Good', '', 4));
    this.answerType.set(GLOBAL_QUESTION_TYPE.SingleChoice);
    this.syncOptionsState(GLOBAL_QUESTION_TYPE.SingleChoice);
    this.optionsError.set('');
  }

  private setQuestionOptions(options: readonly QuestionAnswerOption[]): void {
    this.options.clear();

    for (const option of options) {
      this.options.push(
        this.createOptionForm(
          option.order,
          option.textEn,
          option.textAr ?? '',
          option.value ?? this.toDefaultOptionValue(option.order),
          option.optionId,
        ),
      );
    }

    if (this.options.length === 0) {
      this.options.push(this.createOptionForm(1, 'Excellent', '', 5));
      this.options.push(this.createOptionForm(2, 'Good', '', 4));
    }
  }

  private syncOptionsState(answerType: GlobalQuestionType): void {
    if (answerType === GLOBAL_QUESTION_TYPE.SingleChoice) {
      if (this.options.length === 0) {
        this.options.push(this.createOptionForm(1, 'Excellent', '', 5));
      }
      this.options.enable();
      return;
    }

    this.options.disable();
  }

  private openEditQuestionForm(question: GlobalQuestionListItem): void {
    this.selectedQuestion.set(question);
    this.setQuestionOptions(question.options);
    this.questionForm.patchValue({
      groupId: question.groupId,
      textEn: question.textEn,
      textAr: question.textAr ?? '',
      type: String(question.type),
    });
    this.answerType.set(question.type);
    this.syncOptionsState(question.type);
    this.optionsError.set('');
    this.editModalOpen.set(true);
  }

  private fieldError(
    field: GlobalQuestionMainField,
    touched: boolean,
    valid: boolean,
    required: boolean,
  ): string {
    if (!touched || valid) {
      return '';
    }

    if (required) {
      if (field === 'groupId') {
        return 'globalQuestions.groupRequired';
      }
      if (field === 'type') {
        return 'globalQuestions.typeRequired';
      }
      return 'globalQuestions.textEnRequired';
    }

    return 'globalQuestions.textMaxLength';
  }

  private validateOptions(
    answerType: GlobalQuestionType,
    optionsControl: GlobalQuestionOptionsFormArray,
  ): string {
    if (answerType !== GLOBAL_QUESTION_TYPE.SingleChoice) {
      return '';
    }

    optionsControl.markAllAsTouched();

    if (optionsControl.length < 1) {
      return 'globalQuestions.singleChoiceOptionsRequired';
    }

    if (optionsControl.invalid) {
      return '';
    }

    const options = this.toCreateOptionPayloads(optionsControl.getRawValue());
    const normalizedText = options.map((option) => option.textEn.toLowerCase());
    const orderValues = options.map((option) => option.order);

    if (new Set(normalizedText).size !== normalizedText.length) {
      return 'globalQuestions.optionTextEnUnique';
    }

    if (new Set(orderValues).size !== orderValues.length) {
      return 'globalQuestions.optionOrderUnique';
    }

    return '';
  }

  private toPayload(value: GlobalQuestionFormValue): CreateGlobalQuestionRequest {
    const textAr = value.textAr.trim();
    const answerType = toGlobalQuestionType(value.type) ?? GLOBAL_QUESTION_TYPE.SingleChoice;

    return {
      groupId: value.groupId,
      textEn: value.textEn.trim(),
      textAr: textAr.length > 0 ? textAr : null,
      type: answerType,
      options:
        answerType === GLOBAL_QUESTION_TYPE.SingleChoice
          ? this.toCreateOptionPayloads(value.options)
          : [],
    };
  }

  private toUpdatePayload(value: GlobalQuestionFormValue): UpdateGlobalQuestionRequest {
    const textAr = value.textAr.trim();
    const answerType = toGlobalQuestionType(value.type) ?? GLOBAL_QUESTION_TYPE.SingleChoice;

    return {
      groupId: value.groupId,
      textEn: value.textEn.trim(),
      textAr: textAr.length > 0 ? textAr : null,
      type: answerType,
      options:
        answerType === GLOBAL_QUESTION_TYPE.SingleChoice
          ? this.toUpdateOptionPayloads(value.options)
          : [],
    };
  }

  private toCreateOptionPayloads(
    options: readonly GlobalQuestionOptionFormValue[],
  ): readonly GlobalQuestionOptionPayload[] {
    return options.map((option) => this.toOptionPayload(option));
  }

  private toUpdateOptionPayloads(
    options: readonly GlobalQuestionOptionFormValue[],
  ): readonly UpdateGlobalQuestionOptionPayload[] {
    return options.map((option) => {
      const optionId = option.optionId.trim();

      return {
        optionId: optionId.length > 0 ? optionId : null,
        ...this.toOptionPayload(option),
      };
    });
  }

  private toOptionPayload(option: GlobalQuestionOptionFormValue): GlobalQuestionOptionPayload {
    const textAr = option.textAr.trim();

    return {
      textEn: option.textEn.trim(),
      textAr: textAr.length > 0 ? textAr : null,
      order: Number(option.order),
      value: this.toOptionValue(option.value),
    };
  }

  private toOptionValue(value: string): AnswerScaleValue {
    const numericValue = Number(value);
    if (
      numericValue === 1 ||
      numericValue === 2 ||
      numericValue === 3 ||
      numericValue === 4 ||
      numericValue === 5
    ) {
      return numericValue;
    }

    return 1;
  }

  private toDefaultOptionValue(order: number): AnswerScaleValue {
    if (order === 1 || order === 2 || order === 3 || order === 4 || order === 5) {
      return order;
    }

    return 5;
  }

  private readAnswerTypeFromEvent(event: Event): GlobalQuestionType {
    const target = event.target;
    const value = target instanceof HTMLSelectElement ? target.value : '';
    return toGlobalQuestionType(value) ?? GLOBAL_QUESTION_TYPE.SingleChoice;
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

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }

    return Math.min(Math.max(pageSize, 1), 100);
  }

  private loadGroupsSelection(): void {
    if (!this.canViewGlobalQuestionGroups()) {
      return;
    }

    this.globalQuestionsStore.loadGroupsSelection();
  }
}
