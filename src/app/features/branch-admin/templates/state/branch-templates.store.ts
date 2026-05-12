import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  BranchTemplate,
  BranchTemplateQuestionSelection,
  BranchTemplateSelection,
  BranchTemplatesQuery,
  CreateBranchTemplatePayload,
  UpdateBranchTemplateQuestionsPayload,
  UpdateBranchTemplatePayload,
} from '../models/branch-template.model';
import { BranchTemplatesService } from '../services/branch-templates.service';

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
  readonly deleting = this.deletingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();
  readonly questionsSelectionError = this.questionsSelectionErrorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
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
      this.questionsSelectionSignal()?.groups.reduce((total, group) => total + group.questions.length, 0) ?? 0,
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

  search(searchText: string, isActive: boolean | null = this.isActiveSignal(), orderSort = this.orderSortSignal()): void {
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

  loadDetails(templateId: string): void {
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
          this.selectedTemplateSignal.set(template.templateId.length > 0 ? template : null);
        },
        error: (error: unknown) => {
          this.detailsErrorSignal.set(this.readErrorKey(error, 'branchTemplates.detailsLoadError'));
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

  updateTemplate(templateId: string, payload: UpdateBranchTemplatePayload, onUpdated: () => void): void {
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
        next: () => {
          this.successSignal.set('branchTemplates.questionsUpdateSuccess');
          this.loadQuestionsSelection(templateId);
          const selectedTemplate = this.selectedTemplateSignal();
          if (selectedTemplate?.templateId === templateId) {
            this.selectedTemplateSignal.set({
              ...selectedTemplate,
              questionsCount: payload.questionIds.length,
            });
          }
          this.replaceTemplateQuestionsCount(templateId, payload.questionIds.length);
          onUpdated();
        },
        error: (error: unknown) => {
          this.questionsSelectionErrorSignal.set(
            this.readErrorKey(error, 'branchTemplates.questionsUpdateError'),
          );
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

  private readErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.readFirstErrorCode(error.error).toLowerCase();
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

  private readFirstErrorCode(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.code ?? firstError?.messageName ?? '';
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

  private replaceTemplateInList(template: BranchTemplate): void {
    this.templatesSignal.update((templates) => {
      if (!this.matchesActiveFilter(template)) {
        if (templates.some((currentTemplate) => currentTemplate.templateId === template.templateId)) {
          this.totalItemsSignal.update((totalItems) => Math.max(0, totalItems - 1));
        }
        return templates.filter((currentTemplate) => currentTemplate.templateId !== template.templateId);
      }

      return templates.map((currentTemplate) =>
        currentTemplate.templateId === template.templateId ? template : currentTemplate,
      );
    });
  }

  private mergeTemplate(templateId: string, template: BranchTemplate): BranchTemplate {
    const currentTemplate =
      this.templatesSignal().find((current) => current.templateId === templateId) ??
      this.selectedTemplateSignal();

    return {
      templateId: template.templateId || currentTemplate?.templateId || templateId,
      branchId: template.branchId || currentTemplate?.branchId || '',
      nameEn: template.nameEn || currentTemplate?.nameEn || '',
      nameAr: template.nameAr || currentTemplate?.nameAr || '',
      description: template.description || currentTemplate?.description || '',
      status: template.status || currentTemplate?.status || 'Draft',
      isActive: template.isActive,
      questionsCount: template.questionsCount || currentTemplate?.questionsCount || 0,
      createdOnUtc: template.createdOnUtc || currentTemplate?.createdOnUtc || '',
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
