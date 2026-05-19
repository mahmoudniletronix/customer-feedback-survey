import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  CreateDepartmentPayload,
  Department,
  DepartmentDetails,
  DepartmentListQuery,
  DepartmentSelection,
  UpdateDepartmentPayload,
} from '../../domain/department.model';
import { DepartmentsService } from '../../data/departments.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
}

@Injectable()
export class DepartmentsStore {
  private readonly defaultQuery: DepartmentListQuery = {
    pageNumber: 1,
    pageSize: 10,
    searchText: '',
  };

  private readonly departmentsService = inject(DepartmentsService);
  private readonly departmentsSignal = signal<readonly Department[]>([]);
  private readonly selectionSignal = signal<readonly DepartmentSelection[]>([]);
  private readonly currentPageSignal = signal(this.defaultQuery.pageNumber);
  private readonly pageSizeSignal = signal(this.defaultQuery.pageSize);
  private readonly totalItemsSignal = signal(0);
  private readonly searchTextSignal = signal(this.defaultQuery.searchText);
  private readonly loadingSignal = signal(false);
  private readonly selectionLoadingSignal = signal(false);
  private readonly detailsLoadingSignal = signal(false);
  private readonly selectedDetailsSignal = signal<DepartmentDetails | null>(null);
  private readonly detailsErrorSignal = signal<string | null>(null);
  private readonly creatingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deletingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);
  private readonly lastCreatedSignal = signal<Department | null>(null);

  readonly departments = this.departmentsSignal.asReadonly();
  readonly selection = this.selectionSignal.asReadonly();
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly totalItems = this.totalItemsSignal.asReadonly();
  readonly searchText = this.searchTextSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly selectionLoading = this.selectionLoadingSignal.asReadonly();
  readonly detailsLoading = this.detailsLoadingSignal.asReadonly();
  readonly selectedDetails = this.selectedDetailsSignal.asReadonly();
  readonly detailsError = this.detailsErrorSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly lastCreated = this.lastCreatedSignal.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItemsSignal() / this.pageSizeSignal())));
  readonly hasPreviousPage = computed(() => this.currentPageSignal() > 1);
  readonly hasNextPage = computed(() => this.currentPageSignal() < this.totalPages());

  load(query: Partial<DepartmentListQuery> = {}): void {
    const nextQuery: DepartmentListQuery = {
      pageNumber: query.pageNumber ?? this.currentPageSignal(),
      pageSize: query.pageSize ?? this.pageSizeSignal(),
      searchText: query.searchText ?? this.searchTextSignal(),
    };

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.searchTextSignal.set(nextQuery.searchText);

    this.departmentsService
      .list(nextQuery)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (page) => {
          this.currentPageSignal.set(page.currentPage);
          this.pageSizeSignal.set(page.pageSize);
          this.totalItemsSignal.set(page.totalItems);
          this.departmentsSignal.set(page.data.filter((department) => department.id.length > 0));
        },
        error: () => {
          this.departmentsSignal.set([]);
          this.totalItemsSignal.set(0);
          this.errorSignal.set('departments.loadError');
        },
      });
  }

  loadSelection(): void {
    this.selectionLoadingSignal.set(true);

    this.departmentsService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.selectionLoadingSignal.set(false))
      )
      .subscribe({
        next: (departments) => {
          this.selectionSignal.set(departments.filter((department) => department.id.length > 0));
        },
        error: () => {
          this.selectionSignal.set([]);
          this.errorSignal.set('departments.selectionLoadError');
        },
      });
  }

  loadDetails(departmentId: string, clearSuccess = true): void {
    this.detailsLoadingSignal.set(true);
    this.detailsErrorSignal.set(null);
    if (clearSuccess) {
      this.successSignal.set(null);
    }
    this.selectedDetailsSignal.set(null);

    this.departmentsService
      .details(departmentId)
      .pipe(
        take(1),
        finalize(() => this.detailsLoadingSignal.set(false))
      )
      .subscribe({
        next: (details) => {
          this.selectedDetailsSignal.set(details);
        },
        error: (error: unknown) => {
          this.detailsErrorSignal.set(this.readDetailsErrorKey(error));
        },
      });
  }

  search(searchText: string): void {
    this.load({
      pageNumber: this.defaultQuery.pageNumber,
      searchText,
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

  createDepartment(payload: CreateDepartmentPayload): void {
    this.creatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentsService
      .create(payload)
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false))
      )
      .subscribe({
        next: (department) => {
          this.lastCreatedSignal.set({
            id: department.departmentId,
            nameEn: department.nameEn,
            nameAr: department.nameAr ?? '',
            isActive: department.isActive ?? true,
            createdBy: null,
            createdOnUtc: '',
          });
          this.successSignal.set('departments.createSuccess');
          this.load();
          this.loadSelection();
        },
        error: () => {
          this.errorSignal.set('departments.createError');
        },
      });
  }

  updateDepartment(departmentId: string, payload: UpdateDepartmentPayload, onUpdated: () => void): void {
    this.updatingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentsService
      .update(departmentId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false))
      )
      .subscribe({
        next: (department) => {
          this.mergeUpdatedDepartment({
            id: this.readDepartmentId(department.id ?? department.departmentId, departmentId),
            nameEn: department.nameEn ?? payload.nameEn,
            nameAr: department.nameAr ?? payload.nameAr,
            isActive: department.isActive ?? true,
            createdBy: null,
            createdOnUtc: '',
          });
          this.successSignal.set('departments.updateSuccess');
          this.loadSelection();
          onUpdated();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readMutationErrorKey(error, 'departments.updateError'));
        },
      });
  }

  deleteDepartment(departmentId: string, onDeleted: () => void): void {
    this.deletingSignal.set(true);
    this.errorSignal.set(null);
    this.successSignal.set(null);

    this.departmentsService
      .delete(departmentId)
      .pipe(
        take(1),
        finalize(() => this.deletingSignal.set(false))
      )
      .subscribe({
        next: () => {
          this.successSignal.set('departments.deleteSuccess');
          this.markDepartmentInactive(departmentId);
          this.loadSelection();
          onDeleted();
        },
        error: (error: unknown) => {
          this.errorSignal.set(this.readMutationErrorKey(error, 'departments.deleteError'));
        },
      });
  }

  clearDetails(): void {
    this.selectedDetailsSignal.set(null);
    this.detailsErrorSignal.set(null);
    this.detailsLoadingSignal.set(false);
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.successSignal.set(null);
    this.detailsErrorSignal.set(null);
  }

  private mergeUpdatedDepartment(updatedDepartment: Department): void {
    this.departmentsSignal.update((departments) =>
      departments.map((department) =>
        department.id === updatedDepartment.id
          ? {
              ...department,
              nameEn: updatedDepartment.nameEn,
              nameAr: updatedDepartment.nameAr,
              isActive: updatedDepartment.isActive,
            }
          : department
      )
    );

    const details = this.selectedDetailsSignal();
    if (details?.id === updatedDepartment.id) {
      this.selectedDetailsSignal.set({
        ...details,
        nameEn: updatedDepartment.nameEn,
        nameAr: updatedDepartment.nameAr,
        isActive: updatedDepartment.isActive,
      });
    }
  }

  private markDepartmentInactive(departmentId: string): void {
    this.departmentsSignal.update((departments) =>
      departments.map((department) =>
        department.id === departmentId ? { ...department, isActive: false } : department
      )
    );

    const details = this.selectedDetailsSignal();
    if (details?.id === departmentId) {
      this.selectedDetailsSignal.set({ ...details, isActive: false });
    }
  }

  private readDetailsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'departments.detailsLoadError';
    }

    if (error.status === 401) {
      return 'departments.unauthorized';
    }

    if (error.status === 403) {
      return 'departments.forbidden';
    }

    if (error.status === 404) {
      return 'departments.notFound';
    }

    return 'departments.detailsLoadError';
  }

  private readMutationErrorKey(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackKey;
    }

    const code = this.readFirstErrorCode(error.error).toLowerCase();
    if (code.includes('nameen') && code.includes('exists')) {
      return 'departments.nameEnAlreadyExists';
    }

    if (code.includes('namear') && code.includes('exists')) {
      return 'departments.nameArAlreadyExists';
    }

    if (code.includes('alreadyinactive')) {
      return 'departments.alreadyInactive';
    }

    if (error.status === 401) {
      return 'departments.unauthorized';
    }

    if (error.status === 403) {
      return 'departments.forbidden';
    }

    if (error.status === 404) {
      return 'departments.notFound';
    }

    return fallbackKey;
  }

  private readFirstErrorCode(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.code ?? firstError?.messageName ?? firstError?.message ?? '';
  }

  private readDepartmentId(id: string | number | undefined, fallbackId: string): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : fallbackId;
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }
}
