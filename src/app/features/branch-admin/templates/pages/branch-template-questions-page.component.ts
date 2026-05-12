import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ArrowLeft,
  CheckCircle2,
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
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { BranchTemplateQuestionSelectionItem } from '../models/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

interface TemplateQuestionManagerItem extends BranchTemplateQuestionSelectionItem {
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
}

interface TemplateQuestionManagerGroup {
  groupId: string;
  nameEn: string;
  nameAr: string;
  questions: readonly TemplateQuestionManagerItem[];
}

@Component({
  selector: 'app-branch-template-questions-page',
  standalone: true,
  imports: [ButtonComponent, CardComponent, IconComponent, RouterLink, TranslatePipe],
  templateUrl: './branch-template-questions-page.component.html',
  styleUrl: './branch-template-questions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateQuestionsPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly checkIcon = CheckCircle2;
  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;
  readonly fileTextIcon = FileText;
  readonly gripIcon = GripVertical;
  readonly listChecksIcon = ListChecks;
  readonly plusIcon = Plus;
  readonly saveIcon = Save;
  readonly searchIcon = Search;
  readonly trashIcon = Trash2;

  readonly selectedQuestions = signal<readonly TemplateQuestionManagerItem[]>([]);
  readonly searchText = signal('');
  readonly initializedTemplateId = signal('');
  readonly draggingQuestionId = signal<string | null>(null);

  readonly templateId = computed(() => this.route.snapshot.paramMap.get('templateId') ?? '');
  readonly selectedQuestionIds = computed(() => new Set(this.selectedQuestions().map((question) => question.questionId)));
  readonly allQuestions = computed(() => this.flattenSelectionQuestions());
  readonly filteredAvailableGroups = computed(() => this.toFilteredAvailableGroups());
  readonly hasAvailableQuestions = computed(() =>
    this.filteredAvailableGroups().some((group) => group.questions.length > 0),
  );
  readonly isDirty = computed(() => this.toSelectedIdsKey() !== this.toOriginalSelectedIdsKey());
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
          .sort((first, second) => (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER)),
      );
      this.initializedTemplateId.set(selection.templateId);
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

  updateSearchText(event: Event): void {
    const input = event.target;
    this.searchText.set(input instanceof HTMLInputElement ? input.value : '');
  }

  addQuestion(question: TemplateQuestionManagerItem): void {
    if (this.selectedQuestionIds().has(question.questionId)) {
      return;
    }

    this.selectedQuestions.update((questions) => [...questions, { ...question, isSelected: true, order: questions.length + 1 }]);
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestions.update((questions) => questions.filter((question) => question.questionId !== questionId));
  }

  moveQuestion(questionId: string, direction: -1 | 1): void {
    const currentQuestions = [...this.selectedQuestions()];
    const currentIndex = currentQuestions.findIndex((question) => question.questionId === questionId);
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
    const draggedIndex = currentQuestions.findIndex((question) => question.questionId === draggedQuestionId);
    const targetIndex = currentQuestions.findIndex((question) => question.questionId === targetQuestionId);
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
    if (templateId.length === 0 || this.templatesStore.updatingQuestions()) {
      return;
    }

    this.templatesStore.updateTemplateQuestions(
      templateId,
      { questionIds: this.selectedQuestions().map((question) => question.questionId) },
      () => {
        this.initializedTemplateId.set('');
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
        .sort((first, second) => (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER)),
    );
    this.initializedTemplateId.set(selection.templateId);
  }

  private flattenSelectionQuestions(): readonly TemplateQuestionManagerItem[] {
    return (
      this.templatesStore.questionsSelection()?.groups.flatMap((group) =>
        group.questions.map((question) => ({
          ...question,
          groupId: group.groupId,
          groupNameEn: group.nameEn,
          groupNameAr: group.nameAr,
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
        .map((group) => {
          const questions = group.questions
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
            }));

          return {
            groupId: group.groupId,
            nameEn: group.nameEn,
            nameAr: group.nameAr,
            questions,
          };
        })
        .filter((group) => group.questions.length > 0) ?? []
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
      .sort((first, second) => (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER))
      .map((question) => question.questionId)
      .join('|');
  }
}
