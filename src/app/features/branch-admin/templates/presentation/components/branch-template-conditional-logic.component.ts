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
import { Ban, GitBranch, Plus, RotateCcw, Trash2 } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerOption,
  QuestionAnswerType,
  SMILE_LEVELS,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../../../shared/models/question-answer.model';
import {
  QUESTION_CONDITION_TRIGGER_TYPE,
  QuestionCondition,
  QuestionConditionTriggerType,
  createsQuestionConditionCycle,
  questionConditionKey,
  triggerTypeName,
} from '../../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchTemplateQuestionSelectionItem } from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

interface ConditionalLogicQuestionInput extends BranchTemplateQuestionSelectionItem {
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  groupIsActive: boolean;
}

interface ConditionalLogicQuestion
  extends Omit<ConditionalLogicQuestionInput, 'templateQuestionId'> {
  templateQuestionId: string;
  persistedTemplateQuestionId: string | null;
  answerType: QuestionAnswerType | null;
}

interface ConditionTriggerBaseView {
  key: string;
  label: string;
  secondaryLabel: string;
  triggerType: QuestionConditionTriggerType;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  childCandidates: readonly ConditionalLogicQuestion[];
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
  childQuestion: ConditionalLogicQuestion | null;
  childNode: ConditionTreeNodeView | null;
}

