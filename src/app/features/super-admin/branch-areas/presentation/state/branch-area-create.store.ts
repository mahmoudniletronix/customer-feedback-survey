import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  BranchAreaBranch,
  BranchAreaDetails,
  CreateBranchAreaPayload,
} from '../../domain/branch-area.model';
import { BranchAreasService } from '../../data/branch-areas.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  detail?: string;
  errors?: readonly ApiErrorItem[];
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

const CREATE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Create.Unauthenticated': 'branchAreas.createTokenMissing',
  'BranchAreas.Create.CurrentSuperAdminNotFound':
    'branchAreas.createCurrentSuperAdminNotFound',
  'BranchAreas.Create.BranchesRequired': 'branchAreas.createBranchesRequired',
  'BranchAreas.Create.BranchIdsDuplicatedOrInvalid': 'branchAreas.createBranchIdsInvalid',
  'BranchAreas.Create.BranchesNotFound': 'branchAreas.createBranchesNotFound',
  'BranchAreas.Create.UserNameAlreadyExists': 'branchAreas.createUserNameAlreadyExists',
  'BranchAreas.Create.EmailAlreadyExists': 'branchAreas.createEmailAlreadyExists',
  'BranchAreas.Create.BranchAreaRoleNotFound': 'branchAreas.createBranchAreaRoleNotFound',
};

@Injectable()
export class BranchAreaCreateStore {
  private readonly branchAreasService = inject(BranchAreasService);
  private readonly branchesSignal = signal<readonly BranchAreaBranch[]>([]);
  private readonly selectionLoadingSignal = signal(false);
  private readonly creatingSignal = signal(false);
  private readonly selectionErrorSignal = signal<string | null>(null);
  private readonly createErrorSignal = signal<string | null>(null);
  private readonly branchIdsErrorSignal = signal<string | null>(null);
  private readonly userNameErrorSignal = signal<string | null>(null);
  private readonly emailErrorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);
  private readonly createdBranchAreaSignal = signal<BranchAreaDetails | null>(null);

  readonly branches = this.branchesSignal.asReadonly();
  readonly selectionLoading = this.selectionLoadingSignal.asReadonly();
  readonly creating = this.creatingSignal.asReadonly();
  readonly selectionError = this.selectionErrorSignal.asReadonly();
  readonly createError = this.createErrorSignal.asReadonly();
  readonly branchIdsError = this.branchIdsErrorSignal.asReadonly();
  readonly userNameError = this.userNameErrorSignal.asReadonly();
  readonly emailError = this.emailErrorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();
  readonly createdBranchArea = this.createdBranchAreaSignal.asReadonly();

  loadBranches(): void {
    this.selectionLoadingSignal.set(true);
    this.selectionErrorSignal.set(null);

    this.branchAreasService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.selectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (branches) => {
          this.branchesSignal.set(branches);
        },
        error: () => {
          this.branchesSignal.set([]);
          this.selectionErrorSignal.set('branchAreas.createBranchesSelectionLoadError');
        },
      });
  }

  create(payload: CreateBranchAreaPayload, onCreated: (created: BranchAreaDetails) => void): void {
    this.clearCreateMessages();

    const branchIds = payload.branchIds.map((branchId) => branchId.trim());
    const branchIdsValidationError = this.validateBranchIds(branchIds);
    if (branchIdsValidationError) {
      this.branchIdsErrorSignal.set(branchIdsValidationError);
      return;
    }

    this.creatingSignal.set(true);

    this.branchAreasService
      .create({
        ...payload,
        branchIds,
      })
      .pipe(
        take(1),
        finalize(() => this.creatingSignal.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.successSignal.set('branchAreas.createSuccess');
          this.createdBranchAreaSignal.set(created);
          onCreated(created);
        },
        error: (error: unknown) => {
          this.applyCreateError(error);
        },
      });
  }

  clearFieldError(field: 'branchIds' | 'userName' | 'email'): void {
    if (field === 'branchIds') {
      this.branchIdsErrorSignal.set(null);
      return;
    }

    if (field === 'userName') {
      this.userNameErrorSignal.set(null);
      return;
    }

    this.emailErrorSignal.set(null);
  }

  clearCreateMessages(): void {
    this.createErrorSignal.set(null);
    this.branchIdsErrorSignal.set(null);
    this.userNameErrorSignal.set(null);
    this.emailErrorSignal.set(null);
    this.successSignal.set(null);
    this.createdBranchAreaSignal.set(null);
  }

  private validateBranchIds(branchIds: readonly string[]): string | null {
    if (branchIds.length === 0) {
      return 'branchAreas.createBranchesRequired';
    }

    if (branchIds.some((branchId) => branchId.length === 0 || branchId === EMPTY_GUID)) {
      return 'branchAreas.createBranchIdsInvalid';
    }

    if (new Set(branchIds).size !== branchIds.length) {
      return 'branchAreas.createBranchIdsDuplicated';
    }

    return null;
  }

  private applyCreateError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.createErrorSignal.set('branchAreas.createLoadError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage = errors[0]?.message ?? errorResponse?.detail ?? 'branchAreas.createLoadError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      const errorKey = CREATE_ERROR_KEYS[code] ?? item.message ?? fallbackMessage;

      if (this.isUserNameError(code)) {
        this.userNameErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      if (this.isEmailError(code)) {
        this.emailErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      if (this.isBranchesError(code)) {
        this.branchIdsErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      this.createErrorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.createErrorSignal.set(fallbackMessage);
    }
  }

  private readErrorResponse(value: unknown): ApiErrorResponse | null {
    return typeof value === 'object' && value !== null ? (value as ApiErrorResponse) : null;
  }

  private isUserNameError(code: string): boolean {
    return code.includes('UserName');
  }

  private isEmailError(code: string): boolean {
    return code.includes('Email');
  }

  private isBranchesError(code: string): boolean {
    return (
      code.includes('Branches') ||
      code.includes('BranchIds') ||
      code === 'BranchAreas.Create.BranchesRequired'
    );
  }
}
