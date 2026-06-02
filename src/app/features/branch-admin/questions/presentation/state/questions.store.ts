import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { QuestionGroupSelectionItem } from '../../../question-groups/domain/question-group.model';
import { QuestionGroupsService } from '../../../question-groups/data/question-groups.service';
import {
  CreateQuestionRequest,
  QuestionListItem,
  QuestionsFilter,
  UpdateQuestionRequest,
} from '../../domain/question.model';
import { QuestionsService } from '../../data/questions.service';

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
export class QuestionsStore {
  private readonly defaultQuery: QuestionsFilter = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    orderSort: '',
    isActive: null,
  };

  private readonly questionsService = inject(QuestionsService);
  private readonly questionGroupsService = inject(QuestionGroupsService);
  private readonly questionsSignal = signal<readonly QuestionListItem[]>([]);
  private readonly groupsSelectionSignal = signal<readonly QuestionGroupSelectionItem[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly groupIdSignal = signal<string | null>(null);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly orderSortSignal = signal(this.defaultQuery.orderSort);
  private readonly isActiveSignal = signal<boolean | null>(this.defaultQuery.isActive);
  private readonly loadingSignal = signal(false);
  private readonly groupsLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly questions = this.questionsSignal.asReadonly();
  readonly groupsSelection = this.groupsSelectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly groupId = this.groupIdSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly isActive = this.isActiveSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly groupsLoading = this.groupsLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<QuestionsFilter> = {}): void {
    const nextQuery: QuestionsFilter = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
      orderSort: query.orderSort ?? this.orderSortSignal(),
      isActive: query.isActive !== undefined ? query.isActive : this.isActiveSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);
    this.orderSortSignal.set(nextQuery.orderSort);
    this.isActiveSignal.set(nextQuery.isActive);

    const questionsPage$ = this.groupIdSignal()
      ? this.questionsService.listByGroup(this.groupIdSignal() ?? '', nextQuery)
      : this.questionsService.list(nextQuery);

    questionsPage$
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
          this.questionsSignal.set(page.data.filter((question) => question.questionId.length > 0));
        },
        error: (error: unknown) => {
          this.questionsSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'questions.loadError'));
        },
      });
  }

  loadForGroup(groupId: string, query: Partial<QuestionsFilter> = {}): void {
    this.groupIdSignal.set(groupId);
    this.load({
      pageNumber: query.pageNumber ?? this.defaultQuery.pageNumber,
      pageSize: query.pageSize ?? this.defaultQuery.pageSize,
      searchText: query.searchText ?? this.defaultQuery.searchText,
      orderSort: query.orderSort ?? this.defaultQuery.orderSort,
      isActive: query.isActive !== undefined ? query.isActive : this.defaultQuery.isActive,
    });
  }

  loadGroupsSelection(): void {
    if (this.groupsLoadingSignal()) {
      return;
    }

    this.groupsLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.questionGroupsService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.groupsLoadingSignal.set(false)),
      )
      .subscribe({
        next: (groups) => {
          this.groupsSelectionSignal.set(groups);
        },
        error: (error: unknown) => {
          this.groupsSelectionSignal.set([]);
          this.errorSignal.set(this.readErrorKey(error, 'questions.groupsSelectionLoadError'));
        },
      });
  }

  search(searchText: string, isActive: boolean | null, pageSize: number, orderSort: string): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      pageSize,
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

  createQuestion(payload: CreateQuestionRequest, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('questions.createSuccess');
          this.load();
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questions.createError'));
        },
      });
  }

  updateQuestion(questionId: string, payload: UpdateQuestionRequest, onUpdated: () => void): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionsService
      .update(questionId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('questions.updateSuccess');
          this.load();
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questions.updateError'));
        },
      });
  }

  deleteQuestion(questionId: string, onDeleted: () => void): void {
    if (this.deletingSignal()) {
      return;
    }

    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionsService
      .delete(questionId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: (question) => {
          this.replaceQuestionInList(this.mergeQuestion(questionId, question));
          this.successSignal.set('questions.deleteSuccess');
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questions.deleteError'));
        },
      });
  }

  restoreQuestion(questionId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionsService
      .restore(questionId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: (question) => {
          this.replaceQuestionInList(this.mergeQuestion(questionId, question));
          this.successSignal.set('questions.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questions.restoreError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  private replaceQuestionInList(question: QuestionListItem): void {
    this.questionsSignal.update((questions) => {
      if (!this.matchesActiveFilter(question)) {
        if (questions.some((currentQuestion) => currentQuestion.questionId === question.questionId)) {
          this.totalItemsSignal.update((totalItems) => Math.max(0, totalItems - 1));
        }
        return questions.filter((currentQuestion) => currentQuestion.questionId !== question.questionId);
      }

      return questions.map((currentQuestion) =>
        currentQuestion.questionId === question.questionId ? question : currentQuestion,
      );
    });
  }

  private mergeQuestion(questionId: string, question: QuestionListItem): QuestionListItem {
    const currentQuestion = this.questionsSignal().find((current) => current.questionId === questionId);

    return {
      questionId: question.questionId || currentQuestion?.questionId || questionId,
      branchId: question.branchId ?? currentQuestion?.branchId ?? null,
      groupId: question.groupId || currentQuestion?.groupId || '',
      groupBranchId: question.groupBranchId ?? currentQuestion?.groupBranchId ?? null,
      scope: question.scope ?? currentQuestion?.scope ?? null,
      scopeName: question.scopeName || currentQuestion?.scopeName || 'Branch',
      isGlobal: question.isGlobal,
      isEditable: question.isEditable,
      groupNameEn: question.groupNameEn || currentQuestion?.groupNameEn || '',
      groupNameAr: question.groupNameAr !== null ? question.groupNameAr : currentQuestion?.groupNameAr ?? null,
      textEn: question.textEn || currentQuestion?.textEn || '',
      textAr: question.textAr !== null ? question.textAr : currentQuestion?.textAr ?? null,
      type: question.typeName.length > 0 ? question.type : currentQuestion?.type ?? question.type,
      typeName: question.typeName || currentQuestion?.typeName || '',
      isActive: question.isActive,
      createdBy: question.createdBy ?? currentQuestion?.createdBy ?? null,
      createdOnUtc: question.createdOnUtc || currentQuestion?.createdOnUtc || '',
      options: question.options.length > 0 ? question.options : currentQuestion?.options ?? [],
    };
  }

  private matchesActiveFilter(question: QuestionListItem): boolean {
    const isActive = this.isActiveSignal();
    const matchesActive = isActive === null || question.isActive === isActive;
    const groupId = this.groupIdSignal();
    const matchesGroup = groupId === null || question.groupId === groupId;
    return matchesActive && matchesGroup;
  }

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const marker = this.readErrorMarker(error.error);
    const mappedError = this.mapBackendError(marker);
    if (mappedError.length > 0) {
      return mappedError;
    }

    if (error.status === 401) {
      return 'questions.unauthorized';
    }
    if (error.status === 403) {
      return 'questions.forbidden';
    }
    if (error.status === 404) {
      return 'questions.notFound';
    }
    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'questions.validationError';
    }

    return fallbackKey;
  }

  private mapBackendError(marker: string): string {
    const normalized = marker.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('currentbranchactor') || normalized.includes('actorprofilenotfound')) {
      return 'questions.currentBranchActorNotFound';
    }
    if (normalized.includes('groupnotfound') || normalized.includes('invalidgroupid')) {
      return 'questions.groupNotFound';
    }
    if (normalized.includes('inactivegroup')) {
      return 'questions.inactiveGroup';
    }
    if (normalized.includes('questionnotfound') || normalized.includes('invalidquestionid')) {
      return 'questions.notFound';
    }
    if (normalized.includes('alreadyinactive')) {
      return 'questions.alreadyInactive';
    }
    if (normalized.includes('textenrequired') || normalized.includes('invalidtexten')) {
      return 'questions.textEnRequired';
    }
    if (normalized.includes('textenmaxlength') || normalized.includes('textarmaxlength')) {
      return 'questions.textMaxLength';
    }
    if (normalized.includes('invalidquestiontype') || normalized.includes('invalidtype')) {
      return 'questions.invalidType';
    }
    if (
      normalized.includes('optionusedincondition') ||
      (normalized.includes('option') && normalized.includes('used') && normalized.includes('condition'))
    ) {
      return 'questions.optionUsedInCondition';
    }
    if (
      normalized.includes('optionnotbelongtoquestion') ||
      (normalized.includes('option') && normalized.includes('belong') && normalized.includes('question'))
    ) {
      return 'questions.optionNotBelongToQuestion';
    }
    if (
      normalized.includes('optionidduplicated') ||
      normalized.includes('duplicateoptionid') ||
      (normalized.includes('optionid') &&
        (normalized.includes('duplicated') || normalized.includes('duplicate')))
    ) {
      return 'questions.optionIdDuplicated';
    }
    if (normalized.includes('singlechoice') && normalized.includes('option') && normalized.includes('least')) {
      return 'questions.singleChoiceMinOptions';
    }
    if (normalized.includes('options') && normalized.includes('only') && normalized.includes('singlechoice')) {
      return 'questions.optionsOnlySingleChoice';
    }
    if (normalized.includes('optiontexten') && normalized.includes('required')) {
      return 'questions.optionTextEnRequired';
    }
    if (normalized.includes('optionorder') && normalized.includes('required')) {
      return 'questions.optionOrderRequired';
    }
    if (normalized.includes('optionorder') && (normalized.includes('greater') || normalized.includes('positive'))) {
      return 'questions.optionOrderPositive';
    }
    if (
      (normalized.includes('optionvalue') || normalized.includes('value')) &&
      (normalized.includes('1') || normalized.includes('5') || normalized.includes('range'))
    ) {
      return 'questions.optionValueScaleRange';
    }
    if (normalized.includes('optionorder') && normalized.includes('unique')) {
      return 'questions.optionOrderUnique';
    }
    if (normalized.includes('optiontexten') && normalized.includes('unique')) {
      return 'questions.optionTextEnUnique';
    }
    if (
      normalized.includes('template') &&
      normalized.includes('type') &&
      (normalized.includes('change') || normalized.includes('linked'))
    ) {
      return 'questions.typeChangeBlockedByTemplate';
    }
    return '';
  }

  private readErrorMarker(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return [firstError?.code, firstError?.messageName, firstError?.message, errorBody.detail, errorBody.title]
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
