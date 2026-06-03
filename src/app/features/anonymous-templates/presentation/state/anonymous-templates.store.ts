import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map, switchMap, take } from 'rxjs';
import {
  AnonymousTemplate,
  AnonymousTemplateAssignedQuestion,
  AnonymousTemplateListItem,
  AnonymousTemplateQuestionSelectionItem,
  AnonymousTemplateQuestionsSelection,
  AnonymousTemplateResponseDetails,
  AnonymousTemplateResponseListItem,
  AnonymousTemplateResponsesListQuery,
  AnonymousTemplateStateChange,
  AnonymousTemplatesListQuery,
  AssignAnonymousTemplateQuestionsPayload,
  AssignAnonymousTemplateQuestionsResult,
  CreateAnonymousTemplatePayload,
  ManageAnonymousTemplateQuestionConditionsPayload,
  ManageAnonymousTemplateQuestionConditionsResult,
  UpdateAnonymousTemplatePayload,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesService } from '../../data/anonymous-templates.service';

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
export class AnonymousTemplatesStore {
  private readonly defaultQuery: AnonymousTemplatesListQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    orderSort: '',
    scope: null,
    branchId: null,
    isActive: null,
  };
  private readonly defaultResponsesQuery: AnonymousTemplateResponsesListQuery = {
    pageNumber: 1,
    pageSize: 10,
    orderSort: '',
    fromDate: null,
    toDate: null,
    minScorePercentage: null,
    maxScorePercentage: null,
  };

  private readonly anonymousTemplatesService = inject(AnonymousTemplatesService);
  private readonly templatesSignal = signal<readonly AnonymousTemplateListItem[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly querySignal = signal<AnonymousTemplatesListQuery>(this.defaultQuery);
  private readonly loadingSignal = signal(false);
  private readonly selectedTemplateSignal = signal<AnonymousTemplate | null>(null);
  private readonly detailsLoadingSignal = signal(false);
  private readonly detailsErrorSignal = signal<string | null>(null);
  private readonly responsesSignal = signal<readonly AnonymousTemplateResponseListItem[]>([]);
  private readonly responsesCurrentPageSignal = signal(this.defaultResponsesQuery.pageNumber);
  private readonly responsesPageSizeSignal = signal(this.defaultResponsesQuery.pageSize);
  private readonly responsesTotalItemsSignal = signal(0);
  private readonly responsesQuerySignal = signal<AnonymousTemplateResponsesListQuery>(
    this.defaultResponsesQuery,
  );
  private readonly responsesLoadingSignal = signal(false);
  private readonly responsesErrorSignal = signal<string | null>(null);
  private readonly selectedResponseSignal = signal<AnonymousTemplateResponseDetails | null>(null);
  private readonly responseDetailsLoadingSignal = signal(false);
  private readonly responseDetailsErrorSignal = signal<string | null>(null);
  private readonly questionsSelectionSignal = signal<AnonymousTemplateQuestionsSelection | null>(
    null,
  );
  private readonly questionsSelectionLoadingSignal = signal(false);
  private readonly questionsSelectionErrorSignal = signal<string | null>(null);
  private readonly createdTemplateSignal = signal<AnonymousTemplate | null>(null);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly assigningQuestionsSignal = signal(false);
  private readonly managingQuestionConditionsSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly templates = this.templatesSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())),
  );
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());
  readonly selectedTemplate = this.selectedTemplateSignal.asReadonly();
  readonly detailsLoading = this.detailsLoadingSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();
  readonly responses = this.responsesSignal.asReadonly();
  readonly responsesCurrentPage = this.responsesCurrentPageSignal.asReadonly();
  readonly responsesPageSize = this.responsesPageSizeSignal.asReadonly();
  readonly responsesTotalItems = this.responsesTotalItemsSignal.asReadonly();
  readonly responsesLoading = this.responsesLoadingSignal.asReadonly();
  readonly responsesError = this.responsesErrorSignal.asReadonly();
  readonly responsesTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.responsesTotalItemsSignal() / this.responsesPageSizeSignal())),
  );
  readonly responsesHasPreviousPage = computed(() => this.responsesCurrentPageSignal() > 1);
  readonly responsesHasNextPage = computed(
    () => this.responsesCurrentPageSignal() < this.responsesTotalPages(),
  );
  readonly selectedResponse = this.selectedResponseSignal.asReadonly();
  readonly responseDetailsLoading = this.responseDetailsLoadingSignal.asReadonly();
  readonly responseDetailsError = this.responseDetailsErrorSignal.asReadonly();
  readonly questionsSelection = this.questionsSelectionSignal.asReadonly();
  readonly questionsSelectionLoading = this.questionsSelectionLoadingSignal.asReadonly();
  readonly questionsSelectionError = this.questionsSelectionErrorSignal.asReadonly();
  readonly createdTemplate = this.createdTemplateSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly assigningQuestions = this.assigningQuestionsSignal.asReadonly();
  readonly managingQuestionConditions = this.managingQuestionConditionsSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  load(query: Partial<AnonymousTemplatesListQuery> = {}): void {
    if (this.loadingSignal()) {
      return;
    }

    const nextQuery: AnonymousTemplatesListQuery = {
      ...this.querySignal(),
      ...query,
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
    };

    this.querySignal.set(nextQuery);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.anonymousTemplatesService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.templatesSignal.set(page.data);
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
        },
        error: (error: unknown) => {
          this.templatesSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readListErrorKey(error));
        },
      });
  }

  deleteTemplate(anonymousTemplateId: string, onDeleted: () => void): void {
    if (this.deletingSignal()) {
      return;
    }

    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.anonymousTemplatesService
      .deleteTemplate(anonymousTemplateId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: (stateChange) => {
          this.patchTemplateState(stateChange);
          this.successSignal.set('anonymousTemplates.deleteSuccess');
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readDeleteErrorKey(error));
        },
      });
  }

  restoreTemplate(anonymousTemplateId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.anonymousTemplatesService
      .restoreTemplate(anonymousTemplateId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: (stateChange) => {
          this.patchTemplateState(stateChange);
          this.successSignal.set('anonymousTemplates.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readRestoreErrorKey(error));
        },
      });
  }

  updateTemplate(
    anonymousTemplateId: string,
    payload: UpdateAnonymousTemplatePayload,
    onUpdated: () => void,
  ): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.anonymousTemplatesService
      .update(anonymousTemplateId, payload)
      .pipe(
        switchMap(() => this.anonymousTemplatesService.details(anonymousTemplateId)),
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          this.selectedTemplateSignal.set(template);
          this.successSignal.set('anonymousTemplates.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readUpdateErrorKey(error));
        },
      });
  }

  search(
    searchText: string,
    isActive: boolean | null,
    pageSize: number,
    orderSort: string,
    scope: AnonymousTemplatesListQuery['scope'],
    branchId: string | null,
  ): void {
    this.load({
      pageNumber: 1,
      pageSize,
      searchText,
      orderSort,
      scope,
      branchId,
      isActive,
    });
  }

  previousPage(): void {
    if (this.hasPreviousPage() && !this.loadingSignal()) {
      this.load({ pageNumber: this.currentPageSignal() - 1 });
    }
  }

  nextPage(): void {
    if (this.hasNextPage() && !this.loadingSignal()) {
      this.load({ pageNumber: this.currentPageSignal() + 1 });
    }
  }

  loadDetails(anonymousTemplateId: string): void {
    if (this.detailsLoadingSignal()) {
      return;
    }

    this.selectedTemplateSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.detailsLoadingSignal.set(true);

    this.anonymousTemplatesService
      .details(anonymousTemplateId)
      .pipe(
        take(1),
        finalize(() => this.detailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          this.selectedTemplateSignal.set(template);
        },
        error: (error: unknown) => {
          this.selectedTemplateSignal.set(null);
          this.detailsErrorSignal.set(this.readDetailsErrorKey(error));
        },
      });
  }

  loadResponses(
    anonymousTemplateId: string,
    query: Partial<AnonymousTemplateResponsesListQuery> = {},
  ): void {
    if (this.responsesLoadingSignal()) {
      return;
    }

    const nextQuery: AnonymousTemplateResponsesListQuery = {
      ...this.responsesQuerySignal(),
      ...query,
      pageNumber: query.pageNumber ?? this.responsesCurrentPageSignal(),
      pageSize: query.pageSize ?? this.responsesPageSizeSignal(),
    };

    this.responsesQuerySignal.set(nextQuery);
    this.responsesLoadingSignal.set(true);
    this.responsesErrorSignal.set(null);

    this.anonymousTemplatesService
      .responses(anonymousTemplateId, nextQuery)
      .pipe(
        take(1),
        finalize(() => this.responsesLoadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.responsesSignal.set(page.data);
          this.responsesCurrentPageSignal.set(page.currentPage);
          this.responsesPageSizeSignal.set(page.pageSize);
          this.responsesTotalItemsSignal.set(page.totalItems);
        },
        error: (error: unknown) => {
          this.responsesSignal.set([]);
          this.responsesTotalItemsSignal.set(0);
          this.responsesErrorSignal.set(this.readResponsesErrorKey(error));
        },
      });
  }

  searchResponses(
    anonymousTemplateId: string,
    pageSize: number,
    orderSort: string,
    fromDate: string | null,
    toDate: string | null,
    minScorePercentage: number | null,
    maxScorePercentage: number | null,
  ): void {
    this.loadResponses(anonymousTemplateId, {
      pageNumber: 1,
      pageSize,
      orderSort,
      fromDate,
      toDate,
      minScorePercentage,
      maxScorePercentage,
    });
  }

  previousResponsesPage(anonymousTemplateId: string): void {
    if (this.responsesHasPreviousPage() && !this.responsesLoadingSignal()) {
      this.loadResponses(anonymousTemplateId, {
        pageNumber: this.responsesCurrentPageSignal() - 1,
      });
    }
  }

  nextResponsesPage(anonymousTemplateId: string): void {
    if (this.responsesHasNextPage() && !this.responsesLoadingSignal()) {
      this.loadResponses(anonymousTemplateId, {
        pageNumber: this.responsesCurrentPageSignal() + 1,
      });
    }
  }

  loadResponseDetails(anonymousTemplateId: string, responseId: string): void {
    if (this.responseDetailsLoadingSignal()) {
      return;
    }

    this.selectedResponseSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
    this.responseDetailsLoadingSignal.set(true);

    this.anonymousTemplatesService
      .responseDetails(anonymousTemplateId, responseId)
      .pipe(
        take(1),
        finalize(() => this.responseDetailsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.selectedResponseSignal.set(response);
        },
        error: (error: unknown) => {
          this.selectedResponseSignal.set(null);
          this.responseDetailsErrorSignal.set(this.readResponseDetailsErrorKey(error));
        },
      });
  }

  loadQuestionsSelection(anonymousTemplateId: string, searchText = ''): void {
    if (this.questionsSelectionLoadingSignal()) {
      return;
    }

    this.questionsSelectionLoadingSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);

    this.anonymousTemplatesService
      .questionsSelection(anonymousTemplateId, searchText)
      .pipe(
        take(1),
        finalize(() => this.questionsSelectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (selection) => {
          this.questionsSelectionSignal.set(selection);
        },
        error: (error: unknown) => {
          this.questionsSelectionSignal.set(null);
          this.questionsSelectionErrorSignal.set(this.readQuestionsSelectionErrorKey(error));
        },
      });
  }

  assignQuestions(
    anonymousTemplateId: string,
    payload: AssignAnonymousTemplateQuestionsPayload,
    onAssigned: (selection: AnonymousTemplateQuestionsSelection) => void,
  ): void {
    if (this.assigningQuestionsSignal()) {
      return;
    }

    this.assigningQuestionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.anonymousTemplatesService
      .assignQuestions(anonymousTemplateId, payload)
      .pipe(
        take(1),
        finalize(() => this.assigningQuestionsSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          const selection = this.mergeAssignedQuestionsSelection(anonymousTemplateId, result);
          this.questionsSelectionSignal.set(selection);
          this.successSignal.set('anonymousTemplates.questionsAssignSuccess');
          this.patchTemplateQuestionsCount(
            result.anonymousTemplateId,
            result.assignedQuestionsCount,
          );
          onAssigned(selection);
        },
        error: (error: unknown) => {
          this.questionsSelectionErrorSignal.set(this.readAssignQuestionsErrorKey(error));
        },
      });
  }

  saveQuestionsAndConditions(
    anonymousTemplateId: string,
    questionsPayload: AssignAnonymousTemplateQuestionsPayload,
    conditionsPayloadFactory: (
      selection: AnonymousTemplateQuestionsSelection,
    ) => ManageAnonymousTemplateQuestionConditionsPayload,
    questionsChanged: boolean,
    onSaved: (selection: AnonymousTemplateQuestionsSelection) => void,
  ): void {
    if (this.assigningQuestionsSignal() || this.managingQuestionConditionsSignal()) {
      return;
    }

    this.assigningQuestionsSignal.set(true);
    this.managingQuestionConditionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    const questionsAndSelection$ = questionsChanged
      ? this.anonymousTemplatesService.assignQuestions(anonymousTemplateId, questionsPayload).pipe(
          map((result) => {
            const selection = this.mergeAssignedQuestionsSelection(anonymousTemplateId, result);
            this.patchTemplateQuestionsCount(
              result.anonymousTemplateId,
              result.assignedQuestionsCount,
            );
            return selection;
          }),
        )
      : this.anonymousTemplatesService.questionsSelection(anonymousTemplateId);

    questionsAndSelection$
      .pipe(
        switchMap((selection) => {
          const conditionsPayload = conditionsPayloadFactory(selection);
          return this.anonymousTemplatesService
            .manageQuestionConditions(anonymousTemplateId, conditionsPayload)
            .pipe(
              map((result) => ({
                selection,
                result,
              })),
            );
        }),
        take(1),
        finalize(() => {
          this.assigningQuestionsSignal.set(false);
          this.managingQuestionConditionsSignal.set(false);
        }),
      )
      .subscribe({
        next: ({ selection, result }) => {
          this.questionsSelectionSignal.set(selection);
          this.patchTemplateQuestionConditions(result);
          this.successSignal.set('anonymousTemplates.conditionsUpdateSuccess');
          onSaved(selection);
        },
        error: (error: unknown) => {
          this.questionsSelectionErrorSignal.set(this.readManageConditionsErrorKey(error));
        },
      });
  }

  manageQuestionConditions(
    anonymousTemplateId: string,
    payload: ManageAnonymousTemplateQuestionConditionsPayload,
    onSaved: () => void,
  ): void {
    if (this.managingQuestionConditionsSignal()) {
      return;
    }

    this.managingQuestionConditionsSignal.set(true);
    this.questionsSelectionErrorSignal.set(null);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.anonymousTemplatesService
      .manageQuestionConditions(anonymousTemplateId, payload)
      .pipe(
        take(1),
        finalize(() => this.managingQuestionConditionsSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.patchTemplateQuestionConditions(result);
          this.successSignal.set('anonymousTemplates.conditionsUpdateSuccess');
          onSaved();
        },
        error: (error: unknown) => {
          this.questionsSelectionErrorSignal.set(this.readManageConditionsErrorKey(error));
        },
      });
  }

  clearDetails(): void {
    this.selectedTemplateSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.questionsSelectionSignal.set(null);
    this.questionsSelectionErrorSignal.set(null);
    this.responsesSignal.set([]);
    this.responsesErrorSignal.set(null);
    this.selectedResponseSignal.set(null);
    this.responseDetailsErrorSignal.set(null);
  }

  createTemplate(payload: CreateAnonymousTemplatePayload, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);
    this.createdTemplateSignal.set(null);

    this.anonymousTemplatesService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (template) => {
          this.createdTemplateSignal.set(template);
          this.successSignal.set('anonymousTemplates.createSuccess');
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
    this.questionsSelectionErrorSignal.set(null);
  }

  clearCreatedTemplate(): void {
    this.createdTemplateSignal.set(null);
  }

  private patchTemplateState(stateChange: AnonymousTemplateStateChange): void {
    this.templatesSignal.update((templates) =>
      templates.map((template) =>
        template.anonymousTemplateId === stateChange.anonymousTemplateId
          ? {
              ...template,
              ...stateChange,
              statusName: stateChange.statusName || template.statusName,
            }
          : template,
      ),
    );

    const selectedTemplate = this.selectedTemplateSignal();
    if (selectedTemplate?.anonymousTemplateId === stateChange.anonymousTemplateId) {
      this.selectedTemplateSignal.set({
        ...selectedTemplate,
        ...stateChange,
        statusName: stateChange.statusName || selectedTemplate.statusName,
      });
    }
  }

  private mergeAssignedQuestionsSelection(
    anonymousTemplateId: string,
    result: AssignAnonymousTemplateQuestionsResult,
  ): AnonymousTemplateQuestionsSelection {
    const currentSelection = this.questionsSelectionSignal();
    const assignedQuestionsByQuestionId = new Map(
      result.questions.map((question) => [question.questionId, question]),
    );
    const existingQuestionIds = new Set(
      currentSelection?.questions.map((question) => question.questionId) ?? [],
    );
    const baseSelection: AnonymousTemplateQuestionsSelection = currentSelection ?? {
      anonymousTemplateId: result.anonymousTemplateId || anonymousTemplateId,
      branchId: result.branchId,
      scope: result.scope,
      scopeName: result.scopeName,
      isGlobal: result.isGlobal,
      nameEn: '',
      nameAr: null,
      selectedQuestionsCount: 0,
      questions: [],
    };
    const updatedExistingQuestions = baseSelection.questions.map((question) => {
      const assignedQuestion = assignedQuestionsByQuestionId.get(question.questionId);
      if (!assignedQuestion) {
        return {
          ...question,
          isSelected: false,
          anonymousTemplateQuestionId: null,
          selectedOrder: null,
        };
      }

      return {
        ...question,
        ...this.toSelectionQuestion(assignedQuestion, question),
        isSelected: true,
        selectedOrder: assignedQuestion.order,
      };
    });
    const appendedQuestions = result.questions
      .filter((question) => !existingQuestionIds.has(question.questionId))
      .map((question) => this.toSelectionQuestion(question));

    return {
      ...baseSelection,
      anonymousTemplateId: result.anonymousTemplateId || baseSelection.anonymousTemplateId,
      branchId: result.branchId,
      scope: result.scope,
      scopeName: result.scopeName,
      isGlobal: result.isGlobal,
      selectedQuestionsCount: result.assignedQuestionsCount,
      questions: [...updatedExistingQuestions, ...appendedQuestions],
    };
  }

  private toSelectionQuestion(
    question: AnonymousTemplateAssignedQuestion,
    currentQuestion?: AnonymousTemplateQuestionSelectionItem,
  ): AnonymousTemplateQuestionSelectionItem {
    return {
      scope: question.scope,
      scopeName: question.scopeName,
      isGlobal: question.isGlobal,
      isSelectable: currentQuestion?.isSelectable ?? true,
      isEditable: currentQuestion?.isEditable ?? !question.isGlobal,
      questionId: question.questionId,
      anonymousTemplateQuestionId: question.anonymousTemplateQuestionId,
      branchId: question.branchId,
      groupId: question.groupId,
      groupNameEn: question.groupNameEn,
      groupNameAr: question.groupNameAr,
      isSelected: true,
      selectedOrder: question.order,
      textEn: question.textEn,
      textAr: question.textAr,
      type: question.type,
      typeName: question.typeName,
      isActive: currentQuestion?.isActive ?? true,
      options: currentQuestion?.options ?? [],
    };
  }

  private patchTemplateQuestionsCount(anonymousTemplateId: string, questionsCount: number): void {
    this.templatesSignal.update((templates) =>
      templates.map((template) =>
        template.anonymousTemplateId === anonymousTemplateId
          ? { ...template, questionsCount }
          : template,
      ),
    );

    const selectedTemplate = this.selectedTemplateSignal();
    if (selectedTemplate?.anonymousTemplateId === anonymousTemplateId) {
      this.selectedTemplateSignal.set({
        ...selectedTemplate,
        questionsCount,
        summary: {
          ...selectedTemplate.summary,
          questionsCount,
        },
      });
    }
  }

  private patchTemplateQuestionConditions(
    result: ManageAnonymousTemplateQuestionConditionsResult,
  ): void {
    const selectedTemplate = this.selectedTemplateSignal();

    if (selectedTemplate?.anonymousTemplateId !== result.anonymousTemplateId) {
      return;
    }

    this.selectedTemplateSignal.set({
      ...selectedTemplate,
      questionConditions: result.conditions,
      questionConditionsCount: result.conditionsCount,
      summary: {
        ...selectedTemplate.summary,
        questionConditionsCount: result.conditionsCount,
      },
    });
  }

  private readListErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.listError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('pagenumber') && code.includes('invalid')) {
      return 'anonymousTemplates.pageNumberInvalid';
    }
    if (code.includes('pagesize') && code.includes('max')) {
      return 'anonymousTemplates.pageSizeMax';
    }
    if (code.includes('pagesize') && code.includes('invalid')) {
      return 'anonymousTemplates.pageSizeInvalid';
    }
    if (code.includes('scope') && code.includes('invalid')) {
      return 'anonymousTemplates.scopeInvalid';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }

    return 'anonymousTemplates.listError';
  }

  private readResponsesErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.responsesLoadError';
    }

    const code = this.readErrorMarker(error.error).replace(/[\s_.-]/g, '').toLowerCase();

    if (code.includes('pagenumber') && code.includes('invalid')) {
      return 'anonymousTemplates.pageNumberInvalid';
    }
    if (code.includes('pagesize') && code.includes('max')) {
      return 'anonymousTemplates.pageSizeMax';
    }
    if (code.includes('score') && code.includes('range')) {
      return 'anonymousTemplates.responsesScoreRangeInvalid';
    }
    if (code.includes('date') && code.includes('range')) {
      return 'anonymousTemplates.responsesDateRangeInvalid';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.responsesLoadError';
  }

  private readResponseDetailsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.responseDetailsLoadError';
    }

    const code = this.readErrorMarker(error.error).replace(/[\s_.-]/g, '').toLowerCase();

    if (code.includes('response') && code.includes('notfound')) {
      return 'anonymousTemplates.responseDetailsNotFound';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.responseDetailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.responseDetailsLoadError';
  }

  private readDetailsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.detailsError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('anonymoustemplateid') && code.includes('required')) {
      return 'anonymousTemplates.detailsIdRequired';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }

    return 'anonymousTemplates.detailsError';
  }

  private readQuestionsSelectionErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.questionsSelectionLoadError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('searchtext') && code.includes('maxlength')) {
      return 'anonymousTemplates.questionsSelectionSearchMaxLength';
    }
    if (code.includes('anonymoustemplateid') && code.includes('required')) {
      return 'anonymousTemplates.detailsIdRequired';
    }
    if (code.includes('template') && code.includes('inactive')) {
      return 'anonymousTemplates.templateInactive';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.questionsSelectionLoadError';
  }

  private readAssignQuestionsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.questionsAssignError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('questionduplicated')) {
      return 'anonymousTemplates.questionDuplicated';
    }
    if (code.includes('orderduplicated')) {
      return 'anonymousTemplates.questionOrderDuplicated';
    }
    if (code.includes('orderinvalid')) {
      return 'anonymousTemplates.questionOrderInvalid';
    }
    if (code.includes('globaltemplateglobalquestionsonly')) {
      return 'anonymousTemplates.globalTemplateGlobalQuestionsOnly';
    }
    if (code.includes('questionnotallowed')) {
      return 'anonymousTemplates.questionNotAllowed';
    }
    if (code.includes('questioninactive')) {
      return 'anonymousTemplates.questionInactive';
    }
    if (code.includes('questionnotfound')) {
      return 'anonymousTemplates.questionNotFound';
    }
    if (code.includes('questionsinvalid')) {
      return 'anonymousTemplates.questionsInvalid';
    }
    if (code.includes('anonymoustemplateid') && code.includes('required')) {
      return 'anonymousTemplates.detailsIdRequired';
    }
    if (code.includes('template') && code.includes('inactive')) {
      return 'anonymousTemplates.templateInactive';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.questionsAssignError';
  }

  private readManageConditionsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.conditionsUpdateError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('parentandchildcannotbesame')) {
      return 'anonymousTemplates.conditionParentChildSame';
    }
    if (code.includes('circularflowdetected')) {
      return 'anonymousTemplates.conditionCircularFlow';
    }
    if (code.includes('triggerdoesnotmatchparentquestion')) {
      return 'anonymousTemplates.conditionTriggerMismatch';
    }
    if (code.includes('triggershapeinvalid')) {
      return 'anonymousTemplates.conditionTriggerShapeInvalid';
    }
    if (code.includes('parentquestiontypenotallowed')) {
      return 'anonymousTemplates.conditionParentTypeNotAllowed';
    }
    if (code.includes('selectedoption') && code.includes('notbelong')) {
      return 'anonymousTemplates.conditionSelectedOptionNotParentOption';
    }
    if (code.includes('selectedoption') && code.includes('notfound')) {
      return 'anonymousTemplates.conditionSelectedOptionNotFound';
    }
    if (code.includes('selectedoption') && code.includes('inactive')) {
      return 'anonymousTemplates.conditionSelectedOptionInactive';
    }
    if (code.includes('duplicated')) {
      return 'anonymousTemplates.conditionDuplicated';
    }
    if (code.includes('order') && code.includes('invalid')) {
      return 'anonymousTemplates.conditionOrderInvalid';
    }
    if (code.includes('parentquestion') && code.includes('notfound')) {
      return 'anonymousTemplates.conditionParentQuestionNotFound';
    }
    if (code.includes('childquestion') && code.includes('notfound')) {
      return 'anonymousTemplates.conditionChildQuestionNotFound';
    }
    if (code.includes('conditionsinvalid')) {
      return 'anonymousTemplates.conditionsInvalid';
    }
    if (code.includes('anonymoustemplateid') && code.includes('required')) {
      return 'anonymousTemplates.detailsIdRequired';
    }
    if (code.includes('template') && code.includes('inactive')) {
      return 'anonymousTemplates.templateInactive';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.conditionsUpdateError';
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.createError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('namealreadyexists')) {
      return 'anonymousTemplates.nameAlreadyExists';
    }
    if (code.includes('superadmin') && code.includes('globalonly')) {
      return 'anonymousTemplates.superAdminGlobalOnly';
    }
    if (code.includes('branchactor') && code.includes('branchonly')) {
      return 'anonymousTemplates.branchActorBranchOnly';
    }
    if (code.includes('scope') && code.includes('invalid')) {
      return 'anonymousTemplates.scopeInvalid';
    }
    if (code.includes('expireto') && code.includes('mustbeafteractivefrom')) {
      return 'branchTemplates.expireToAfterActiveFrom';
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
    if (code.includes('custominputs') || code.includes('custominput')) {
      return 'branchTemplates.customInputsInvalid';
    }

    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'anonymousTemplates.forbidden';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.createError';
  }

  private readUpdateErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.updateError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('templateinactive')) {
      return 'anonymousTemplates.templateInactive';
    }
    if (code.includes('namealreadyexists')) {
      return 'anonymousTemplates.nameAlreadyExists';
    }
    if (code.includes('expireto') && code.includes('mustbeafteractivefrom')) {
      return 'branchTemplates.expireToAfterActiveFrom';
    }
    if (code.includes('custominputtypecannotbechanged')) {
      return 'anonymousTemplates.customInputTypeCannotBeChanged';
    }
    if (code.includes('custominputnotfound')) {
      return 'anonymousTemplates.customInputNotFound';
    }
    if (code.includes('custominputidduplicated')) {
      return 'anonymousTemplates.customInputIdDuplicated';
    }
    if (code.includes('custominputnameduplicated')) {
      return 'branchTemplates.customInputNameDuplicated';
    }
    if (code.includes('custominputorderduplicated')) {
      return 'branchTemplates.customInputOrderDuplicated';
    }
    if (
      code.includes('custominputstringvalidationinvalid') ||
      code.includes('custominputlengthrangeinvalid')
    ) {
      return 'branchTemplates.customInputStringValidationInvalid';
    }
    if (
      code.includes('custominputintegervalidationinvalid') ||
      code.includes('custominputvaluerangeinvalid')
    ) {
      return 'branchTemplates.customInputIntegerValidationInvalid';
    }
    if (code.includes('custominputs') || code.includes('custominput')) {
      return 'branchTemplates.customInputsInvalid';
    }

    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.updateError';
  }

  private readDeleteErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.deleteError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('alreadyinactive')) {
      return 'anonymousTemplates.templateAlreadyInactive';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.deleteError';
  }

  private readRestoreErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'anonymousTemplates.restoreError';
    }

    const code = this.readErrorMarker(error.error)
      .replace(/[\s_.-]/g, '')
      .toLowerCase();

    if (code.includes('alreadyactive')) {
      return 'anonymousTemplates.templateAlreadyActive';
    }
    if (code.includes('template') && code.includes('notfound')) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 401) {
      return 'anonymousTemplates.unauthorized';
    }
    if (error.status === 403 || error.status === 404) {
      return 'anonymousTemplates.detailsNotFound';
    }
    if (error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'anonymousTemplates.unprocessable';
    }

    return 'anonymousTemplates.restoreError';
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
}
