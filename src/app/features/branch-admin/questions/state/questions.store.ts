import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { QuestionGroupSelectionItem } from '../../question-groups/models/question-group.model';
import { QuestionGroupsService } from '../../question-groups/services/question-groups.service';
import {
  CreateQuestionRequest,
  QuestionListItem,
  QuestionsFilter,
  UpdateQuestionRequest,
} from '../models/question.model';
import { QuestionsService } from '../services/questions.service';

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
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly orderSortSignal = signal(this.defaultQuery.orderSort);
  private readonly isActiveSignal = signal<boolean | null>(this.defaultQuery.isActive);
  private readonly loadingSignal = signal(false);
  private readonly groupsLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly questions = this.questionsSignal.asReadonly();
  readonly groupsSelection = this.groupsSelectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly isActive = this.isActiveSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly groupsLoading = this.groupsLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
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

    this.questionsService
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
          this.questionsSignal.set(page.data.filter((question) => question.questionId.length > 0));
        },
        error: (error: unknown) => {
          this.questionsSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'questions.loadError'));
        },
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
        next: () => {
          this.successSignal.set('questions.deleteSuccess');
          this.load();
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questions.deleteError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
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
