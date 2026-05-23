import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map, switchMap, take } from 'rxjs';
import {
  QuestionCondition,
  QuestionConditionPayload,
  triggerTypeName,
} from '../../../../../shared/models/question-condition.model';
import {
  BranchTemplate,
  BranchTemplateQuestionSelection,
  BranchTemplateSelection,
  BranchTemplatesQuery,
  CreateBranchTemplatePayload,
  UpdateBranchTemplateQuestionConditionsPayload,
  UpdateBranchTemplateQuestionsResult,
  UpdateBranchTemplateQuestionsPayload,
  UpdateBranchTemplatePayload,
} from '../../domain/branch-template.model';
import { BranchTemplatesService } from '../../data/branch-templates.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
  title?: string;
  detail?: string;
}

@Injectable()
export class BranchTemplatesStore {
  private readonly defaultQuery: BranchTemplatesQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    isActive: null,
    orderSort: '',
  };

  private readonly branchTemplatesService = inject(BranchTemplatesService);
  private readonly templatesSignal = signal<readonly BranchTemplate[]>([]);
  private readonly selectionSignal = signal<readonly BranchTemplateSelection[]>([]);
  private readonly createdTemplateSignal = signal<BranchTemplate | null>(null);
  private readonly selectedTemplateSignal = signal<BranchTemplate | null>(null);
  private readonly questionsSelectionSignal = signal<BranchTemplateQuestionSelection | null>(null);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly isActiveSignal = signal<boolean | null>(this.defaultQuery.isActive);
  private readonly orderSortSignal = signal(this.defaultQuery.orderSort);
  private readonly loadingSignal = signal(false);
  private readonly selectionLoadingSignal = signal(false);
  private readonly detailsLoadingSignal = signal(false);
  private readonly questionsSelectionLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly updatingQuestionsSignal = signal(false);
  private readonly updatingQuestionConditionsSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly detailsErrorSignal = signal<string | null>(null);
  private readonly questionsSelectionErrorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly templates = this.templatesSignal.asReadonly();
  readonly selection = this.selectionSignal.asReadonly();
  readonly createdTemplate = this.createdTemplateSignal.asReadonly();
  readonly selectedTemplate = this.selectedTemplateSignal.asReadonly();
  readonly questionsSelection = this.questionsSelectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly isActive = this.isActiveSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly selectionLoading = this.selectionLoadingSignal.asReadonly();
  readonly detailsLoading = this.detailsLoadingSignal.asReadonly();
  readonly questionsSelectionLoading = this.questionsSelectionLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly updatingQuestions = this.updatingQuestionsSignal.asReadonly();
  readonly updatingQuestionConditions = this.updatingQuestionConditionsSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();
  readonly questionsSelectionError = this.questionsSelectionErrorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())),
  );
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());
  readonly selectedQuestionsCount = computed(
    () =>
      this.questionsSelectionSignal()?.groups.reduce(
        (total, group) => total + group.questions.filter((question) => question.isSelected).length,
        0,
      ) ?? 0,
  );
  readonly totalQuestionsSelectionCount = computed(
    () =>
      this.questionsSelectionSignal()?.groups.reduce(
        (total, group) => total + group.questions.length,
        0,
      ) ?? 0,
  );

  load(query: Partial<BranchTemplatesQuery> = {}): void {
    const nextQuery: BranchTemplatesQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
      isActive: query.isActive !== undefined ? query.isActive : this.isActiveSignal(),
      orderSort: query.orderSort ?? this.orderSortSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.isActiveSignal.set(nextQuery.isActive);
    this.orderSortSignal.set(nextQuery.orderSort);

    this.branchTemplatesService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
          this.templatesSignal.set(page.data.filter((template) => template.templateId.length > 0));
        },
        error: (error: unknown) => {
          this.templatesSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.loadError'));
        },
      });
  }

  search(
    searchText: string,
    isActive: boolean | null = this.isActiveSignal(),
    orderSort = this.orderSortSignal(),
  ): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      searchText,
      isActive,
      orderSort,
    });
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.load({ pageNumber: this.currentPageSignal() + 1 });
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.load({ pageNumber: this.currentPageSignal() - 1 });
    }
  }

  loadSelection(): void {
    this.selectionLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.branchTemplatesService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.selectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (templates) => {
          this.selectionSignal.set(templates);
        },
        error: (error: unknown) => {
          this.selectionSignal.set([]);
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.selectionLoadError'));
        },
      });
  }

  loadDetails(
    templateId: string,
    onLoaded: (template: BranchTemplate) => void = () => {},
    onError: (errorKey: string) => void = () => {},
  ): void {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);
    this.selectedTemplateSignal.set(null);

    this.branchTemplatesService
      .getById(templateId)
      .pipe(
        take(1),
        finalize(() => this.detailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          const selectedTemplate = template.templateId.length > 0 ? template : null;
          this.selectedTemplateSignal.set(selectedTemplate);
          if (selectedTemplate) {
            onLoaded(selectedTemplate);
          }
        },
        error: (error: unknown) => {
          const errorKey = this.readErrorKey(error, 'branchTemplates.detailsLoadError');
          this.detailsErrorSignal.set(errorKey);
          onError(errorKey);
        },
      });
  }

  loadQuestionsSelection(templateId: string): void {
    this.questionsSelectionLoadingSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.questionsSelectionSignal.set(null);

    this.branchTemplatesService
      .getQuestionsSelection(templateId)
      .pipe(
        take(1),
        finalize(() => this.questionsSelectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (selection) => {
          this.questionsSelectionSignal.set(selection);
        },
        error: (error: unknown) => {
          this.questionsSelectionErrorSignal.set(
            this.readErrorKey(error, 'branchTemplates.questionsSelectionLoadError'),
          );
        },
      });
  }

  clearDetails(): void {
    this.selectedTemplateSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.questionsSelectionSignal.set(null);
    this.questionsSelectionErrorSignal.set(null);
  }

  createTemplate(payload: CreateBranchTemplatePayload, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          this.createdTemplateSignal.set(template);
          this.successSignal.set('branchTemplates.createSuccess');
          this.load({ pageNumber: this.defaultQuery.pageNumber });
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.createError'));
        },
      });
  }

  updateTemplate(
    templateId: string,
    payload: UpdateBranchTemplatePayload,
    onUpdated: () => void,
  ): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .update(templateId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          const mergedTemplate = this.mergeTemplate(templateId, template);
          this.selectedTemplateSignal.set(mergedTemplate);
          this.replaceTemplateInList(mergedTemplate);
          this.successSignal.set('branchTemplates.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.updateError'));
        },
      });
  }

  updateTemplateQuestions(
    templateId: string,
    payload: UpdateBranchTemplateQuestionsPayload,
    onUpdated: () => void,
  ): void {
    if (this.updatingQuestionsSignal()) {
      return;
    }

    this.updatingQuestionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .updateQuestions(templateId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingQuestionsSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          const selection = this.mergeUpdatedQuestionsSelection(
            templateId,
            payload.questionIds,
            result,
          );
          this.questionsSelectionSignal.set(selection);
          this.successSignal.set('branchTemplates.questionsUpdateSuccess');
          const selectedTemplate = this.selectedTemplateSignal();
          if (selectedTemplate?.templateId === templateId) {
            this.selectedTemplateSignal.set({
              ...selectedTemplate,
              questionsCount: result.questionsCount,
            });
          }
          this.replaceTemplateQuestionsCount(templateId, result.questionsCount);
          onUpdated();
        },
        error: (error: unknown) => {
          const errorKey = this.readErrorKey(error, 'branchTemplates.questionsUpdateError');
          this.questionsSelectionErrorSignal.set(errorKey);
          if (this.isInactiveConditionErrorKey(errorKey)) {
            this.refreshQuestionsSelectionAfterConditionError(templateId);
          }
        },
      });
  }

  updateTemplateQuestionsAndConditions(
    templateId: string,
    questionsPayload: UpdateBranchTemplateQuestionsPayload,
    conditionsPayloadFactory: (
      selection: BranchTemplateQuestionSelection,
    ) => UpdateBranchTemplateQuestionConditionsPayload,
    questionsChanged: boolean,
    onUpdated: () => void,
  ): void {
    if (this.updatingQuestionsSignal() || this.updatingQuestionConditionsSignal()) {
      return;
    }

    this.updatingQuestionsSignal.set(true);
    this.updatingQuestionConditionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    const questionsAndSelection$ = questionsChanged
      ? this.branchTemplatesService.updateQuestionConditions(templateId, { conditions: [] }).pipe(
          switchMap(() =>
            this.branchTemplatesService.updateQuestions(templateId, questionsPayload),
          ),
          map((result) => {
            const selection = this.mergeUpdatedQuestionsSelection(
              templateId,
              questionsPayload.questionIds,
              result,
              [],
            );
            this.questionsSelectionSignal.set(selection);
            return selection;
          }),
        )
      : this.branchTemplatesService.getQuestionsSelection(templateId);

    questionsAndSelection$
      .pipe(
        switchMap((selection) => {
          const conditionsPayload = conditionsPayloadFactory(selection);
          const updatedSelection = this.withQuestionConditions(
            selection,
            conditionsPayload.conditions,
          );

          return this.branchTemplatesService
            .updateQuestionConditions(templateId, conditionsPayload)
            .pipe(map(() => updatedSelection));
        }),
        take(1),
        finalize(() => {
          this.updatingQuestionsSignal.set(false);
          this.updatingQuestionConditionsSignal.set(false);
        }),
      )
      .subscribe({
        next: (selection) => {
          this.questionsSelectionSignal.set(selection);
          this.successSignal.set('branchTemplates.questionsUpdateSuccess');
          const selectedTemplate = this.selectedTemplateSignal();
          const questionsCount = this.countSelectedQuestions(selection);
          if (selectedTemplate?.templateId === templateId) {
            this.selectedTemplateSignal.set({
              ...selectedTemplate,
              questionsCount,
            });
          }
          this.replaceTemplateQuestionsCount(templateId, questionsCount);
          onUpdated();
        },
        error: (error: unknown) => {
          const errorKey = this.readErrorKey(error, 'branchTemplates.questionsUpdateError');
          this.questionsSelectionErrorSignal.set(errorKey);
          if (this.isInactiveConditionErrorKey(errorKey)) {
            this.refreshQuestionsSelectionAfterConditionError(templateId);
          }
        },
      });
  }

  updateTemplateQuestionConditions(
    templateId: string,
    payload: UpdateBranchTemplateQuestionConditionsPayload,
    onUpdated: () => void,
  ): void {
    if (this.updatingQuestionConditionsSignal()) {
      return;
    }

    this.updatingQuestionConditionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .updateQuestionConditions(templateId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingQuestionConditionsSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('branchTemplates.conditionsUpdateSuccess');
          this.loadQuestionsSelection(templateId);
          onUpdated();
        },
        error: (error: unknown) => {
          const errorKey = this.readErrorKey(error, 'branchTemplates.conditionsUpdateError');
          this.questionsSelectionErrorSignal.set(errorKey);
          if (this.isInactiveConditionErrorKey(errorKey)) {
            this.refreshQuestionsSelectionAfterConditionError(templateId);
          }
        },
      });
  }

  deleteTemplate(templateId: string, onDeleted: () => void): void {
    if (this.deletingSignal()) {
      return;
    }

    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .delete(templateId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          const mergedTemplate = this.mergeTemplate(templateId, template);
          this.selectedTemplateSignal.set(mergedTemplate);
          this.replaceTemplateInList(mergedTemplate);
          this.successSignal.set('branchTemplates.deleteSuccess');
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.deleteError'));
        },
      });
  }

  restoreTemplate(templateId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.branchTemplatesService
      .restore(templateId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          const mergedTemplate = this.mergeTemplate(templateId, template);
          this.selectedTemplateSignal.set(mergedTemplate);
          this.replaceTemplateInList(mergedTemplate);
          this.successSignal.set('branchTemplates.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'branchTemplates.restoreError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  private mergeUpdatedQuestionsSelection(
    templateId: string,
    requestedQuestionIds: readonly string[],
    result: UpdateBranchTemplateQuestionsResult,
    questionConditions = this.questionsSelectionSignal()?.questionConditions ?? [],
  ): BranchTemplateQuestionSelection {
    const currentSelection = this.questionsSelectionSignal();
    const selectedQuestionsByQuestionId = new Map(
      result.questions
        .filter((question) => question.questionId.length > 0)
        .map((question) => [question.questionId, question]),
    );
    const requestedOrderByQuestionId = new Map(
      requestedQuestionIds.map((questionId, index) => [questionId, index + 1]),
    );
    const baseSelection: BranchTemplateQuestionSelection = currentSelection ?? {
      templateId: result.templateId || templateId,
      branchId: result.branchId,
      templateNameEn: '',
      templateNameAr: '',
      status: 'Draft',
      isActive: true,
      groups: [],
      questionConditions: [],
    };
    const groups = baseSelection.groups.map((group) => ({
      ...group,
      questions: group.questions.map((question) => {
        const selectedQuestion = selectedQuestionsByQuestionId.get(question.questionId);
        if (!selectedQuestion) {
          return {
            ...question,
            isSelected: false,
            templateQuestionId: null,
            order: null,
          };
        }

        return {
          ...question,
          isSelected: true,
          templateQuestionId: selectedQuestion.templateQuestionId || question.templateQuestionId,
          order:
            selectedQuestion.order ||
            requestedOrderByQuestionId.get(question.questionId) ||
            question.order,
        };
      }),
    }));
    const selectedTemplateQuestionIds = new Set(
      groups
        .flatMap((group) => group.questions)
        .filter(
          (question) =>
            question.isSelected &&
            question.templateQuestionId !== null &&
            question.templateQuestionId.length > 0,
        )
        .map((question) => question.templateQuestionId as string),
    );

    return {
      ...baseSelection,
      templateId: result.templateId || baseSelection.templateId || templateId,
      branchId: result.branchId || baseSelection.branchId,
      groups,
      questionConditions: questionConditions.filter(
        (condition) =>
          selectedTemplateQuestionIds.has(condition.parentTemplateQuestionId) &&
          selectedTemplateQuestionIds.has(condition.childTemplateQuestionId),
      ),
    };
  }

  private withQuestionConditions(
    selection: BranchTemplateQuestionSelection,
    conditions: readonly QuestionConditionPayload[],
  ): BranchTemplateQuestionSelection {
    return {
      ...selection,
      questionConditions: conditions.map(
        (condition, index): QuestionCondition => ({
          conditionId: '',
          parentTemplateQuestionId: condition.parentTemplateQuestionId,
          childTemplateQuestionId: condition.childTemplateQuestionId,
          triggerType: condition.triggerType,
          triggerTypeName: triggerTypeName(condition.triggerType),
          selectedQuestionOptionId: condition.selectedQuestionOptionId,
          triggerValue: condition.triggerValue,
          order: condition.order || index + 1,
        }),
      ),
    };
  }

  private countSelectedQuestions(selection: BranchTemplateQuestionSelection): number {
    return selection.groups.reduce(
      (total, group) => total + group.questions.filter((question) => question.isSelected).length,
      0,
    );
  }

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();
    if (code.includes('namealreadyexists') || code.includes('templatealreadyexists')) {
      return 'branchTemplates.nameAlreadyExists';
    }
    if (code.includes('branchscopemismatch')) {
      return 'branchTemplates.scopeMismatch';
    }
    if (code.includes('alreadyinactive') || code.includes('templateinactive')) {
      return 'branchTemplates.alreadyInactive';
    }
    if (code.includes('alreadyactive') || code.includes('templateactive')) {
      return 'branchTemplates.alreadyActive';
    }
    if (code.includes('parentquestioninactive')) {
      return 'branchTemplates.conditionParentQuestionInactive';
    }
    if (code.includes('parentquestiongroupinactive')) {
      return 'branchTemplates.conditionParentQuestionGroupInactive';
    }
    if (code.includes('childquestioninactive')) {
      return 'branchTemplates.conditionChildQuestionInactive';
    }
    if (code.includes('childquestiongroupinactive')) {
      return 'branchTemplates.conditionChildQuestionGroupInactive';
    }
    if (code.includes('custominputnameduplicated')) {
      return 'branchTemplates.customInputNameDuplicated';
    }
    if (code.includes('custominputorderduplicated')) {
      return 'branchTemplates.customInputOrderDuplicated';
    }
    if (code.includes('custominputstringvalidationinvalid')) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }
    if (code.includes('custominputintegervalidationinvalid')) {
      return 'branchTemplates.customInputIntegerValidationInvalid';
    }
    if (code.includes('custominputtypecannotbechanged')) {
      return 'branchTemplates.customInputTypeCannotBeChanged';
    }
    if (code.includes('custominputnotfound')) {
      return 'branchTemplates.customInputNotFound';
    }
    if (code.includes('custominputidduplicated')) {
      return 'branchTemplates.customInputIdDuplicated';
    }
    if (code.includes('custominputs') || code.includes('custominput')) {
      return 'branchTemplates.customInputsInvalid';
    }

    if (error.status === 401) {
      return 'branchTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'branchTemplates.forbidden';
    }
    if (error.status === 404) {
      return 'branchTemplates.notFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'branchTemplates.unprocessable';
    }

    return fallbackKey;
  }

  private readErrorMarker(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return [
      firstError?.code,
      firstError?.messageName,
      firstError?.message,
      errorBody.detail,
      errorBody.title,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }

  private readProblemDetailsMessage(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.message ?? errorBody.detail ?? errorBody.title ?? '';
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null;
  }

  private isInactiveConditionErrorKey(errorKey: string): boolean {
    return (
      errorKey === 'branchTemplates.conditionParentQuestionInactive' ||
      errorKey === 'branchTemplates.conditionParentQuestionGroupInactive' ||
      errorKey === 'branchTemplates.conditionChildQuestionInactive' ||
      errorKey === 'branchTemplates.conditionChildQuestionGroupInactive'
    );
  }

  private refreshQuestionsSelectionAfterConditionError(templateId: string): void {
    this.questionsSelectionLoadingSignal.set(true);

    this.branchTemplatesService
      .getQuestionsSelection(templateId)
      .pipe(
        take(1),
        finalize(() => this.questionsSelectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (selection) => {
          this.questionsSelectionSignal.set(selection);
        },
        error: () => {
          this.questionsSelectionSignal.set(null);
        },
      });
  }

  private replaceTemplateInList(template: BranchTemplate): void {
    this.templatesSignal.update((templates) => {
      if (!this.matchesActiveFilter(template)) {
        if (
          templates.some((currentTemplate) => currentTemplate.templateId === template.templateId)
        ) {
          this.totalItemsSignal.update((totalItems) => Math.max(0, totalItems - 1));
        }
        return templates.filter(
          (currentTemplate) => currentTemplate.templateId !== template.templateId,
        );
      }

      return templates.map((currentTemplate) =>
        currentTemplate.templateId === template.templateId ? template : currentTemplate,
      );
    });
  }

  private mergeTemplate(templateId: string, template: BranchTemplate): BranchTemplate {
    const selectedTemplate = this.selectedTemplateSignal();
    const listTemplate = this.templatesSignal().find(
      (current) => current.templateId === templateId,
    );
    const currentTemplate =
      selectedTemplate?.templateId === templateId
        ? selectedTemplate
        : (listTemplate ?? selectedTemplate);

    return {
      templateId: template.templateId || currentTemplate?.templateId || templateId,
      branchId: template.branchId || currentTemplate?.branchId || '',
      branchNameEn: template.branchNameEn || currentTemplate?.branchNameEn || '',
      branchNameAr: template.branchNameAr ?? currentTemplate?.branchNameAr ?? null,
      branchCode: template.branchCode || currentTemplate?.branchCode || '',
      nameEn: template.nameEn || currentTemplate?.nameEn || '',
      nameAr: template.nameAr || currentTemplate?.nameAr || '',
      description: template.description || currentTemplate?.description || '',
      activeFrom: template.activeFrom || currentTemplate?.activeFrom || '',
      expireTo: template.expireTo ?? currentTemplate?.expireTo ?? null,
      status: template.status || currentTemplate?.status || 'Draft',
      isActive: template.isActive,
      questionsCount: template.questionsCount || currentTemplate?.questionsCount || 0,
      groupsCount: template.groupsCount || currentTemplate?.groupsCount || 0,
      customInputsCount: template.customInputsCount || currentTemplate?.customInputsCount || 0,
      createdBy: template.createdBy ?? currentTemplate?.createdBy ?? null,
      createdOnUtc: template.createdOnUtc || currentTemplate?.createdOnUtc || '',
      customInputs:
        template.customInputs.length > 0
          ? template.customInputs
          : (currentTemplate?.customInputs ?? []),
      questions:
        template.questions.length > 0 ? template.questions : (currentTemplate?.questions ?? []),
      questionConditions:
        template.questionConditions.length > 0
          ? template.questionConditions
          : (currentTemplate?.questionConditions ?? []),
    };
  }

  private matchesActiveFilter(template: BranchTemplate): boolean {
    const isActive = this.isActiveSignal();
    return isActive === null || template.isActive === isActive;
  }

  private replaceTemplateQuestionsCount(templateId: string, questionsCount: number): void {
    this.templatesSignal.update((templates) =>
      templates.map((template) =>
        template.templateId === templateId ? { ...template, questionsCount } : template,
      ),
    );
  }
}