interface ConditionTreeNodeView {
  question: ConditionalLogicQuestion;
  canBeParent: boolean;
  triggers: readonly ConditionTreeTriggerView[];
  depth: number;
}

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-branch-template-conditional-logic',
  standalone: true,
  imports: [ButtonComponent, IconComponent, NgTemplateOutlet, TranslatePipe],
  templateUrl: './branch-template-conditional-logic.component.html',
  styleUrl: './branch-template-conditional-logic.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateConditionalLogicComponent {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly i18n = inject(I18nService);

  readonly questions = input<readonly ConditionalLogicQuestionInput[]>([]);
  readonly candidateQuestions = input<readonly ConditionalLogicQuestionInput[]>([]);
  readonly conditionsChanged = output<readonly QuestionCondition[]>();
  readonly dirtyChanged = output<boolean>();
  readonly relatedQuestionSelected = output<ConditionalLogicQuestionInput>();

  readonly blockedIcon = Ban;
  readonly branchIcon = GitBranch;
  readonly plusIcon = Plus;
  readonly resetIcon = RotateCcw;
  readonly trashIcon = Trash2;

  readonly originalConditions = signal<readonly QuestionCondition[]>([]);
  readonly draftConditions = signal<readonly QuestionCondition[]>([]);
  readonly selectedChildByTrigger = signal<Record<string, string>>({});
  private readonly initializedSelectionKey = signal('');

  readonly selectedQuestions = computed<readonly ConditionalLogicQuestion[]>(() =>
    this.toLogicQuestions(this.questions(), true),
  );
  readonly availableChildQuestions = computed<readonly ConditionalLogicQuestion[]>(() =>
    this.toLogicQuestions(this.candidateQuestions(), false),
  );
  readonly rootNodes = computed<readonly ConditionTreeNodeView[]>(() => this.toRootTreeNodes());
  readonly configuredConditionsCount = computed(() => this.normalizedDraftConditions().length);
  readonly isDirty = computed(
    () =>
      this.conditionsFingerprint(this.normalizedDraftConditions()) !==
      this.conditionsFingerprint(this.originalConditions()),
  );

  constructor() {
    effect(() => {
      const selection = this.templatesStore.questionsSelection();
      if (!selection) {
        this.originalConditions.set([]);
        this.draftConditions.set([]);
        this.selectedChildByTrigger.set({});
        this.initializedSelectionKey.set('');
        return;
      }

      const selectionKey = [
        selection.templateId,
        this.persistedSelectedQuestions()
          .map((question) => question.templateQuestionId)
          .join('|'),
        this.conditionsFingerprint(selection.questionConditions),
      ].join('::');

      if (selectionKey === this.initializedSelectionKey()) {
        return;
      }

      const conditions = this.normalizeIncomingConditions(selection.questionConditions);
      this.originalConditions.set(conditions);
      this.draftConditions.set(conditions);
      this.selectedChildByTrigger.set({});
      this.initializedSelectionKey.set(selectionKey);
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

  addCondition(parent: ConditionalLogicQuestion, trigger: ConditionTriggerBaseView): void {
    const childTemplateQuestionId = this.selectedChildByTrigger()[trigger.key] ?? '';
    const child = trigger.childCandidates.find(
      (candidate) => candidate.templateQuestionId === childTemplateQuestionId,
    );

    if (!child) {
      return;
    }

    const nextCondition: QuestionCondition = {
      conditionId: '',
      parentTemplateQuestionId: parent.templateQuestionId,
      childTemplateQuestionId: child.templateQuestionId,
      triggerType: trigger.triggerType,
      triggerTypeName: triggerTypeName(trigger.triggerType),
      selectedQuestionOptionId: trigger.selectedQuestionOptionId,
      triggerValue: trigger.triggerValue,
      order: this.nextOrder(parent.templateQuestionId, trigger),
    };

    if (!this.isSelectedQuestion(child.templateQuestionId)) {
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

  questionText(question: ConditionalLogicQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(question.textEn, question.textAr, isArabic) || '-';
  }

  childQuestionText(templateQuestionId: string): string {
    const question = this.selectedQuestions().find(
      (currentQuestion) => currentQuestion.templateQuestionId === templateQuestionId,
    );
    return question ? this.questionText(question) : templateQuestionId;
  }

  questionSecondaryText(question: ConditionalLogicQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(question.textEn, question.textAr, isArabic);
  }

  optionLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(option.textEn, option.textAr ?? '', isArabic) || '-';
  }

  optionSecondaryLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic);
  }

  answerTypeLabel(question: ConditionalLogicQuestion): string {
    const labelKey = questionAnswerTypeLabelKey(question.type);
    return labelKey ? this.i18n.translate(labelKey) : question.type || '-';
  }

  trackCondition(condition: QuestionCondition): string {
    return questionConditionKey(condition);
  }

  treeNodeContainerClass(node: ConditionTreeNodeView): string {
    return node.depth === 0
      ? 'relative overflow-hidden rounded-xl border border-cyan-200 bg-white p-4 pt-5 shadow-sm shadow-cyan-100/70'
      : 'relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/25 p-3 pt-5 shadow-sm shadow-emerald-100/60';
  }

  nodeConditionsCount(node: ConditionTreeNodeView): number {
    return node.triggers.reduce((total, trigger) => total + trigger.conditions.length, 0);
  }

  private persistedSelectedQuestions(): readonly ConditionalLogicQuestion[] {
    return (
      this.templatesStore.questionsSelection()?.groups
        .flatMap((group) =>
          group.questions.map((question) => ({
            ...question,
            groupId: group.groupId,
            groupNameEn: group.nameEn,
            groupNameAr: group.nameAr,
            groupIsActive: group.isActive,
          })),
        )
        .filter(
          (question): question is ConditionalLogicQuestionInput =>
            question.isSelected &&
            question.isActive &&
            question.groupIsActive &&
            question.templateQuestionId !== null &&
            question.templateQuestionId.length > 0,
        )
        .map((question) => this.toLogicQuestion(question))
        .sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER),
        ) ?? []
    );
  }

  private toLogicQuestions(
    questions: readonly ConditionalLogicQuestionInput[],
    selectedOnly: boolean,
  ): readonly ConditionalLogicQuestion[] {
    return questions
      .filter(
        (question) =>
          question.isActive &&
          question.groupIsActive &&
          question.templateQuestionId !== null &&
          question.templateQuestionId.length > 0 &&
          (!selectedOnly || question.isSelected),
      )
      .map((question) => this.toLogicQuestion(question))
      .sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) -
          (second.order ?? Number.MAX_SAFE_INTEGER),
      );
  }

  private toLogicQuestion(question: ConditionalLogicQuestionInput): ConditionalLogicQuestion {
    return {
      ...question,
      templateQuestionId: this.logicQuestionId(question),
      persistedTemplateQuestionId: question.templateQuestionId,
      answerType: toQuestionAnswerType(question.type),
    };
  }

  private toTriggerViews(question: ConditionalLogicQuestion): readonly ConditionTriggerView[] {
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
      (question) => !childTemplateQuestionIds.has(question.templateQuestionId),
    );
    const questions = rootQuestions.length > 0 ? rootQuestions : this.selectedQuestions();

    return questions.map((question) => this.toTreeNode(question, 0, []));
  }

  private toTreeNode(
    question: ConditionalLogicQuestion,
    depth: number,
    parentPath: readonly string[],
  ): ConditionTreeNodeView {
    const path = [...parentPath, question.templateQuestionId];

    return {
      question,
      canBeParent: this.canBeParent(question),
      triggers: this.toTreeTriggerViews(question, depth, path),
      depth,
    };
  }

  private toTreeTriggerViews(
    question: ConditionalLogicQuestion,
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
    depth: number,
    path: readonly string[],
  ): ConditionTreeConditionView {
    const childQuestion = this.findQuestion(condition.childTemplateQuestionId);
    const childNode =
      childQuestion && !path.includes(childQuestion.templateQuestionId)
        ? this.toTreeNode(childQuestion, depth, path)
        : null;

    return {
      condition,
      childQuestion,
      childNode,
    };
  }

  private toTriggerView(
    parent: ConditionalLogicQuestion,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
    label: string,
    secondaryLabel: string,
  ): ConditionTriggerView {
    const key = this.triggerKey(
      parent.templateQuestionId,
      triggerType,
      selectedQuestionOptionId,
      triggerValue,
    );
    const conditions = this.draftConditions()
      .filter(
        (condition) =>
          condition.parentTemplateQuestionId === parent.templateQuestionId &&
          condition.triggerType === triggerType &&
          condition.selectedQuestionOptionId === selectedQuestionOptionId &&
          condition.triggerValue === triggerValue,
      )
      .sort((first, second) => first.order - second.order);

    return {
      key,
      label,
      secondaryLabel,
      triggerType,
      selectedQuestionOptionId,
      triggerValue,
      conditions,
      childCandidates: this.childCandidates(parent, triggerType, selectedQuestionOptionId, triggerValue),
      selectedChildTemplateQuestionId: this.selectedChildByTrigger()[key] ?? '',
    };
  }

  private childCandidates(
    parent: ConditionalLogicQuestion,
    triggerType: QuestionConditionTriggerType,
    selectedQuestionOptionId: string | null,
    triggerValue: number | null,
  ): readonly ConditionalLogicQuestion[] {
    return this.availableChildQuestions().filter((child) => {
      if (child.templateQuestionId === parent.templateQuestionId) {
        return false;
      }

      if (
        this.hasDuplicateCondition(
          parent.templateQuestionId,
          child.templateQuestionId,
          triggerType,
          selectedQuestionOptionId,
          triggerValue,
        )
      ) {
        return false;
      }

      return !createsQuestionConditionCycle(
        this.draftConditions(),
        parent.templateQuestionId,
        child.templateQuestionId,
      );
    });
  }

  private findQuestion(templateQuestionId: string): ConditionalLogicQuestion | null {
    return (
      this.availableChildQuestions().find(
        (question) => question.templateQuestionId === templateQuestionId,
      ) ?? null
    );
  }

  private canBeParent(question: ConditionalLogicQuestion): boolean {
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
    const questionIds = new Set(this.selectedQuestions().map((question) => question.templateQuestionId));
    const parentTypes = new Map(
      this.selectedQuestions().map((question) => [question.templateQuestionId, question.answerType]),
    );

    return conditions
      .filter(
        (condition) =>
          questionIds.has(condition.parentTemplateQuestionId) &&
          questionIds.has(condition.childTemplateQuestionId) &&
          condition.parentTemplateQuestionId !== condition.childTemplateQuestionId &&
          this.isValidParentTrigger(parentTypes.get(condition.parentTemplateQuestionId) ?? null, condition),
      )
      .sort((first, second) => first.order - second.order);
  }

  private normalizedDraftConditions(): readonly QuestionCondition[] {
    const questionIds = new Set(this.selectedQuestions().map((question) => question.templateQuestionId));
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
      (question) => question.templateQuestionId === templateQuestionId,
    );
  }

  private toQuestionInput(question: ConditionalLogicQuestion): ConditionalLogicQuestionInput {
    return {
      questionId: question.questionId,
      templateQuestionId: question.persistedTemplateQuestionId,
      textEn: question.textEn,
      textAr: question.textAr,
      type: question.type,
      typeName: question.typeName,
      isSelected: question.isSelected,
      isActive: question.isActive,
      order: question.order,
      options: question.options,
      groupId: question.groupId,
      groupNameEn: question.groupNameEn,
      groupNameAr: question.groupNameAr,
      groupIsActive: question.groupIsActive,
    };
  }

  private logicQuestionId(question: ConditionalLogicQuestionInput): string {
    return question.templateQuestionId ?? `draft:${question.questionId}`;
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
