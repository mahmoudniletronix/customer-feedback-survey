import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { GlobalQuestionGroupsService } from '../../data/global-question-groups.service';
import {
  CreateGlobalQuestionGroupRequest,
  GlobalQuestionGroupListItem,
  GlobalQuestionGroupsFilter,
  UpdateGlobalQuestionGroupRequest,
} from '../../domain/global-question-group.model';

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
export class GlobalQuestionGroupsStore {
  private readonly defaultQuery: GlobalQuestionGroupsFilter = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
    orderSort: '',
    isActive: null,
  };

  private readonly globalQuestionGroupsService = inject(GlobalQuestionGroupsService);
  private readonly groupsSignal = signal<readonly GlobalQuestionGroupListItem[]>([]);
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
  private readonly restoringSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly groups = this.groupsSignal.asReadonly();
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
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<GlobalQuestionGroupsFilter> = {}): void {
    const nextQuery: GlobalQuestionGroupsFilter = {
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

    this.globalQuestionGroupsService
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
          this.errorSignal.set(this.readErrorKey(error, 'globalQuestionGroups.loadError'));
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

  createGroup(payload: CreateGlobalQuestionGroupRequest, onCreated: () => void): void {
    if (this.creatingSignal()) {
      return;
    }

    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.globalQuestionGroupsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.successSignal.set('globalQuestionGroups.createSuccess');
          this.load({ pageNumber: this.defaultQuery.pageNumber });
          onCreated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'globalQuestionGroups.createError'));
        },
      });
  }

  updateGroup(
    groupId: string,
    payload: UpdateGlobalQuestionGroupRequest,
    onUpdated: () => void,
  ): void {
    if (this.updatingSignal()) {
      return;
    }

    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.globalQuestionGroupsService
      .update(groupId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.replaceGroupInList(this.mergeGroup(groupId, group));
          this.successSignal.set('globalQuestionGroups.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'globalQuestionGroups.updateError'));
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

    this.globalQuestionGroupsService
      .delete(groupId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.replaceGroupInList(this.mergeGroup(groupId, group));
          this.successSignal.set('globalQuestionGroups.deleteSuccess');
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'globalQuestionGroups.deleteError'));
        },
      });
  }

  restoreGroup(groupId: string, onRestored: () => void): void {
    if (this.restoringSignal()) {
      return;
    }

    this.restoringSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.globalQuestionGroupsService
      .restore(groupId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: (group) => {
          this.replaceGroupInList(this.mergeGroup(groupId, group));
          this.successSignal.set('globalQuestionGroups.restoreSuccess');
          onRestored();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readErrorKey(error, 'globalQuestionGroups.restoreError'));
        },
      });
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
  }

  private replaceGroupInList(group: GlobalQuestionGroupListItem): void {
    this.groupsSignal.update((groups) =>
      groups.map((currentGroup) => (currentGroup.groupId === group.groupId ? group : currentGroup)),
    );
  }

  private mergeGroup(
    groupId: string,
    group: GlobalQuestionGroupListItem,
  ): GlobalQuestionGroupListItem {
    const currentGroup = this.groupsSignal().find((current) => current.groupId === groupId);

    return {
      groupId: group.groupId || currentGroup?.groupId || groupId,
      branchId: null,
      scope: group.scope ?? currentGroup?.scope ?? 2,
      scopeName: group.scopeName || currentGroup?.scopeName || 'Global',
      isGlobal: group.isGlobal,
      isEditable: group.isEditable,
      nameEn: group.nameEn || currentGroup?.nameEn || '',
      nameAr: group.nameAr !== null ? group.nameAr : currentGroup?.nameAr ?? null,
      isActive: group.isActive,
      questionsCount: group.questionsCount || currentGroup?.questionsCount || 0,
      createdOnUtc: group.createdOnUtc || currentGroup?.createdOnUtc || '',
    };
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
      return 'globalQuestionGroups.unauthorized';
    }
    if (error.status === 403) {
      return 'globalQuestionGroups.forbidden';
    }
    if (error.status === 400 || error.status === 422) {
      return this.readProblemDetailsMessage(error.error) || 'globalQuestionGroups.validationError';
    }

    return fallbackKey;
  }

  private mapBackendError(marker: string): string {
    const normalized = marker.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized.includes('nameenrequired') || normalized.includes('englishnameisrequired')) {
      return 'globalQuestionGroups.nameEnRequired';
    }
    if (normalized.includes('nameenmaxlength') || normalized.includes('englishnamemaxlength')) {
      return 'globalQuestionGroups.nameEnMaxLength';
    }
    if (normalized.includes('namearmaxlength') || normalized.includes('arabicnamemaxlength')) {
      return 'globalQuestionGroups.nameArMaxLength';
    }
    if (
      normalized.includes('namealreadyexists') ||
      normalized.includes('questiongroupalreadyexists') ||
      normalized.includes('sameenglishnameexists')
    ) {
      return 'globalQuestionGroups.nameAlreadyExists';
    }
    if (normalized.includes('questiongroupnotfound') || normalized.includes('notfound')) {
      return 'globalQuestionGroups.notFound';
    }
    if (normalized.includes('alreadyinactive')) {
      return 'globalQuestionGroups.alreadyInactive';
    }
    if (normalized.includes('alreadyactive')) {
      return 'globalQuestionGroups.alreadyActive';
    }
    if (
      normalized.includes('hasquestions') ||
      normalized.includes('relatedquestions') ||
      normalized.includes('cannotbedeleted')
    ) {
      return 'globalQuestionGroups.hasQuestions';
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
