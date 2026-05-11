import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  CreateQuestionGroupRequest,
  QuestionGroupListItem,
  QuestionGroupsFilter,
  UpdateQuestionGroupRequest,
} from '../models/question-group.model';
import { QuestionGroupsService } from '../services/question-groups.service';

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
export class QuestionGroupsStore {
  private readonly defaultQuery: QuestionGroupsFilter = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    orderSort: '',
    isActive: null,
  };

  private readonly questionGroupsService = inject(QuestionGroupsService);
  private readonly groupsSignal = signal<readonly QuestionGroupListItem[]>([]);
  private readonly createdGroupSignal = signal<QuestionGroupListItem | null>(null);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly orderSortSignal = signal(this.defaultQuery.orderSort);
  private readonly isActiveSignal = signal<boolean | null>(this.defaultQuery.isActive);
  private readonly loadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly groups = this.groupsSignal.asReadonly();
  readonly createdGroup = this.createdGroupSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly orderSort = this.orderSortSignal.asReadonly();
  readonly isActive = this.isActiveSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<QuestionGroupsFilter> = {}): void {
    const nextQuery: QuestionGroupsFilter = {
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

    this.questionGroupsService
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
          this.groupsSignal.set(page.data.filter((group) => group.groupId.length > 0));
        },
        error: (error: unknown) => {
          this.groupsSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set(this.readErrorKey(error, 'questionGroups.loadError'));
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

  createGroup(payload: CreateQuestionGroupRequest, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionGroupsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.createdGroupSignal.set(group);
          this.successSignal.set('questionGroups.createSuccess');
          this.load({ pageNumber: this.defaultQuery.pageNumber });
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questionGroups.createError'));
        },
      });
  }

  updateGroup(groupId: string, payload: UpdateQuestionGroupRequest, onUpdated: () => void): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionGroupsService
      .update(groupId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.replaceGroupInList(this.mergeGroup(groupId, group));
          this.successSignal.set('questionGroups.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questionGroups.updateError'));
        },
      });
  }

  deleteGroup(groupId: string, onDeleted: () => void): void {
    if (this.deletingSignal()) {
      return;
    }

    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.questionGroupsService
      .delete(groupId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.replaceGroupInList(this.mergeGroup(groupId, group));
          this.successSignal.set('questionGroups.deleteSuccess');
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'questionGroups.deleteError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  private replaceGroupInList(group: QuestionGroupListItem): void {
    this.groupsSignal.update((groups) => {
      if (!this.matchesActiveFilter(group)) {
        if (groups.some((currentGroup) => currentGroup.groupId === group.groupId)) {
          this.totalItemsSignal.update((totalItems) => Math.max(0, totalItems - 1));
        }
        return groups.filter((currentGroup) => currentGroup.groupId !== group.groupId);
      }

      return groups.map((currentGroup) => (currentGroup.groupId === group.groupId ? group : currentGroup));
    });
  }

  private mergeGroup(groupId: string, group: QuestionGroupListItem): QuestionGroupListItem {
    const currentGroup = this.groupsSignal().find((current) => current.groupId === groupId);

    return {
      groupId: group.groupId || currentGroup?.groupId || groupId,
      branchId: group.branchId || currentGroup?.branchId || '',
      nameEn: group.nameEn || currentGroup?.nameEn || '',
      nameAr: group.nameAr !== null ? group.nameAr : currentGroup?.nameAr ?? null,
      isActive: group.isActive,
      questionsCount: group.questionsCount || currentGroup?.questionsCount || 0,
      createdOnUtc: group.createdOnUtc || currentGroup?.createdOnUtc || '',
    };
  }

  private matchesActiveFilter(group: QuestionGroupListItem): boolean {
    const isActive = this.isActiveSignal();
    return isActive === null || group.isActive === isActive;
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
      return 'questionGroups.unauthorized';
    }
    if (error.status === 403) {
      return 'questionGroups.forbidden';
    }
    if (error.status === 404) {
      return 'questionGroups.notFound';
    }
    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'questionGroups.validationError';
    }

    return fallbackKey;
  }

  private mapBackendError(marker: string): string {
    const normalized = marker.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('nameenrequired') || normalized.includes('englishnameisrequired')) {
      return 'questionGroups.nameEnRequired';
    }
    if (normalized.includes('nameenmaxlength') || normalized.includes('englishnamemaxlength')) {
      return 'questionGroups.nameEnMaxLength';
    }
    if (normalized.includes('namearmaxlength') || normalized.includes('arabicnamemaxlength')) {
      return 'questionGroups.nameArMaxLength';
    }
    if (
      normalized.includes('namealreadyexists') ||
      normalized.includes('questiongroupalreadyexists') ||
      normalized.includes('sameenglishnameexists')
    ) {
      return 'questionGroups.nameAlreadyExists';
    }
    if (normalized.includes('currentbranchactor') || normalized.includes('currentuserisnotvalid')) {
      return 'questionGroups.currentBranchActorNotFound';
    }
    if (normalized.includes('questiongroupnotfound') || normalized.includes('notfound')) {
      return 'questionGroups.notFound';
    }
    if (normalized.includes('alreadyinactive')) {
      return 'questionGroups.alreadyInactive';
    }
    if (
      normalized.includes('hasquestions') ||
      normalized.includes('relatedquestions') ||
      normalized.includes('cannotbedeleted')
    ) {
      return 'questionGroups.hasQuestions';
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
