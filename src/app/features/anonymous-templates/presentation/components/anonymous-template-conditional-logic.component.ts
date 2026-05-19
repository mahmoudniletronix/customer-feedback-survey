import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ArrowLeft, Ban, GitBranch, Plus, RotateCcw, Trash2 } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerType,
  SMILE_LEVELS,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../../shared/models/question-answer.model';
import {
  QUESTION_CONDITION_TRIGGER_TYPE,
  QuestionCondition,
  QuestionConditionTriggerType,
  createsQuestionConditionCycle,
  questionConditionKey,
  triggerTypeName,
} from '../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  AnonymousTemplateQuestionCondition,
  AnonymousTemplateQuestionOption,
  AnonymousTemplateQuestionSelectionItem,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

interface AnonymousConditionalLogicQuestion
  extends Omit<AnonymousTemplateQuestionSelectionItem, 'anonymousTemplateQuestionId'> {
  anonymousTemplateQuestionId: string;
  persistedAnonymousTemplateQuestionId: string | null;
  answerType: QuestionAnswerType | null;
}

interface ConditionTriggerBaseView {
  key: string;
  label: string;
  secondaryLabel: string;
  valueLabel: string;
  triggerType: QuestionConditionTriggerType;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  childCandidates: readonly AnonymousConditionalLogicQuestion[];
  selectedChildTemplateQuestionId: string;
}

interface ConditionTriggerView extends ConditionTriggerBaseView {
  conditions: readonly QuestionCondition[];
}

interface ConditionTreeTriggerView extends ConditionTriggerBaseView {
  conditions: readonly ConditionTreeConditionView[];
}

interface ConditionTreeConditionView {
  condition: QuestionCondition;
  childQuestion: AnonymousConditionalLogicQuestion | null;
}

