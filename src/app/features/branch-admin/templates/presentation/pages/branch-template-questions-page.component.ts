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
  Eye,
  FileText,
  GripVertical,
  ListChecks,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../../shared/models/question-answer.model';
import {
  QuestionCondition,
  QuestionConditionPayload,
} from '../../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchTemplateConditionalLogicComponent } from '../components/branch-template-conditional-logic.component';
import { BranchTemplatePreviewComponent } from '../components/branch-template-preview.component';
import {
  BranchTemplateQuestionSelection,
  BranchTemplateQuestionSelectionItem,
} from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

interface TemplateQuestionManagerItem extends BranchTemplateQuestionSelectionItem {
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  groupIsActive: boolean;
  groupIsGlobal: boolean;
  groupScopeName: string;
  groupIsSelectable: boolean;
}

interface TemplateQuestionManagerGroup {
  groupId: string;
  nameEn: string;
  nameAr: string;
  isGlobal: boolean;
  scopeName: string;
  questions: readonly TemplateQuestionManagerItem[];
}

type TemplateBuilderTab = 'questions' | 'preview';

@Component({
  selector: 'app-branch-template-questions-page',
  standalone: true,
  imports: [
    BranchTemplateConditionalLogicComponent,
    BranchTemplatePreviewComponent,
    ButtonComponent,
    CardComponent,
    IconComponent,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './branch-template-questions-page.component.html',
  styleUrl: './branch-template-questions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateQuestionsPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;
  readonly eyeIcon = Eye;
  readonly fileTextIcon = FileText;
  readonly gripIcon = GripVertical;
  readonly listChecksIcon = ListChecks;
  readonly plusIcon = Plus;
  readonly saveIcon = Save;
  readonly searchIcon = Search;
  readonly trashIcon = Trash2;

  readonly selectedQuestions = signal<readonly TemplateQuestionManagerItem[]>([]);
  readonly draftConditions = signal<readonly QuestionCondition[]>([]);
  readonly conditionsDirty = signal(false);
  readonly activeTab = signal<TemplateBuilderTab>('questions');
  readonly searchText = signal('');
  readonly initializedTemplateId = signal('');
  readonly draggingQuestionId = signal<string | null>(null);
  readonly expandedAvailableGroupIds = signal<readonly string[]>([]);

  readonly templateId = computed(() => this.route.snapshot.paramMap.get('templateId') ?? '');
  readonly selectedQuestionIds = computed(
    () => new Set(this.selectedQuestions().map((question) => question.questionId)),
  );
  readonly allQuestions = computed(() => this.flattenSelectionQuestions());
  readonly activeQuestions = computed(() =>
    this.allQuestions().filter((question) => this.isActiveQuestion(question)),
  );
  readonly conditionQuestions = computed(() => {
    const questionsByQuestionId = new Map(
      this.allQuestions().map((question) => [question.questionId, question]),
    );

    return this.selectedQuestions()
      .map((question) => ({
        ...(questionsByQuestionId.get(question.questionId) ?? question),
        ...question,
      }))
      .filter((question) => this.isActiveQuestion(question));
  });
  readonly conditionCandidateQuestions = computed(() =>
    this.activeQuestions().filter((question) => this.isSelectableQuestion(question)),
  );
  readonly filteredAvailableGroups = computed(() => this.toFilteredAvailableGroups());
  readonly hasAvailableQuestions = computed(() =>
    this.filteredAvailableGroups().some((group) => group.questions.length > 0),
  );
  readonly isDirty = computed(() => this.toSelectedIdsKey() !== this.toOriginalSelectedIdsKey());
  readonly hasPendingChanges = computed(() => this.isDirty() || this.conditionsDirty());
  readonly savingTemplateFlow = computed(
    () =>
      this.templatesStore.updatingQuestions() || this.templatesStore.updatingQuestionConditions(),
  );
  readonly templateName = computed(() => {
    const selection = this.templatesStore.questionsSelection();
    const template = this.templatesStore.selectedTemplate();
    return selection?.templateNameEn || template?.nameEn || '';
  });
  readonly templateSubtitle = computed(() => {
    const selection = this.templatesStore.questionsSelection();
    const template = this.templatesStore.selectedTemplate();
    return selection?.templateNameAr || template?.nameAr || '';
  });

  constructor() {
    effect(() => {
      const selection = this.templatesStore.questionsSelection();
      if (!selection || selection.templateId === this.initializedTemplateId()) {
        return;
      }

      this.selectedQuestions.set(
        this.flattenSelectionQuestions()
          .filter((question) => question.isSelected)
          .sort(
            (first, second) =>
              (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER),
          ),
      );
      this.initializedTemplateId.set(selection.templateId);
      this.expandedAvailableGroupIds.set([]);
    });
  }

  ngOnInit(): void {
    const templateId = this.templateId();
    if (templateId.length === 0) {
      this.templatesStore.clearDetails();
      return;
    }

    this.templatesStore.loadDetails(templateId);
    this.templatesStore.loadQuestionsSelection(templateId);
  }

  goBack(): void {
    this.location.back();
  }

  setActiveTab(tab: TemplateBuilderTab): void {
    this.activeTab.set(tab);
  }

  updateSearchText(event: Event): void {
    const input = event.target;
    this.searchText.set(input instanceof HTMLInputElement ? input.value : '');
  }

  addQuestion(question: TemplateQuestionManagerItem): void {
    if (
      !this.isSelectableQuestion(question) ||
      this.selectedQuestionIds().has(question.questionId)
    ) {
      return;
    }

    this.selectedQuestions.update((questions) => [
      ...questions,
      { ...question, isSelected: true, order: questions.length + 1 },
    ]);
    this.collapseAvailableGroup(question.groupId);
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestions.update((questions) =>
      questions.filter((question) => question.questionId !== questionId),
    );
  }

  addRelatedQuestion(question: TemplateQuestionManagerItem): void {
    if (
      !this.isSelectableQuestion(question) ||
      this.selectedQuestionIds().has(question.questionId)
    ) {
      return;
    }

    this.selectedQuestions.update((questions) => [
      ...questions,
      { ...question, isSelected: true, order: questions.length + 1 },
    ]);
  }

  moveQuestion(questionId: string, direction: -1 | 1): void {
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
    this.selectedQuestions.set(currentQuestions);
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
    this.selectedQuestions.set(currentQuestions);
  }

  endDrag(): void {
    this.draggingQuestionId.set(null);
  }

  saveQuestions(): void {
    const templateId = this.templateId();
    if (templateId.length === 0 || this.savingTemplateFlow() || !this.hasPendingChanges()) {
      return;
    }

    this.templatesStore.updateTemplateQuestionsAndConditions(
      templateId,
      { questionIds: this.selectedQuestions().map((question) => question.questionId) },
      (selection) => ({
        conditions: this.toResolvedConditionPayload(selection),
      }),
      this.isDirty(),
      () => {
        this.initializedTemplateId.set('');
        this.conditionsDirty.set(false);
      },
    );
  }

  resetSelection(): void {
    this.initializedTemplateId.set('');
    const selection = this.templatesStore.questionsSelection();
    if (!selection) {
      this.selectedQuestions.set([]);
      return;
    }

    this.selectedQuestions.set(
      this.flattenSelectionQuestions()
        .filter((question) => question.isSelected)
        .sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER),
        ),
    );
    this.initializedTemplateId.set(selection.templateId);
  }

  answerTypeLabel(type: QuestionAnswerTypeInput): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return typeof type === 'string' || typeof type === 'number' ? String(type) : '-';
  }

  toggleAvailableGroup(groupId: string): void {
    this.expandedAvailableGroupIds.update((groupIds) =>
      groupIds.includes(groupId)
        ? groupIds.filter((currentGroupId) => currentGroupId !== groupId)
        : [...groupIds, groupId],
    );
  }

  isAvailableGroupExpanded(groupId: string): boolean {
    return (
      this.expandedAvailableGroupIds().includes(groupId) ||
      this.searchText().trim().length > 0
    );
  }

  availableGroupName(group: TemplateQuestionManagerGroup): string {
    if (this.i18n.language() === 'ar') {
      return group.nameAr || group.nameEn || '-';
    }

    return group.nameEn || group.nameAr || '-';
  }

  availableGroupSecondaryName(group: TemplateQuestionManagerGroup): string {
    if (this.i18n.language() === 'ar') {
      return group.nameEn || '';
    }

    return group.nameAr || '';
  }

  questionText(question: TemplateQuestionManagerItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textAr || question.textEn || '-';
    }

    return question.textEn || question.textAr || '-';
  }

  updateDraftConditions(conditions: readonly QuestionCondition[]): void {
    this.draftConditions.set(conditions);
  }

  updateConditionsDirty(isDirty: boolean): void {
    this.conditionsDirty.set(isDirty);
  }

  private flattenSelectionQuestions(): readonly TemplateQuestionManagerItem[] {
    return (
      this.templatesStore.questionsSelection()?.groups.flatMap((group) =>
        group.questions.map((question) => ({
          ...question,
          groupId: group.groupId,
          groupNameEn: group.nameEn,
          groupNameAr: group.nameAr,
          groupIsActive: group.isActive,
          groupIsGlobal: group.isGlobal,
          groupScopeName: group.scopeName,
          groupIsSelectable: group.isSelectable,
        })),
      ) ?? []
    );
  }

  private toFilteredAvailableGroups(): readonly TemplateQuestionManagerGroup[] {
    const selectedIds = this.selectedQuestionIds();
    const normalizedSearch = this.searchText().trim().toLowerCase();
    const selection = this.templatesStore.questionsSelection();

    return (
      selection?.groups
        .filter((group) => group.isActive && group.isSelectable)
        .map((group) => {
          const questions = group.questions
            .filter((question) => question.isActive && question.isSelectable)
            .filter((question) => !selectedIds.has(question.questionId))
            .filter((question) => {
              if (normalizedSearch.length === 0) {
                return true;
              }

              return [question.textEn, question.textAr, question.type, group.nameEn, group.nameAr]
                .filter((value): value is string => value.length > 0)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
            })
            .map((question) => ({
              ...question,
              groupId: group.groupId,
              groupNameEn: group.nameEn,
              groupNameAr: group.nameAr,
              groupIsActive: group.isActive,
              groupIsGlobal: group.isGlobal,
              groupScopeName: group.scopeName,
              groupIsSelectable: group.isSelectable,
            }));

          return {
            groupId: group.groupId,
            nameEn: group.nameEn,
            nameAr: group.nameAr,
            isGlobal: group.isGlobal,
            scopeName: group.scopeName,
            questions,
          };
        })
        .filter((group) => group.questions.length > 0) ?? []
    );
  }

  private collapseAvailableGroup(groupId: string): void {
    if (this.searchText().trim().length > 0) {
      return;
    }

    this.expandedAvailableGroupIds.update((groupIds) =>
      groupIds.filter((currentGroupId) => currentGroupId !== groupId),
    );
  }

  private toSelectedIdsKey(): string {
    return this.selectedQuestions()
      .map((question) => question.questionId)
      .join('|');
  }

  private toOriginalSelectedIdsKey(): string {
    return this.allQuestions()
      .filter((question) => question.isSelected)
      .sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER),
      )
      .map((question) => question.questionId)
      .join('|');
  }

  private toResolvedConditionPayload(
    selection: BranchTemplateQuestionSelection,
  ): readonly QuestionConditionPayload[] {
    const savedQuestionsByQuestionId = new Map(
      selection.groups
        .filter((group) => group.isActive)
        .flatMap((group) => group.questions)
        .filter(
          (question) =>
            question.isSelected &&
            question.isActive &&
            question.templateQuestionId !== null &&
            question.templateQuestionId.length > 0,
        )
        .map((question) => [question.questionId, question.templateQuestionId as string]),
    );
    const latestQuestionsByQuestionId = new Map(
      this.conditionQuestions().map((question) => [question.questionId, question]),
    );
    const draftQuestionsByLogicId = new Map<string, TemplateQuestionManagerItem>();
    for (const draftQuestion of this.selectedQuestions()) {
      const resolvedQuestion =
        latestQuestionsByQuestionId.get(draftQuestion.questionId) ?? draftQuestion;

      draftQuestionsByLogicId.set(this.logicQuestionId(draftQuestion), resolvedQuestion);
      if (
        resolvedQuestion.templateQuestionId !== null &&
        resolvedQuestion.templateQuestionId.length > 0
      ) {
        draftQuestionsByLogicId.set(resolvedQuestion.templateQuestionId, resolvedQuestion);
      }
    }

    return this.draftConditions()
      .map((condition): QuestionConditionPayload | null => {
        const parentQuestion = draftQuestionsByLogicId.get(condition.parentTemplateQuestionId);
        const childQuestion = draftQuestionsByLogicId.get(condition.childTemplateQuestionId);
        const parentTemplateQuestionId = parentQuestion
          ? savedQuestionsByQuestionId.get(parentQuestion.questionId)
          : null;
        const childTemplateQuestionId = childQuestion
          ? savedQuestionsByQuestionId.get(childQuestion.questionId)
          : null;

        if (!parentTemplateQuestionId || !childTemplateQuestionId) {
          return null;
        }

        return {
          parentTemplateQuestionId,
          childTemplateQuestionId,
          triggerType: condition.triggerType,
          selectedQuestionOptionId: condition.selectedQuestionOptionId,
          triggerValue: condition.triggerValue,
          order: condition.order,
        };
      })
      .filter((condition): condition is QuestionConditionPayload => condition !== null);
  }

  private logicQuestionId(question: TemplateQuestionManagerItem): string {
    return question.templateQuestionId ?? `draft:${question.questionId}`;
  }

  private isActiveQuestion(question: TemplateQuestionManagerItem): boolean {
    return question.isActive && question.groupIsActive;
  }

  isSelectableQuestion(question: TemplateQuestionManagerItem): boolean {
    return question.isSelectable && question.groupIsSelectable;
  }

}
