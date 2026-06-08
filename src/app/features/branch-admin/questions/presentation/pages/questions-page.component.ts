import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import {
  QUESTION_ANSWER_TYPE,
  QUESTION_ANSWER_TYPE_LABEL_KEYS,
  AnswerScaleValue,
  QuestionAnswerOption,
  QuestionAnswerOptionPayload,
  QuestionAnswerType,
  QuestionAnswerTypeInput,
  SMILE_LEVELS,
  UpdateQuestionAnswerOptionPayload,
  isSingleChoiceAnswerType,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../../../shared/models/question-answer.model';
import {
  DEFAULT_SINGLE_CHOICE_OPTIONS,
  DefaultQuestionAnswerOption,
} from '../../../../../shared/models/default-question-options.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { BackButtonComponent } from '../../../../../shared/ui/back-button/back-button.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  CreateQuestionRequest,
  QuestionListItem,
  QuestionTypeOption,
  UpdateQuestionRequest,
} from '../../domain/question.model';
import {
  QuestionAnswerAccordionItem,
  QuestionAnswersAccordionComponent,
} from '../components/question-answers-accordion.component';
import { QuestionsStore } from '../state/questions.store';

const QUESTION_TYPE_OPTIONS: readonly QuestionTypeOption[] = [
  {
    value: QUESTION_ANSWER_TYPE.SingleChoice,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.SingleChoice],
  },
  {
    value: QUESTION_ANSWER_TYPE.Voice,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.Voice],
  },
  {
    value: QUESTION_ANSWER_TYPE.StarRating,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.StarRating],
  },
  {
    value: QUESTION_ANSWER_TYPE.Complain,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.Complain],
  },
  {
    value: QUESTION_ANSWER_TYPE.Smiles,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.Smiles],
  },
  {
    value: QUESTION_ANSWER_TYPE.Image,
    labelKey: QUESTION_ANSWER_TYPE_LABEL_KEYS[QUESTION_ANSWER_TYPE.Image],
  },
];

type QuestionMainField = 'groupId' | 'textEn' | 'textAr' | 'type';
type QuestionOptionField = 'textEn' | 'textAr' | 'order' | 'value';

interface QuestionOptionFormControls {
  optionId: FormControl<string>;
  textEn: FormControl<string>;
  textAr: FormControl<string>;
  order: FormControl<string>;
  value: FormControl<string>;
}

interface QuestionFormControls {
  groupId: FormControl<string>;
  textEn: FormControl<string>;
  textAr: FormControl<string>;
  type: FormControl<string>;
  options: FormArray<FormGroup<QuestionOptionFormControls>>;
}

type QuestionFormGroup = FormGroup<QuestionFormControls>;
type QuestionOptionsFormArray = FormArray<FormGroup<QuestionOptionFormControls>>;
type QuestionFormValue = ReturnType<QuestionFormGroup['getRawValue']>;
type QuestionOptionFormValue = QuestionFormValue['options'][number];

