import { Location } from '@angular/common';
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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  ListChecks,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { AuthStore } from '../../../auth/presentation/state/auth.store';
import {
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../shared/models/question-answer.model';
import { QuestionCondition } from '../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AnonymousTemplateConditionalLogicComponent } from '../components/anonymous-template-conditional-logic.component';
import {
  AnonymousTemplateQuestionCondition,
  AnonymousTemplateQuestionSelectionItem,
  AnonymousTemplateQuestionsSelection,
  ManageAnonymousTemplateQuestionConditionPayload,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

interface AnonymousTemplateSelectionGroup {
  groupId: string;
  nameEn: string;
  nameAr: string | null;
  isGlobal: boolean;
  scopeName: string;
  questions: readonly AnonymousTemplateQuestionSelectionItem[];
}

@Component({
  selector: 'app-anonymous-template-questions-page',
  standalone: true,
  imports: [
    AnonymousTemplateConditionalLogicComponent,
    ButtonComponent,
    CardComponent,
    IconComponent,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './anonymous-template-questions-page.component.html',
  styleUrl: './anonymous-template-questions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateQuestionsPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;
  readonly fileTextIcon = FileText;
  readonly gripIcon = GripVertical;
  readonly listChecksIcon = ListChecks;
  readonly plusIcon = Plus;
  readonly saveIcon = Save;
  readonly searchIcon = Search;
  readonly trashIcon = Trash2;

  readonly searchText = signal('');
  readonly selectedQuestions = signal<readonly AnonymousTemplateQuestionSelectionItem[]>([]);
  readonly draftConditions = signal<readonly QuestionCondition[]>([]);
  readonly conditionsDirty = signal(false);
  readonly initializedSelectionId = signal('');
  readonly draggingQuestionId = signal<string | null>(null);

  readonly anonymousTemplateId = computed(
    () => this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '',
  );
  readonly selectedQuestionIds = computed(
    () => new Set(this.selectedQuestions().map((question) => question.questionId)),
  );
  readonly allQuestions = computed(
    () => this.anonymousTemplatesStore.questionsSelection()?.questions ?? [],
  );
  readonly conditionCandidateQuestions = computed(() => {
    const questionsByQuestionId = new Map(
      this.allQuestions().map((question) => [question.questionId, question]),
    );

    for (const question of this.selectedQuestions()) {
      questionsByQuestionId.set(question.questionId, {
        ...(questionsByQuestionId.get(question.questionId) ?? question),
        ...question,
      });
    }

    return [...questionsByQuestionId.values()].filter(
      (question) => question.isActive && question.isSelectable,
    );
  });
  readonly conditionQuestions = computed(() => {
    const questionsByQuestionId = new Map(
      this.conditionCandidateQuestions().map((question) => [question.questionId, question]),
    );

    return this.selectedQuestions()
      .map((question) => ({
        ...(questionsByQuestionId.get(question.questionId) ?? question),
        ...question,
      }))
      .filter((question) => question.isActive);
  });
  readonly availableGroups = computed(() => this.groupAvailableQuestions());
  readonly availableQuestionsCount = computed(() =>
    this.availableGroups().reduce((total, group) => total + group.questions.length, 0),
  );
  readonly pageTitle = computed(() => {
    const selection = this.anonymousTemplatesStore.questionsSelection();
    const template = this.anonymousTemplatesStore.selectedTemplate();
    return selection?.nameEn || template?.nameEn || '';
  });
  readonly pageSubtitle = computed(() => {
    const selection = this.anonymousTemplatesStore.questionsSelection();
    const template = this.anonymousTemplatesStore.selectedTemplate();
    return selection?.nameAr || template?.nameAr || '';
  });
  readonly isDirty = computed(() => this.toSelectedIdsKey() !== this.toOriginalSelectedIdsKey());
  readonly hasPendingChanges = computed(() => this.isDirty() || this.conditionsDirty());
  readonly savingTemplateFlow = computed(
    () =>
      this.anonymousTemplatesStore.assigningQuestions() ||
      this.anonymousTemplatesStore.managingQuestionConditions(),
  );
  readonly canAssignQuestions = computed(() =>
    this.authStore.canManageAnonymousTemplates('AssignQuestions'),
  );
  readonly canManageQuestionConditions = computed(() =>
    this.authStore.canManageAnonymousTemplates('ManageQuestionConditions'),
  );
  readonly canSave = computed(
    () =>
      !this.savingTemplateFlow() &&
      ((this.isDirty() && this.canAssignQuestions()) ||
        (this.conditionsDirty() && this.canManageQuestionConditions())) &&
      (!this.isDirty() || this.canAssignQuestions()) &&
      (!this.conditionsDirty() || this.canManageQuestionConditions()),
  );
  readonly templateConditions = computed<readonly AnonymousTemplateQuestionCondition[]>(
    () => this.anonymousTemplatesStore.selectedTemplate()?.questionConditions ?? [],
  );

  constructor() {
    effect(() => {
      const selection = this.anonymousTemplatesStore.questionsSelection();
      if (!selection || selection.anonymousTemplateId === this.initializedSelectionId()) {
        return;
      }

      this.selectedQuestions.set(this.toSelectedQuestions(selection.questions));
      this.initializedSelectionId.set(selection.anonymousTemplateId);
    });
  }

  ngOnInit(): void {
    const anonymousTemplateId = this.anonymousTemplateId();
    if (anonymousTemplateId.length === 0) {
      this.anonymousTemplatesStore.clearDetails();
      return;
    }

    this.anonymousTemplatesStore.loadDetails(anonymousTemplateId);
    this.anonymousTemplatesStore.loadQuestionsSelection(anonymousTemplateId);
  }

  goBack(): void {
    this.location.back();
  }

  updateSearchText(event: Event): void {
    const target = event.target;
    this.searchText.set(target instanceof HTMLInputElement ? target.value : '');
  }

  searchQuestions(): void {
    const anonymousTemplateId = this.anonymousTemplateId();
    if (anonymousTemplateId.length === 0) {
      return;
    }

    this.anonymousTemplatesStore.loadQuestionsSelection(anonymousTemplateId, this.searchText());
  }

  clearSearch(): void {
    this.searchText.set('');
    this.searchQuestions();
  }

  questionText(question: AnonymousTemplateQuestionSelectionItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textAr || question.textEn || '-';
    }

    return question.textEn || question.textAr || '-';
  }

  answerTypeLabel(type: QuestionAnswerTypeInput): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return typeof type === 'string' || typeof type === 'number' ? String(type) : '-';
  }

  questionTypeLabel(question: AnonymousTemplateQuestionSelectionItem): string {
    return question.typeName || this.answerTypeLabel(question.type);
  }

  addQuestion(question: AnonymousTemplateQuestionSelectionItem): void {
    if (
      !this.canAssignQuestions() ||
      !question.isActive ||
      !question.isSelectable ||
      this.selectedQuestionIds().has(question.questionId)
    ) {
      return;
    }

    this.selectedQuestions.update((questions) => [
      ...questions,
      {
        ...question,
        isSelected: true,
        selectedOrder: questions.length + 1,
      },
    ]);
  }

  addRelatedQuestion(question: AnonymousTemplateQuestionSelectionItem): void {
    this.addQuestion(question);
  }

  removeQuestion(questionId: string): void {
    if (!this.canAssignQuestions()) {
      return;
    }

    this.selectedQuestions.update((questions) =>
      questions
        .filter((question) => question.questionId !== questionId)
        .map((question, index) => ({ ...question, selectedOrder: index + 1 })),
    );
  }

  moveQuestion(questionId: string, direction: -1 | 1): void {
    if (!this.canAssignQuestions()) {
      return;
    }

    const currentQuestions = [...this.selectedQuestions()];
    const currentIndex = currentQuestions.findIndex(
      (question) => question.questionId === questionId,
    );
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentQuestions.length) {
      return;
    }

    const [question] = currentQuestions.splice(currentIndex, 1);
    currentQuestions.splice(nextIndex, 0, question);
    this.selectedQuestions.set(
      currentQuestions.map((currentQuestion, index) => ({
        ...currentQuestion,
        selectedOrder: index + 1,
      })),
    );
  }

  startDrag(questionId: string): void {
    this.draggingQuestionId.set(questionId);
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  dropOnQuestion(event: DragEvent, targetQuestionId: string): void {
    event.preventDefault();
    const draggedQuestionId = this.draggingQuestionId();
    this.draggingQuestionId.set(null);

    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) {
      return;
    }

    const currentQuestions = [...this.selectedQuestions()];
    const draggedIndex = currentQuestions.findIndex(
      (question) => question.questionId === draggedQuestionId,
    );
    const targetIndex = currentQuestions.findIndex(
      (question) => question.questionId === targetQuestionId,
    );
    if (draggedIndex < 0 || targetIndex < 0) {
      return;
    }

    const [draggedQuestion] = currentQuestions.splice(draggedIndex, 1);
    currentQuestions.splice(targetIndex, 0, draggedQuestion);
    this.selectedQuestions.set(
      currentQuestions.map((question, index) => ({
        ...question,
        selectedOrder: index + 1,
      })),
    );
  }

  endDrag(): void {
    this.draggingQuestionId.set(null);
  }

  resetSelection(): void {
    const anonymousTemplateId = this.anonymousTemplateId();
    if (anonymousTemplateId.length === 0) {
      this.selectedQuestions.set([]);
      return;
    }

    this.searchText.set('');
    this.conditionsDirty.set(false);
    this.draftConditions.set([]);
    this.initializedSelectionId.set('');
    this.anonymousTemplatesStore.loadDetails(anonymousTemplateId);
    this.anonymousTemplatesStore.loadQuestionsSelection(anonymousTemplateId);
  }

  saveQuestions(): void {
    const anonymousTemplateId = this.anonymousTemplateId();
    if (anonymousTemplateId.length === 0 || !this.canSave()) {
      return;
    }

    const questionsPayload = {
      questions: this.selectedQuestions().map((question, index) => ({
        questionId: question.questionId,
        order: index + 1,
      })),
    };

    if (this.conditionsDirty()) {
      this.anonymousTemplatesStore.saveQuestionsAndConditions(
        anonymousTemplateId,
        questionsPayload,
        (selection) => ({
          conditions: this.toResolvedConditionPayload(selection),
        }),
        this.isDirty(),
        (selection) => {
          this.selectedQuestions.set(this.toSelectedQuestions(selection.questions));
          this.initializedSelectionId.set(selection.anonymousTemplateId);
          this.conditionsDirty.set(false);
        },
      );
      return;
    }

    this.anonymousTemplatesStore.assignQuestions(
      anonymousTemplateId,
      questionsPayload,
      (selection) => {
        this.selectedQuestions.set(this.toSelectedQuestions(selection.questions));
        this.initializedSelectionId.set(selection.anonymousTemplateId);
      },
    );
  }

  updateDraftConditions(conditions: readonly QuestionCondition[]): void {
    this.draftConditions.set(conditions);
  }

  updateConditionsDirty(isDirty: boolean): void {
    this.conditionsDirty.set(isDirty);
  }

  private groupAvailableQuestions(): readonly AnonymousTemplateSelectionGroup[] {
    const groupsById = new Map<string, AnonymousTemplateSelectionGroup>();
    const selectedQuestionIds = this.selectedQuestionIds();

    for (const question of this.anonymousTemplatesStore.questionsSelection()?.questions ?? []) {
      if (selectedQuestionIds.has(question.questionId) || !question.isActive || !question.isSelectable) {
        continue;
      }

      const groupId = question.groupId || 'ungrouped';
      const currentGroup = groupsById.get(groupId);
      if (currentGroup) {
        groupsById.set(groupId, {
          ...currentGroup,
          questions: [...currentGroup.questions, question],
        });
        continue;
      }

      groupsById.set(groupId, {
        groupId,
        nameEn: question.groupNameEn,
        nameAr: question.groupNameAr,
        isGlobal: question.isGlobal,
        scopeName: question.scopeName,
        questions: [question],
      });
    }

    return [...groupsById.values()];
  }

  private toSelectedQuestions(
    questions: readonly AnonymousTemplateQuestionSelectionItem[],
  ): readonly AnonymousTemplateQuestionSelectionItem[] {
    return questions
      .filter((question) => question.isSelected)
      .sort(
        (first, second) =>
          (first.selectedOrder ?? Number.MAX_SAFE_INTEGER) -
          (second.selectedOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((question, index) => ({ ...question, selectedOrder: index + 1 }));
  }

  private toSelectedIdsKey(): string {
    return this.selectedQuestions()
      .map((question) => question.questionId)
      .join('|');
  }

  private toOriginalSelectedIdsKey(): string {
    return this.toSelectedQuestions(
      this.anonymousTemplatesStore.questionsSelection()?.questions ?? [],
    )
      .map((question) => question.questionId)
      .join('|');
  }

  private toResolvedConditionPayload(
    selection: AnonymousTemplateQuestionsSelection,
  ): readonly ManageAnonymousTemplateQuestionConditionPayload[] {
    const savedQuestionsByQuestionId = new Map(
      selection.questions
        .filter(
          (question) =>
            question.isSelected &&
            question.isActive &&
            question.anonymousTemplateQuestionId !== null &&
            question.anonymousTemplateQuestionId.length > 0,
        )
        .map((question) => [question.questionId, question.anonymousTemplateQuestionId as string]),
    );
    const latestQuestionsByQuestionId = new Map(
      this.conditionQuestions().map((question) => [question.questionId, question]),
    );
    const draftQuestionsByLogicId = new Map<string, AnonymousTemplateQuestionSelectionItem>();

    for (const draftQuestion of this.selectedQuestions()) {
      const resolvedQuestion =
        latestQuestionsByQuestionId.get(draftQuestion.questionId) ?? draftQuestion;

      draftQuestionsByLogicId.set(this.logicQuestionId(draftQuestion), resolvedQuestion);
      if (
        resolvedQuestion.anonymousTemplateQuestionId !== null &&
        resolvedQuestion.anonymousTemplateQuestionId.length > 0
      ) {
        draftQuestionsByLogicId.set(
          resolvedQuestion.anonymousTemplateQuestionId,
          resolvedQuestion,
        );
      }
    }

    return this.draftConditions()
      .map((condition): ManageAnonymousTemplateQuestionConditionPayload | null => {
        const parentQuestion = draftQuestionsByLogicId.get(condition.parentTemplateQuestionId);
        const childQuestion = draftQuestionsByLogicId.get(condition.childTemplateQuestionId);
        const parentAnonymousTemplateQuestionId = parentQuestion
          ? savedQuestionsByQuestionId.get(parentQuestion.questionId)
          : null;
        const childAnonymousTemplateQuestionId = childQuestion
          ? savedQuestionsByQuestionId.get(childQuestion.questionId)
          : null;

        if (!parentAnonymousTemplateQuestionId || !childAnonymousTemplateQuestionId) {
          return null;
        }

        return {
          parentAnonymousTemplateQuestionId,
          childAnonymousTemplateQuestionId,
          triggerType: condition.triggerType,
          selectedQuestionOptionId: condition.selectedQuestionOptionId,
          triggerValue: condition.triggerValue,
          order: condition.order,
        };
      })
      .filter(
        (condition): condition is ManageAnonymousTemplateQuestionConditionPayload =>
          condition !== null,
      );
  }

  private logicQuestionId(question: AnonymousTemplateQuestionSelectionItem): string {
    return question.anonymousTemplateQuestionId ?? `draft:${question.questionId}`;
  }
}