interface ConditionTreeNodeView {
  question: AnonymousConditionalLogicQuestion;
  canBeParent: boolean;
  triggers: readonly ConditionTreeTriggerView[];
  depth: number;
}

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-anonymous-template-conditional-logic',
  standalone: true,
  imports: [ButtonComponent, IconComponent, NgTemplateOutlet, TranslatePipe],
  templateUrl: './anonymous-template-conditional-logic.component.html',
  styleUrl: './anonymous-template-conditional-logic.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateConditionalLogicComponent {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly i18n = inject(I18nService);

  readonly questions = input<readonly AnonymousTemplateQuestionSelectionItem[]>([]);
  readonly candidateQuestions = input<readonly AnonymousTemplateQuestionSelectionItem[]>([]);
  readonly conditions = input<readonly AnonymousTemplateQuestionCondition[]>([]);
  readonly conditionsChanged = output<readonly QuestionCondition[]>();
  readonly dirtyChanged = output<boolean>();
  readonly relatedQuestionSelected = output<AnonymousTemplateQuestionSelectionItem>();

  readonly blockedIcon = Ban;
  readonly branchIcon = GitBranch;
  readonly backIcon = ArrowLeft;
  readonly plusIcon = Plus;
  readonly resetIcon = RotateCcw;
  readonly trashIcon = Trash2;

  readonly originalConditions = signal<readonly QuestionCondition[]>([]);
  readonly draftConditions = signal<readonly QuestionCondition[]>([]);
  readonly selectedChildByTrigger = signal<Record<string, string>>({});
  readonly focusedQuestionPathIds = signal<readonly string[]>([]);
  private readonly initializedKey = signal('');

  readonly selectedQuestions = computed<readonly AnonymousConditionalLogicQuestion[]>(() =>
    this.toLogicQuestions(this.questions(), true),
  );
  readonly availableChildQuestions = computed<readonly AnonymousConditionalLogicQuestion[]>(() =>
    this.toLogicQuestions(this.candidateQuestions(), false),
  );
  readonly rootNodes = computed<readonly ConditionTreeNodeView[]>(() => this.toRootTreeNodes());
  readonly focusedQuestionPath = computed<readonly AnonymousConditionalLogicQuestion[]>(() =>
    this.focusedQuestionPathIds().reduce<AnonymousConditionalLogicQuestion[]>(
      (path, questionId) => {
        const question = this.findQuestion(questionId);
        if (question) {
          path.push(question);
        }
        return path;
      },
      [],
    ),
  );
  readonly focusedQuestion = computed(() => {
    const path = this.focusedQuestionPath();
    return path.length > 0 ? path[path.length - 1] : null;
  });
  readonly focusedParentQuestion = computed(() => {
    const path = this.focusedQuestionPath();
    return path.length > 1 ? path[path.length - 2] : null;
  });
  readonly visibleNodes = computed<readonly ConditionTreeNodeView[]>(() => {
    const focusedQuestion = this.focusedQuestion();
    const focusedPath = this.focusedQuestionPath();
    const focusedDepth = Math.max(focusedPath.length - 1, 0);
    const parentPath = focusedPath
      .slice(0, -1)
      .map((question) => question.anonymousTemplateQuestionId);

    return focusedQuestion
      ? [this.toTreeNode(focusedQuestion, focusedDepth, parentPath)]
      : this.rootNodes();
  });
  readonly configuredConditionsCount = computed(() => this.normalizedDraftConditions().length);
  readonly isDirty = computed(
    () =>
      this.conditionsFingerprint(this.normalizedDraftConditions()) !==
      this.conditionsFingerprint(this.originalConditions()),
  );

  constructor() {
    effect(() => {
      const selectionKey = [
        this.selectedQuestions()
          .map((question) => question.anonymousTemplateQuestionId)
          .join('|'),
        this.conditionsFingerprint(this.toQuestionConditions(this.conditions())),
      ].join('::');

      if (selectionKey === this.initializedKey()) {
        return;
      }

      const conditions = this.normalizeIncomingConditions(
        this.toQuestionConditions(this.conditions()),
      );
      this.originalConditions.set(conditions);
      this.draftConditions.set(conditions);
      this.selectedChildByTrigger.set({});
      this.focusedQuestionPathIds.set([]);
      this.initializedKey.set(selectionKey);
    });

    effect(() => {
      this.conditionsChanged.emit(this.normalizedDraftConditions());
      this.dirtyChanged.emit(this.isDirty());
    });
  }

  updateSelectedChild(triggerKey: string, event: Event): void {
    const target = event.target;
    const childTemplateQuestionId = target instanceof HTMLSelectElement ? target.value : '';

    this.selectedChildByTrigger.update((selectedChildren) => ({
      ...selectedChildren,
      [triggerKey]: childTemplateQuestionId,
    }));
  }

  addCondition(
    parent: AnonymousConditionalLogicQuestion,
    trigger: ConditionTriggerBaseView,
  ): void {
    const childTemplateQuestionId = this.selectedChildByTrigger()[trigger.key] ?? '';
    const child = trigger.childCandidates.find(
      (candidate) => candidate.anonymousTemplateQuestionId === childTemplateQuestionId,
    );

    if (!child) {
      return;
    }

    const nextCondition: QuestionCondition = {
      conditionId: '',
      parentTemplateQuestionId: parent.anonymousTemplateQuestionId,
      childTemplateQuestionId: child.anonymousTemplateQuestionId,
      triggerType: trigger.triggerType,
      triggerTypeName: triggerTypeName(trigger.triggerType),
      selectedQuestionOptionId: trigger.selectedQuestionOptionId,
      triggerValue: trigger.triggerValue,
      order: this.nextOrder(parent.anonymousTemplateQuestionId, trigger),
    };

    if (!this.isSelectedQuestion(child.anonymousTemplateQuestionId)) {
      this.relatedQuestionSelected.emit(this.toQuestionInput(child));
    }

    this.draftConditions.update((conditions) => [...conditions, nextCondition]);
    this.selectedChildByTrigger.update((selectedChildren) => ({
      ...selectedChildren,
      [trigger.key]: '',
    }));
  }

  removeCondition(condition: QuestionCondition): void {
    const key = questionConditionKey(condition);
    this.draftConditions.update((conditions) =>
      conditions.filter((currentCondition) => questionConditionKey(currentCondition) !== key),
    );
  }

  clearConditions(): void {
    this.draftConditions.set([]);
    this.selectedChildByTrigger.set({});
  }

  resetConditions(): void {
    this.draftConditions.set(this.originalConditions());
    this.selectedChildByTrigger.set({});
  }

  focusQuestion(
    question: AnonymousConditionalLogicQuestion,
    parentQuestion: AnonymousConditionalLogicQuestion | null = null,
  ): void {
    const questionId = question.anonymousTemplateQuestionId;
    const parentQuestionId = parentQuestion?.anonymousTemplateQuestionId ?? null;
    const currentPath = this.focusedQuestionPathIds();

    if (!parentQuestionId) {
      const existingQuestionIndex = currentPath.indexOf(questionId);
      this.focusedQuestionPathIds.set(
        existingQuestionIndex >= 0 ? currentPath.slice(0, existingQuestionIndex + 1) : [questionId],
      );
      return;
    }

    const parentIndex = currentPath.indexOf(parentQuestionId);
    const basePath = parentIndex >= 0 ? currentPath.slice(0, parentIndex + 1) : [parentQuestionId];
    const existingQuestionIndex = basePath.indexOf(questionId);

    this.focusedQuestionPathIds.set(
      existingQuestionIndex >= 0
        ? basePath.slice(0, existingQuestionIndex + 1)
        : [...basePath, questionId],
    );
  }

  clearFocusedQuestion(): void {
    this.focusedQuestionPathIds.set([]);
  }

  focusPathQuestion(pathIndex: number): void {
    const path = this.focusedQuestionPathIds();
    if (pathIndex < 0 || pathIndex >= path.length) {
      return;
    }

    this.focusedQuestionPathIds.set(path.slice(0, pathIndex + 1));
  }

  backOneFocusedQuestion(): void {
    const path = this.focusedQuestionPathIds();
    this.focusedQuestionPathIds.set(path.slice(0, -1));
  }

  canConfigureQuestion(question: AnonymousConditionalLogicQuestion): boolean {
    return this.canBeParent(question);
  }

  questionText(question: AnonymousConditionalLogicQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(question.textEn, question.textAr ?? '', isArabic) || '-';
  }

  childQuestionText(templateQuestionId: string): string {
    const question = this.selectedQuestions().find(
      (currentQuestion) => currentQuestion.anonymousTemplateQuestionId === templateQuestionId,
    );
    return question ? this.questionText(question) : templateQuestionId;
  }

  questionSecondaryText(question: AnonymousConditionalLogicQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(question.textEn, question.textAr ?? '', isArabic);
  }

  optionLabel(option: AnonymousTemplateQuestionOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(option.textEn, option.textAr ?? '', isArabic) || '-';
  }

  optionSecondaryLabel(option: AnonymousTemplateQuestionOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic);
  }

  answerTypeLabel(question: AnonymousConditionalLogicQuestion): string {
    const labelKey = questionAnswerTypeLabelKey(question.answerType);
    return labelKey ? this.i18n.translate(labelKey) : question.typeName || '-';
  }

  trackCondition(condition: QuestionCondition): string {
    return questionConditionKey(condition);
  }

  treeNodeContainerClass(node: ConditionTreeNodeView): string {
    return node.depth === 0
      ? 'relative overflow-hidden rounded-lg border border-cyan-200 bg-white p-2.5 pt-3 shadow-sm shadow-cyan-100/60'
      : 'relative overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/25 p-2.5 pt-3 shadow-sm shadow-emerald-100/50';
  }

  nodeConditionsCount(node: ConditionTreeNodeView): number {
    return node.triggers.reduce((total, trigger) => total + trigger.conditions.length, 0);
  }

  private toLogicQuestions(
    questions: readonly AnonymousTemplateQuestionSelectionItem[],
    selectedOnly: boolean,
  ): readonly AnonymousConditionalLogicQuestion[] {
    return questions
      .filter(
        (question) =>
          question.isActive &&
          this.hasLogicQuestionId(question) &&
          (selectedOnly ? question.isSelected : question.isSelectable),
      )
      .map((question) => this.toLogicQuestion(question))
      .sort(
        (first, second) =>
          (first.selectedOrder ?? Number.MAX_SAFE_INTEGER) -
          (second.selectedOrder ?? Number.MAX_SAFE_INTEGER),
      );
  }

  private toLogicQuestion(
    question: AnonymousTemplateQuestionSelectionItem,
  ): AnonymousConditionalLogicQuestion {
    return {
      ...question,
      anonymousTemplateQuestionId: this.logicQuestionId(question),
      persistedAnonymousTemplateQuestionId: question.anonymousTemplateQuestionId,
      answerType: toQuestionAnswerType(question.typeName || question.type),
    };
  }

  private toTriggerViews(
    question: AnonymousConditionalLogicQuestion,
  ): readonly ConditionTriggerView[] {
    if (question.answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return [...question.options]
        .sort((first, second) => first.order - second.order)
        .map((option) =>
          this.toTriggerView(
            question,
            QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption,
            option.optionId,
            null,
            this.optionLabel(option),
            this.optionSecondaryLabel(option),
            this.triggerValueLabel(option.value),
          ),
        );
    }

    if (question.answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return SCALE_VALUES.map((value) =>
        this.toTriggerView(
          question,
          QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue,
          null,
          value,
          `${value} ${this.i18n.translate('branchTemplates.stars')}`,
          '',
          this.triggerValueLabel(value),
        ),
      );
    }

    if (question.answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return SCALE_VALUES.map((value) => {
        const smileLevel = SMILE_LEVELS.find((level) => level.value === value);
        return this.toTriggerView(
          question,
          QUESTION_CONDITION_TRIGGER_TYPE.SmileValue,
          null,
          value,
          `${value} ${smileLevel?.emoji ?? ''}`,
          smileLevel ? this.i18n.translate(smileLevel.labelKey) : '',
          this.triggerValueLabel(value),
        );
      });
    }

    return [];
  }

  private toRootTreeNodes(): readonly ConditionTreeNodeView[] {
    const childTemplateQuestionIds = new Set(
      this.draftConditions().map((condition) => condition.childTemplateQuestionId),
    );
    const rootQuestions = this.selectedQuestions().filter(
      (question) => !childTemplateQuestionIds.has(question.anonymousTemplateQuestionId),
    );
    const questions = rootQuestions.length > 0 ? rootQuestions : this.selectedQuestions();

    return questions.map((question) => this.toTreeNode(question, 0, []));
  }

  private toTreeNode(
    question: AnonymousConditionalLogicQuestion,
    depth: number,
    parentPath: readonly string[],
  ): ConditionTreeNodeView {
    const path = [...parentPath, question.anonymousTemplateQuestionId];

    return {
      question,
      canBeParent: this.canBeParent(question),
      triggers: this.toTreeTriggerViews(question, depth, path),
      depth,
    };
  }

  private toTreeTriggerViews(
    question: AnonymousConditionalLogicQuestion,
    depth: number,
    path: readonly string[],
  ): readonly ConditionTreeTriggerView[] {
    return this.toTriggerViews(question).map((trigger) => ({
      ...trigger,
      conditions: trigger.conditions.map((condition) =>
        this.toTreeConditionView(condition, depth + 1, path),
      ),
    }));
  }

  private toTreeConditionView(
    condition: QuestionCondition,
    _depth: number,
    _path: readonly string[],
  ): ConditionTreeConditionView {
    return {
      condition,
      childQuestion: this.findQuestion(condition.childTemplateQuestionId),
    };
  }

  private toTriggerView(
    parent: AnonymousConditionalLogicQuestion,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
    label: string,
    secondaryLabel: string,
    valueLabel: string,
  ): ConditionTriggerView {
    const key = this.triggerKey(
      parent.anonymousTemplateQuestionId,
      triggerType,
      selectedQuestionOptionId,
      triggerValue,
    );
    const conditions = this.draftConditions()
      .filter(
        (condition) =>
          condition.parentTemplateQuestionId === parent.anonymousTemplateQuestionId &&
          condition.triggerType === triggerType &&
          condition.selectedQuestionOptionId === selectedQuestionOptionId &&
          condition.triggerValue === triggerValue,
      )
      .sort((first, second) => first.order - second.order);

    return {
      key,
      label,
      secondaryLabel,
      valueLabel,
      triggerType,
      selectedQuestionOptionId,
      triggerValue,
      conditions,
      childCandidates: this.childCandidates(parent, triggerType, selectedQuestionOptionId, triggerValue),
      selectedChildTemplateQuestionId: this.selectedChildByTrigger()[key] ?? '',
    };
  }

  private childCandidates(
    parent: AnonymousConditionalLogicQuestion,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
  ): readonly AnonymousConditionalLogicQuestion[] {
    return this.availableChildQuestions().filter((child) => {
      if (child.anonymousTemplateQuestionId === parent.anonymousTemplateQuestionId) {
        return false;
      }

      if (
        this.hasDuplicateCondition(
          parent.anonymousTemplateQuestionId,
          child.anonymousTemplateQuestionId,
          triggerType,
          selectedQuestionOptionId,
          triggerValue,
        )
      ) {
        return false;
      }

      return !createsQuestionConditionCycle(
        this.draftConditions(),
        parent.anonymousTemplateQuestionId,
        child.anonymousTemplateQuestionId,
      );
    });
  }

  private findQuestion(templateQuestionId: string): AnonymousConditionalLogicQuestion | null {
    return (
      this.availableChildQuestions().find(
        (question) => question.anonymousTemplateQuestionId === templateQuestionId,
      ) ?? null
    );
  }

  private canBeParent(question: AnonymousConditionalLogicQuestion): boolean {
    return (
      question.answerType === QUESTION_ANSWER_TYPE.SingleChoice ||
      question.answerType === QUESTION_ANSWER_TYPE.StarRating ||
      question.answerType === QUESTION_ANSWER_TYPE.Smiles
    );
  }

  private nextOrder(parentTemplateQuestionId: string, trigger: ConditionTriggerBaseView): number {
    return (
      this.draftConditions().filter(
        (condition) =>
          condition.parentTemplateQuestionId === parentTemplateQuestionId &&
          condition.triggerType === trigger.triggerType &&
          condition.selectedQuestionOptionId === trigger.selectedQuestionOptionId &&
          condition.triggerValue === trigger.triggerValue,
      ).length + 1
    );
  }

  private hasDuplicateCondition(
    parentTemplateQuestionId: string,
    childTemplateQuestionId: string,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
  ): boolean {
    return this.draftConditions().some(
      (condition) =>
        condition.parentTemplateQuestionId === parentTemplateQuestionId &&
        condition.childTemplateQuestionId === childTemplateQuestionId &&
        condition.triggerType === triggerType &&
        condition.selectedQuestionOptionId === selectedQuestionOptionId &&
        condition.triggerValue === triggerValue,
    );
  }

  private normalizeIncomingConditions(
    conditions: readonly QuestionCondition[],
  ): readonly QuestionCondition[] {
    const questionIds = new Set(
      this.selectedQuestions().map((question) => question.anonymousTemplateQuestionId),
    );
    const parentTypes = new Map(
      this.selectedQuestions().map((question) => [
        question.anonymousTemplateQuestionId,
        question.answerType,
      ]),
    );

    return conditions
      .filter(
        (condition) =>
          questionIds.has(condition.parentTemplateQuestionId) &&
          questionIds.has(condition.childTemplateQuestionId) &&
          condition.parentTemplateQuestionId !== condition.childTemplateQuestionId &&
          this.isValidParentTrigger(
            parentTypes.get(condition.parentTemplateQuestionId) ?? null,
            condition,
          ),
      )
      .sort((first, second) => first.order - second.order);
  }

  private normalizedDraftConditions(): readonly QuestionCondition[] {
    const questionIds = new Set(
      this.selectedQuestions().map((question) => question.anonymousTemplateQuestionId),
    );
    const orderByTrigger = new Map<string, number>();

    return this.draftConditions()
      .filter(
        (condition) =>
          questionIds.has(condition.parentTemplateQuestionId) &&
          questionIds.has(condition.childTemplateQuestionId) &&
          condition.parentTemplateQuestionId !== condition.childTemplateQuestionId,
      )
      .map((condition) => {
        const triggerKey = this.triggerKey(
          condition.parentTemplateQuestionId,
          condition.triggerType,
          condition.selectedQuestionOptionId,
          condition.triggerValue,
        );
        const order = (orderByTrigger.get(triggerKey) ?? 0) + 1;
        orderByTrigger.set(triggerKey, order);
        return { ...condition, order };
      });
  }

  private isValidParentTrigger(
    answerType: QuestionAnswerType | null,
    condition: QuestionCondition,
  ): boolean {
    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return (
        condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption &&
        condition.selectedQuestionOptionId !== null &&
        condition.triggerValue === null
      );
    }

    if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return (
        condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue &&
        condition.selectedQuestionOptionId === null &&
        this.isScaleValue(condition.triggerValue)
      );
    }

    if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return (
        condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue &&
        condition.selectedQuestionOptionId === null &&
        this.isScaleValue(condition.triggerValue)
      );
    }

    return false;
  }

  private isScaleValue(value: number | null): boolean {
    return value !== null && value >= 1 && value <= 5;
  }

  private isSelectedQuestion(templateQuestionId: string): boolean {
    return this.selectedQuestions().some(
      (question) => question.anonymousTemplateQuestionId === templateQuestionId,
    );
  }

  private toQuestionInput(
    question: AnonymousConditionalLogicQuestion,
  ): AnonymousTemplateQuestionSelectionItem {
    return {
      questionId: question.questionId,
      anonymousTemplateQuestionId: question.persistedAnonymousTemplateQuestionId,
      branchId: question.branchId,
      groupId: question.groupId,
      groupNameEn: question.groupNameEn,
      groupNameAr: question.groupNameAr,
      scope: question.scope,
      scopeName: question.scopeName,
      isGlobal: question.isGlobal,
      isSelectable: question.isSelectable,
      isEditable: question.isEditable,
      isSelected: question.isSelected,
      selectedOrder: question.selectedOrder,
      textEn: question.textEn,
      textAr: question.textAr,
      type: question.type,
      typeName: question.typeName,
      isActive: question.isActive,
      options: question.options,
    };
  }

  private toQuestionConditions(
    conditions: readonly AnonymousTemplateQuestionCondition[],
  ): readonly QuestionCondition[] {
    return conditions
      .map((condition): QuestionCondition | null => {
        const triggerType = this.toTriggerType(condition.triggerType ?? condition.triggerTypeName);
        if (!triggerType) {
          return null;
        }

        return {
          conditionId: condition.conditionId,
          parentTemplateQuestionId: condition.parentAnonymousTemplateQuestionId,
          childTemplateQuestionId: condition.childAnonymousTemplateQuestionId,
          triggerType,
          triggerTypeName: condition.triggerTypeName || triggerTypeName(triggerType),
          selectedQuestionOptionId: condition.selectedQuestionOptionId,
          triggerValue: condition.triggerValue,
          order: condition.order,
        };
      })
      .filter((condition): condition is QuestionCondition => condition !== null);
  }

  private logicQuestionId(question: AnonymousTemplateQuestionSelectionItem): string {
    return question.anonymousTemplateQuestionId ?? `draft:${question.questionId}`;
  }

  private hasLogicQuestionId(question: AnonymousTemplateQuestionSelectionItem): boolean {
    return (
      question.questionId.length > 0 ||
      (question.anonymousTemplateQuestionId !== null &&
        question.anonymousTemplateQuestionId.length > 0)
    );
  }

  private toTriggerType(
    value: number | string | null | undefined,
  ): QuestionConditionTriggerType | null {
    if (typeof value === 'string' && !Number.isFinite(Number(value))) {
      const normalized = value.replace(/[\s_-]/g, '').toLowerCase();
      if (normalized.includes('singlechoice')) {
        return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
      }
      if (normalized.includes('star')) {
        return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
      }
      if (normalized.includes('smile')) {
        return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
      }
      return null;
    }

    const numericValue = typeof value === 'string' ? Number(value) : value;
    if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
      return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
    }
    if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
      return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
    }
    if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
      return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
    }

    return null;
  }

  private conditionsFingerprint(conditions: readonly QuestionCondition[]): string {
    return conditions
      .map((condition) => `${questionConditionKey(condition)}|${condition.order}`)
      .sort()
      .join('::');
  }

  private triggerKey(
    parentTemplateQuestionId: string,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
  ): string {
    return [
      parentTemplateQuestionId,
      triggerType,
      selectedQuestionOptionId ?? '',
      triggerValue ?? '',
    ].join('|');
  }

  private triggerValueLabel(value: number | null): string {
    return value === null ? '' : `${this.i18n.translate('branchTemplates.triggerValue')} ${value}`;
  }

  private localizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic && arabicText.length > 0) {
      return arabicText;
    }
    return englishText || arabicText;
  }

  private secondaryLocalizedText(
    englishText: string,
    arabicText: string,
    isArabic: boolean,
  ): string {
    if (isArabic) {
      return englishText;
    }
    return arabicText;
  }
}