@Component({
  selector: 'app-questions-page',
  standalone: true,
  imports: [
    ButtonComponent,
    BackButtonComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    QuestionAnswersAccordionComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './questions-page.component.html',
  styleUrl: './questions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsPageComponent implements OnInit {
  readonly questionsStore = inject(QuestionsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  private readonly scoreValues: readonly AnswerScaleValue[] = [1, 2, 3, 4, 5];

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly plusIcon = Plus;
  readonly questionIcon = HelpCircle;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;
  readonly advancedFiltersOpen = signal(true);
  readonly scopedGroupId = signal<string | null>(null);
  readonly questionTypeOptions = QUESTION_TYPE_OPTIONS;

  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly selectedQuestion = signal<QuestionListItem | null>(null);
  readonly questionPendingDelete = signal<QuestionListItem | null>(null);
  readonly createAnswerType = signal<QuestionAnswerType>(QUESTION_ANSWER_TYPE.SingleChoice);
  readonly editAnswerType = signal<QuestionAnswerType>(QUESTION_ANSWER_TYPE.SingleChoice);
  readonly createOptionsError = signal('');
  readonly editOptionsError = signal('');

  readonly canCreate = computed(() => this.authStore.canManageQuestions('Create'));
  readonly canUpdate = computed(() => this.authStore.canManageQuestions('Update'));
  readonly canDelete = computed(() => this.authStore.canManageQuestions('Delete'));
  readonly canRestore = computed(() => this.authStore.canManageQuestions('Update'));
  readonly createIsSingleChoice = computed(
    () => this.createAnswerType() === QUESTION_ANSWER_TYPE.SingleChoice,
  );
  readonly editIsSingleChoice = computed(
    () => this.editAnswerType() === QUESTION_ANSWER_TYPE.SingleChoice,
  );
  readonly createIsImage = computed(() => this.createAnswerType() === QUESTION_ANSWER_TYPE.Image);
  readonly editIsImage = computed(() => this.editAnswerType() === QUESTION_ANSWER_TYPE.Image);
  readonly isGroupScoped = computed(() => this.scopedGroupId() !== null);
  readonly canSubmitQuestionForm = computed(
    () => this.isGroupScoped() || this.questionsStore.groupsSelection().length > 0,
  );
  readonly selectedGroupLabel = computed(() => {
    const scopedGroupId = this.scopedGroupId();
    if (!scopedGroupId) {
      return '';
    }

    const group = this.questionsStore.groupsSelection().find((item) => item.id === scopedGroupId);
    if (group) {
      return this.localizedText(group.nameEn, group.nameAr ?? '', this.i18n.language() === 'ar');
    }

    const question = this.questionsStore.questions().find((item) => item.groupId === scopedGroupId);
    if (question) {
      if (!question.groupNameEn && !question.groupNameAr) {
        return scopedGroupId;
      }

      return this.localizedText(
        question.groupNameEn,
        question.groupNameAr ?? '',
        this.i18n.language() === 'ar',
      );
    }

    return scopedGroupId;
  });

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly questionForm = this.createQuestionForm();
  readonly editQuestionForm = this.createQuestionForm();

  get createOptions(): QuestionOptionsFormArray {
    return this.questionForm.controls.options;
  }

  get editOptions(): QuestionOptionsFormArray {
    return this.editQuestionForm.controls.options;
  }

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    if (groupId) {
      this.scopedGroupId.set(groupId);
      this.questionsStore.loadForGroup(groupId);
      this.questionsStore.loadGroupsSelection();
      return;
    }

    this.questionsStore.load();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  openCreateQuestion(): void {
    if (!this.canCreate()) {
      return;
    }

    this.questionsStore.clearMessages();
    if (!this.isGroupScoped()) {
      this.questionsStore.loadGroupsSelection();
    }
    this.resetCreateQuestionForm();
    this.createModalOpen.set(true);
  }

  closeCreateQuestion(): void {
    this.resetCreateQuestionForm();
    this.createModalOpen.set(false);
  }

  createQuestion(): void {
    this.questionForm.markAllAsTouched();
    this.applyScopedGroupToForm(this.questionForm);
    this.createOptionsError.set(this.validateOptions(this.createAnswerType(), this.createOptions));

    if (
      this.questionForm.invalid ||
      this.createOptionsError().length > 0 ||
      this.questionsStore.creating() ||
      !this.canCreate()
    ) {
      return;
    }

    this.questionsStore.createQuestion(this.toCreatePayload(this.questionForm.getRawValue()), () => {
      this.closeCreateQuestion();
    });
  }

  openEditQuestion(event: MouseEvent, question: QuestionListItem): void {
    event.stopPropagation();
    if (!this.canEditQuestion(question)) {
      return;
    }

    this.questionsStore.clearMessages();
    if (!this.isGroupScoped()) {
      this.questionsStore.loadGroupsSelection();
    }
    this.selectedQuestion.set(question);
    this.setQuestionOptions(this.editOptions, question.options);
    this.editQuestionForm.patchValue({
      groupId: question.groupId,
      textEn: question.textEn,
      textAr: question.textAr ?? '',
      type: String(question.type || 1),
    });
    this.editAnswerType.set(question.type);
    this.syncOptionsState(this.editOptions, question.type);
    this.editOptionsError.set('');
    this.editModalOpen.set(true);
  }

  closeEditQuestion(): void {
    this.resetEditQuestionForm();
    this.selectedQuestion.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedQuestion(): void {
    const question = this.selectedQuestion();
    this.editQuestionForm.markAllAsTouched();
    this.applyScopedGroupToForm(this.editQuestionForm);
    this.editOptionsError.set(this.validateOptions(this.editAnswerType(), this.editOptions));

    if (
      !question ||
      this.editQuestionForm.invalid ||
      this.editOptionsError().length > 0 ||
      this.questionsStore.updating() ||
      !this.canEditQuestion(question)
    ) {
      return;
    }

    this.questionsStore.updateQuestion(
      question.questionId,
      this.toUpdatePayload(this.editQuestionForm.getRawValue()),
      () => {
        this.closeEditQuestion();
      },
    );
  }

  openDeleteQuestion(event: MouseEvent, question: QuestionListItem): void {
    event.stopPropagation();
    if (!this.canDeleteQuestion(question)) {
      return;
    }

    this.questionsStore.clearMessages();
    this.questionPendingDelete.set(question);
    this.deleteModalOpen.set(true);
  }

  closeDeleteQuestion(): void {
    this.questionPendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedQuestion(): void {
    const question = this.questionPendingDelete();
    if (!question || this.questionsStore.deleting() || !this.canDeleteQuestion(question)) {
      return;
    }

    this.questionsStore.deleteQuestion(question.questionId, () => {
      this.closeDeleteQuestion();
    });
  }

  restoreQuestion(event: MouseEvent, question: QuestionListItem): void {
    event.stopPropagation();
    if (!this.canRestoreQuestion(question) || this.questionsStore.restoring()) {
      return;
    }

    this.questionsStore.restoreQuestion(question.questionId, () => undefined);
  }

  canEditQuestion(question: QuestionListItem): boolean {
    return question.isEditable && this.canUpdate();
  }

  canDeleteQuestion(question: QuestionListItem): boolean {
    return question.isEditable && question.isActive && this.canDelete();
  }

  canRestoreQuestion(question: QuestionListItem): boolean {
    return question.isEditable && !question.isActive && this.canRestore();
  }

  searchQuestions(): void {
    const formValue = this.searchForm.getRawValue();
    const searchQuery = {
      searchText: formValue.searchText,
      isActive: this.toIsActiveFilter(formValue.isActive),
      pageSize: this.toPageSize(formValue.pageSize),
      orderSort: formValue.orderSort,
    };

    const scopedGroupId = this.scopedGroupId();
    if (scopedGroupId) {
      this.questionsStore.loadForGroup(scopedGroupId, searchQuery);
      return;
    }

    this.questionsStore.search(
      searchQuery.searchText,
      searchQuery.isActive,
      searchQuery.pageSize,
      searchQuery.orderSort,
    );
  }

  clearQuestionSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    const scopedGroupId = this.scopedGroupId();
    if (scopedGroupId) {
      this.questionsStore.loadForGroup(scopedGroupId);
      return;
    }

    this.questionsStore.search('', null, 10, '');
  }

  goToPreviousQuestionsPage(): void {
    this.questionsStore.previousPage();
  }

  goToNextQuestionsPage(): void {
    this.questionsStore.nextPage();
  }

  questionFieldError(field: QuestionMainField): string {
    const control = this.questionForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  editQuestionFieldError(field: QuestionMainField): string {
    const control = this.editQuestionForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  questionOptionFieldError(index: number, field: QuestionOptionField): string {
    return this.optionFieldError(this.createOptions, index, field);
  }

  editQuestionOptionFieldError(index: number, field: QuestionOptionField): string {
    return this.optionFieldError(this.editOptions, index, field);
  }

  onCreateQuestionTypeChanged(event: Event): void {
    const answerType = this.readAnswerTypeFromEvent(event);
    this.createAnswerType.set(answerType);
    this.syncOptionsState(this.createOptions, answerType);
    this.createOptionsError.set('');
  }

  onEditQuestionTypeChanged(event: Event): void {
    const answerType = this.readAnswerTypeFromEvent(event);
    this.editAnswerType.set(answerType);
    this.syncOptionsState(this.editOptions, answerType);
    this.editOptionsError.set('');
  }

  addCreateOption(): void {
    this.addOption(this.createOptions);
    this.createOptionsError.set('');
  }

  addEditOption(): void {
    this.addOption(this.editOptions);
    this.editOptionsError.set('');
  }

  removeCreateOption(index: number): void {
    this.removeOption(this.createOptions, index);
    this.createOptionsError.set('');
  }

  removeEditOption(index: number): void {
    this.removeOption(this.editOptions, index);
    this.editOptionsError.set('');
  }

  canRemoveCreateOption(): boolean {
    return this.createOptions.length > 2;
  }

  canRemoveEditOption(): boolean {
    return this.editOptions.length > 2;
  }

  answerTypeLabel(type: QuestionAnswerTypeInput, fallbackTypeName = ''): string {
    const labelKey =
      questionAnswerTypeLabelKey(type) ?? questionAnswerTypeLabelKey(fallbackTypeName);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return (
      fallbackTypeName ||
      (typeof type === 'string' || typeof type === 'number' ? String(type) : '-')
    );
  }

  createdByName(question: QuestionListItem): string {
    if (!question.createdBy) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return question.createdBy.nameAr || question.createdBy.nameEn || '-';
    }

    return question.createdBy.nameEn || question.createdBy.nameAr || '-';
  }

  questionTextHeader(): string {
    return this.i18n.translate('survey.questionText');
  }

  primaryQuestionText(question: QuestionListItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textAr || question.textEn || '-';
    }

    return question.textEn || question.textAr || '-';
  }

  questionGroupPrimaryLabel(question: QuestionListItem): string {
    const fallbackGroupLabel = this.selectedGroupLabel();
    const isArabic = this.i18n.language() === 'ar';

    if (question.groupNameEn || question.groupNameAr) {
      return this.localizedText(question.groupNameEn, question.groupNameAr ?? '', isArabic);
    }

    return fallbackGroupLabel || '-';
  }

  questionGroupSecondaryLabel(question: QuestionListItem): string {
    if (this.isGroupScoped()) {
      return '';
    }

    return this.secondaryLocalizedText(
      question.groupNameEn,
      question.groupNameAr ?? '',
      this.i18n.language() === 'ar',
    );
  }

  secondaryQuestionText(question: QuestionListItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textEn || '-';
    }

    return question.textAr || '-';
  }

  questionAnswerItems(question: QuestionListItem): readonly QuestionAnswerAccordionItem[] {
    const questionType = toQuestionAnswerType(question.type);

    if (questionType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return this.singleChoiceAnswerItems(question);
    }

    if (questionType === QUESTION_ANSWER_TYPE.StarRating) {
      const scoreLabel = this.i18n.translate('questions.optionValue');
      return this.scoreValues.map((score) => ({
        id: `${question.questionId}-star-${score}`,
        label: '',
        score,
        title: `${scoreLabel} ${score}`,
        variant: 'stars',
      }));
    }

    if (questionType === QUESTION_ANSWER_TYPE.Smiles) {
      return SMILE_LEVELS.map((level) => {
        const label = `${level.emoji} ${this.i18n.translate(level.labelKey)}`;

        return {
          id: `${question.questionId}-smile-${level.value}`,
          label,
          score: level.value,
          title: label,
        };
      });
    }

    return [];
  }

  private fieldError(
    field: QuestionMainField,
    touched: boolean,
    valid: boolean,
    required: boolean,
  ): string {
    if (!touched || valid) {
      return '';
    }

    if (required) {
      if (field === 'groupId') {
        return 'questions.groupRequired';
      }
      if (field === 'type') {
        return 'questions.typeRequired';
      }
      return 'questions.textEnRequired';
    }

    return 'questions.textMaxLength';
  }

  private createQuestionForm(): QuestionFormGroup {
    return this.formBuilder.nonNullable.group({
      groupId: ['', [Validators.required]],
      textEn: ['', [Validators.required, Validators.maxLength(500)]],
      textAr: ['', [Validators.maxLength(500)]],
      type: [String(QUESTION_ANSWER_TYPE.SingleChoice), [Validators.required]],
      options: this.formBuilder.array<FormGroup<QuestionOptionFormControls>>(
        this.createDefaultOptionForms(),
      ),
    });
  }

  private createOptionForm(
    order: number,
    option?: QuestionAnswerOption,
    defaultTextEn = '',
    defaultTextAr = '',
    defaultValue: AnswerScaleValue = this.toDefaultOptionValue(order),
  ): FormGroup<QuestionOptionFormControls> {
    return this.formBuilder.nonNullable.group({
      optionId: [option?.optionId ?? ''],
      textEn: [option?.textEn ?? defaultTextEn, [Validators.required]],
      textAr: [option?.textAr ?? defaultTextAr],
      order: [
        String(option?.order || order),
        [Validators.required, Validators.pattern(/^[1-9]\d*$/)],
      ],
      value: [
        String(option?.value ?? defaultValue),
        [Validators.required, Validators.pattern(/^[1-5]$/)],
      ],
    });
  }

  private resetCreateQuestionForm(): void {
    this.resetQuestionForm(this.questionForm, this.createOptions);
    this.createAnswerType.set(QUESTION_ANSWER_TYPE.SingleChoice);
    this.syncOptionsState(this.createOptions, QUESTION_ANSWER_TYPE.SingleChoice);
    this.createOptionsError.set('');
  }

  private resetEditQuestionForm(): void {
    this.resetQuestionForm(this.editQuestionForm, this.editOptions);
    this.editAnswerType.set(QUESTION_ANSWER_TYPE.SingleChoice);
    this.syncOptionsState(this.editOptions, QUESTION_ANSWER_TYPE.SingleChoice);
    this.editOptionsError.set('');
  }

  private resetQuestionForm(form: QuestionFormGroup, options: QuestionOptionsFormArray): void {
    form.reset({
      groupId: '',
      textEn: '',
      textAr: '',
      type: String(QUESTION_ANSWER_TYPE.SingleChoice),
    });
    this.applyScopedGroupToForm(form);
    this.setQuestionOptions(options, []);
  }

  private applyScopedGroupToForm(form: QuestionFormGroup): void {
    const scopedGroupId = this.scopedGroupId();
    if (!scopedGroupId) {
      return;
    }

    form.controls.groupId.setValue(scopedGroupId);
  }

  private setQuestionOptions(
    optionsControl: QuestionOptionsFormArray,
    options: readonly QuestionAnswerOption[],
  ): void {
    optionsControl.clear();

    if (options.length === 0) {
      this.setDefaultOptions(optionsControl);
      return;
    }

    for (const option of options) {
      optionsControl.push(this.createOptionForm(option.order, option));
    }

    this.ensureMinimumOptions(optionsControl);
  }

  private syncOptionsState(
    optionsControl: QuestionOptionsFormArray,
    answerType: QuestionAnswerType,
  ): void {
    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      this.ensureMinimumOptions(optionsControl);
      optionsControl.enable();
      return;
    }

    optionsControl.disable();
  }

  private ensureMinimumOptions(optionsControl: QuestionOptionsFormArray): void {
    if (optionsControl.length === 0) {
      this.setDefaultOptions(optionsControl);
      return;
    }

    while (optionsControl.length < 2) {
      optionsControl.push(this.createOptionForm(optionsControl.length + 1));
    }
  }

  private createDefaultOptionForms(): FormGroup<QuestionOptionFormControls>[] {
    return DEFAULT_SINGLE_CHOICE_OPTIONS.map((option) => this.createDefaultOptionForm(option));
  }

  private createDefaultOptionForm(
    option: DefaultQuestionAnswerOption,
  ): FormGroup<QuestionOptionFormControls> {
    return this.createOptionForm(
      option.order,
      undefined,
      option.textEn,
      option.textAr,
      option.value,
    );
  }

  private setDefaultOptions(optionsControl: QuestionOptionsFormArray): void {
    optionsControl.clear();

    for (const option of this.createDefaultOptionForms()) {
      optionsControl.push(option);
    }
  }

  private addOption(optionsControl: QuestionOptionsFormArray): void {
    optionsControl.push(this.createOptionForm(optionsControl.length + 1));
  }

  private removeOption(optionsControl: QuestionOptionsFormArray, index: number): void {
    if (optionsControl.length <= 2) {
      return;
    }

    optionsControl.removeAt(index);
  }

  private optionFieldError(
    optionsControl: QuestionOptionsFormArray,
    index: number,
    field: QuestionOptionField,
  ): string {
    const option = optionsControl.at(index);
    const control = option.controls[field];

    if (!control.touched || control.valid) {
      return '';
    }

    if (field === 'textEn' && control.hasError('required')) {
      return 'questions.optionTextEnRequired';
    }

    if (field === 'order' && control.hasError('required')) {
      return 'questions.optionOrderRequired';
    }

    if (field === 'order' && control.hasError('pattern')) {
      return 'questions.optionOrderPositive';
    }

    if (field === 'value' && control.hasError('required')) {
      return 'questions.optionValueRequired';
    }

    if (field === 'value' && control.hasError('pattern')) {
      return 'questions.optionValueScaleRange';
    }

    return '';
  }

  private validateOptions(
    answerType: QuestionAnswerType,
    optionsControl: QuestionOptionsFormArray,
  ): string {
    if (!isSingleChoiceAnswerType(answerType)) {
      return '';
    }

    optionsControl.markAllAsTouched();

    if (optionsControl.length < 2) {
      return 'questions.singleChoiceMinOptions';
    }

    if (optionsControl.invalid) {
      return '';
    }

    const options = this.toCreateOptionPayloads(optionsControl.getRawValue());
    const normalizedText = options.map((option) => option.textEn.toLowerCase());
    const orderValues = options.map((option) => option.order);

    if (new Set(normalizedText).size !== normalizedText.length) {
      return 'questions.optionTextEnUnique';
    }

    if (new Set(orderValues).size !== orderValues.length) {
      return 'questions.optionOrderUnique';
    }

    return '';
  }

  private toCreatePayload(value: QuestionFormValue): CreateQuestionRequest {
    const basePayload = this.toQuestionPayloadBase(value);

    return {
      ...basePayload,
      options:
        basePayload.type === QUESTION_ANSWER_TYPE.SingleChoice
          ? this.toCreateOptionPayloads(value.options)
          : [],
    };
  }

  private toUpdatePayload(value: QuestionFormValue): UpdateQuestionRequest {
    const basePayload = this.toQuestionPayloadBase(value);

    return {
      ...basePayload,
      options:
        basePayload.type === QUESTION_ANSWER_TYPE.SingleChoice
          ? this.toUpdateOptionPayloads(value.options)
          : [],
    };
  }

  private toQuestionPayloadBase(value: QuestionFormValue): Omit<CreateQuestionRequest, 'options'> {
    const textAr = value.textAr.trim();
    const answerType = toQuestionAnswerType(value.type) ?? QUESTION_ANSWER_TYPE.SingleChoice;

    return {
      groupId: this.scopedGroupId() ?? value.groupId,
      textEn: value.textEn.trim(),
      textAr: textAr.length > 0 ? textAr : null,
      type: answerType,
    };
  }

  private toCreateOptionPayloads(
    options: readonly QuestionOptionFormValue[],
  ): readonly QuestionAnswerOptionPayload[] {
    return options.map((option) => this.toQuestionOptionPayload(option));
  }

  private toUpdateOptionPayloads(
    options: readonly QuestionOptionFormValue[],
  ): readonly UpdateQuestionAnswerOptionPayload[] {
    return options.map((option) => {
      const optionId = option.optionId.trim();

      return {
        optionId: optionId.length > 0 ? optionId : null,
        ...this.toQuestionOptionPayload(option),
      };
    });
  }

  private toQuestionOptionPayload(option: QuestionOptionFormValue): QuestionAnswerOptionPayload {
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
    const defaultOption = DEFAULT_SINGLE_CHOICE_OPTIONS.find((option) => option.order === order);
    if (defaultOption) {
      return defaultOption.value;
    }

    return 5;
  }

  private readAnswerTypeFromEvent(event: Event): QuestionAnswerType {
    const target = event.target;
    const value = target instanceof HTMLSelectElement ? target.value : '';
    return toQuestionAnswerType(value) ?? QUESTION_ANSWER_TYPE.SingleChoice;
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

  private singleChoiceAnswerItems(question: QuestionListItem): readonly QuestionAnswerAccordionItem[] {
    const isArabic = this.i18n.language() === 'ar';

    return [...question.options]
      .filter((option) => option.isActive)
      .sort((first, second) => first.order - second.order)
      .map((option, index) => this.toSingleChoiceAnswerItem(option, index, isArabic));
  }

  private toSingleChoiceAnswerItem(
    option: QuestionAnswerOption,
    index: number,
    isArabic: boolean,
  ): QuestionAnswerAccordionItem {
    const label = this.localizedText(option.textEn, option.textAr ?? '', isArabic);
    const secondaryLabel = this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic);

    return {
      id: option.optionId || `${option.order}-${index}`,
      label,
      score: option.value,
      title: secondaryLabel ? `${label} - ${secondaryLabel}` : label,
    };
  }

  private localizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic && arabicText.length > 0) {
      return arabicText;
    }

    return englishText || arabicText || '-';
  }

  private secondaryLocalizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic) {
      return englishText;
    }

    return arabicText;
  }
}
