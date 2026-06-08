import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  AssignBranchAreaBranchesResult,
  BranchAreaBranch,
  DeactivateBranchAreaResult,
  BranchAreaDetails,
  BranchAreaListItem,
  RestoreBranchAreaResult,
  UpdateBranchAreaPayload,
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

const DETAILS_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Details.Unauthenticated': 'branchAreas.detailsTokenMissing',
  'BranchAreas.Details.CurrentSuperAdminNotFound':
    'branchAreas.detailsCurrentSuperAdminNotFound',
  'BranchAreas.Details.BranchAreaNotFound': 'branchAreas.detailsBranchAreaNotFound',
};

const UPDATE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Update.Unauthenticated': 'branchAreas.updateTokenMissing',
  'BranchAreas.Update.CurrentSuperAdminNotFound':
    'branchAreas.updateCurrentSuperAdminNotFound',
  'BranchAreas.Update.BranchAreaNotFound': 'branchAreas.updateBranchAreaNotFound',
  'BranchAreas.Update.ApplicationUserNotFound': 'branchAreas.updateApplicationUserNotFound',
  'BranchAreas.Update.EmailAlreadyExists': 'branchAreas.updateEmailAlreadyExists',
  'Validation.UpdateBranchUser_Email_Invalid': 'branchAreas.updateEmailInvalid',
  'Validation.UpdateBranchUser_Email_Required': 'branchAreas.updateEmailRequired',
  'Validation.UpdateBranchUser_Email_MaxLength': 'branchAreas.updateEmailMaxLength',
  'Validation.UpdateBranchUser_NameEn_Required': 'branchAreas.updateNameEnRequired',
  'Validation.UpdateBranchUser_NameEn_MaxLength': 'branchAreas.updateNameEnMaxLength',
  'Validation.UpdateBranchUser_NameAr_MaxLength': 'branchAreas.updateNameArMaxLength',
  'Validation.UpdateBranchUser_PhoneNumber_MaxLength':
    'branchAreas.updatePhoneNumberMaxLength',
};

const DEACTIVATE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Delete.Unauthenticated': 'branchAreas.deactivateTokenMissing',
  'BranchAreas.Delete.CurrentSuperAdminNotFound':
    'branchAreas.deactivateCurrentSuperAdminNotFound',
  'BranchAreas.Delete.BranchAreaNotFound': 'branchAreas.deactivateBranchAreaNotFound',
  'BranchAreas.Delete.ApplicationUserNotFound': 'branchAreas.deactivateApplicationUserNotFound',
};

const RESTORE_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.Restore.Unauthenticated': 'branchAreas.restoreTokenMissing',
  'BranchAreas.Restore.CurrentSuperAdminNotFound': 'branchAreas.restoreCurrentSuperAdminNotFound',
  'BranchAreas.Restore.BranchAreaNotFound': 'branchAreas.restoreBranchAreaNotFound',
  'BranchAreas.Restore.ApplicationUserNotFound': 'branchAreas.restoreApplicationUserNotFound',
};

const ASSIGN_BRANCHES_ERROR_KEYS: Record<string, string> = {
  'BranchAreas.AssignBranches.Unauthenticated': 'branchAreas.assignBranchesTokenMissing',
  'BranchAreas.AssignBranches.CurrentSuperAdminNotFound':
    'branchAreas.assignBranchesCurrentSuperAdminNotFound',
  'BranchAreas.AssignBranches.BranchAreaNotFound': 'branchAreas.assignBranchesBranchAreaNotFound',
  'BranchAreas.AssignBranches.BranchesRequired': 'branchAreas.assignBranchesRequired',
  'BranchAreas.AssignBranches.BranchIdsDuplicatedOrInvalid':
    'branchAreas.assignBranchesInvalid',
  'BranchAreas.AssignBranches.BranchesNotFound': 'branchAreas.assignBranchesNotFound',
};

@Injectable()
export class BranchAreaDetailsStore {
  private readonly branchAreasService = inject(BranchAreasService);
  private readonly detailsSignal = signal<BranchAreaDetails | null>(null);
  private readonly branchSelectionSignal = signal<readonly BranchAreaBranch[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly branchSelectionLoadingSignal = signal(false);
  private readonly updatingSignal = signal(false);
  private readonly deactivatingSignal = signal(false);
  private readonly restoringSignal = signal(false);
  private readonly assigningBranchesSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly branchSelectionErrorSignal = signal<string | null>(null);
  private readonly updateErrorSignal = signal<string | null>(null);
  private readonly deactivateErrorSignal = signal<string | null>(null);
  private readonly restoreErrorSignal = signal<string | null>(null);
  private readonly assignBranchesErrorSignal = signal<string | null>(null);
  private readonly branchIdsErrorSignal = signal<string | null>(null);
  private readonly emailErrorSignal = signal<string | null>(null);
  private readonly successSignal = signal<string | null>(null);

  readonly details = this.detailsSignal.asReadonly();
  readonly branchSelection = this.branchSelectionSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly branchSelectionLoading = this.branchSelectionLoadingSignal.asReadonly();
  readonly updating = this.updatingSignal.asReadonly();
  readonly deactivating = this.deactivatingSignal.asReadonly();
  readonly restoring = this.restoringSignal.asReadonly();
  readonly assigningBranches = this.assigningBranchesSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly branchSelectionError = this.branchSelectionErrorSignal.asReadonly();
  readonly updateError = this.updateErrorSignal.asReadonly();
  readonly deactivateError = this.deactivateErrorSignal.asReadonly();
  readonly restoreError = this.restoreErrorSignal.asReadonly();
  readonly assignBranchesError = this.assignBranchesErrorSignal.asReadonly();
  readonly branchIdsError = this.branchIdsErrorSignal.asReadonly();
  readonly emailError = this.emailErrorSignal.asReadonly();
  readonly success = this.successSignal.asReadonly();

  load(branchAreaId: string): void {
    if (branchAreaId.trim().length === 0) {
      this.clear();
      this.errorSignal.set('branchAreas.detailsBranchAreaNotFound');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.clearUpdateMessages();
    this.detailsSignal.set(null);

    this.branchAreasService
      .details(branchAreaId)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => {
          this.detailsSignal.set(details);
        },
        error: (error: unknown) => {
          this.detailsSignal.set(null);
          this.errorSignal.set(this.readDetailsErrorKey(error));
        },
      });
  }

  loadBranchSelection(): void {
    if (this.branchSelectionLoadingSignal()) {
      return;
    }

    this.branchSelectionLoadingSignal.set(true);
    this.branchSelectionErrorSignal.set(null);

    this.branchAreasService
      .selection()
      .pipe(
        take(1),
        finalize(() => this.branchSelectionLoadingSignal.set(false)),
      )
      .subscribe({
        next: (branches) => {
          this.branchSelectionSignal.set(branches);
        },
        error: () => {
          this.branchSelectionSignal.set([]);
          this.branchSelectionErrorSignal.set('branchAreas.assignBranchesSelectionLoadError');
        },
      });
  }

  update(branchAreaId: string, payload: UpdateBranchAreaPayload, onUpdated: () => void): void {
    this.clearUpdateMessages();

    if (branchAreaId.trim().length === 0) {
      this.updateErrorSignal.set('branchAreas.updateBranchAreaNotFound');
      return;
    }

    this.updatingSignal.set(true);

    this.branchAreasService
      .update(branchAreaId, payload)
      .pipe(
        take(1),
        finalize(() => this.updatingSignal.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.mergeUpdatedDetails(updated);
          this.successSignal.set('branchAreas.updateSuccess');
          onUpdated();
        },
        error: (error: unknown) => {
          this.applyUpdateError(error);
        },
      });
  }

  assignBranches(branchAreaId: string, branchIds: readonly string[], onAssigned: () => void): void {
    this.clearAssignmentMessages();

    if (branchAreaId.trim().length === 0) {
      this.assignBranchesErrorSignal.set('branchAreas.assignBranchesBranchAreaNotFound');
      return;
    }

    const normalizedBranchIds = branchIds.map((branchId) => branchId.trim());
    const branchIdsValidationError = this.validateBranchIds(normalizedBranchIds);
    if (branchIdsValidationError) {
      this.branchIdsErrorSignal.set(branchIdsValidationError);
      return;
    }

    this.assigningBranchesSignal.set(true);

    this.branchAreasService
      .assignBranches(branchAreaId, { branchIds: normalizedBranchIds })
      .pipe(
        take(1),
        finalize(() => this.assigningBranchesSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.mergeAssignedBranches(result, branchAreaId);
          this.successSignal.set('branchAreas.assignBranchesSuccess');
          onAssigned();
        },
        error: (error: unknown) => {
          this.applyAssignBranchesError(error);
        },
      });
  }

  deactivate(branchAreaId: string): void {
    this.clearUpdateMessages();

    if (branchAreaId.trim().length === 0) {
      this.deactivateErrorSignal.set('branchAreas.deactivateBranchAreaNotFound');
      return;
    }

    this.deactivatingSignal.set(true);

    this.branchAreasService
      .deactivate(branchAreaId)
      .pipe(
        take(1),
        finalize(() => this.deactivatingSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.mergeDeactivatedDetails(result, branchAreaId);
          this.successSignal.set('branchAreas.deactivateSuccess');
        },
        error: (error: unknown) => {
          this.deactivateErrorSignal.set(this.readDeactivateErrorKey(error));
        },
      });
  }

  restore(branchAreaId: string): void {
    this.clearUpdateMessages();

    if (branchAreaId.trim().length === 0) {
      this.restoreErrorSignal.set('branchAreas.restoreBranchAreaNotFound');
      return;
    }

    this.restoringSignal.set(true);

    this.branchAreasService
      .restore(branchAreaId)
      .pipe(
        take(1),
        finalize(() => this.restoringSignal.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.mergeRestoredDetails(result, branchAreaId);
          this.successSignal.set('branchAreas.restoreSuccess');
        },
        error: (error: unknown) => {
          this.restoreErrorSignal.set(this.readRestoreErrorKey(error));
        },
      });
  }

  clear(): void {
    this.detailsSignal.set(null);
    this.branchSelectionSignal.set([]);
    this.loadingSignal.set(false);
    this.branchSelectionLoadingSignal.set(false);
    this.updatingSignal.set(false);
    this.deactivatingSignal.set(false);
    this.restoringSignal.set(false);
    this.assigningBranchesSignal.set(false);
    this.errorSignal.set(null);
    this.branchSelectionErrorSignal.set(null);
    this.clearUpdateMessages();
  }

  clearUpdateMessages(): void {
    this.updateErrorSignal.set(null);
    this.deactivateErrorSignal.set(null);
    this.restoreErrorSignal.set(null);
    this.clearAssignmentMessages();
    this.emailErrorSignal.set(null);
    this.successSignal.set(null);
  }

  clearAssignmentMessages(): void {
    this.assignBranchesErrorSignal.set(null);
    this.branchIdsErrorSignal.set(null);
    this.successSignal.set(null);
  }

  clearEmailError(): void {
    this.emailErrorSignal.set(null);
  }

  private readDetailsErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.detailsLoadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code
      ? DETAILS_ERROR_KEYS[code] ?? 'branchAreas.detailsLoadError'
      : 'branchAreas.detailsLoadError';
  }

  private applyUpdateError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.updateErrorSignal.set('branchAreas.updateLoadError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage = errors[0]?.message ?? errorResponse?.detail ?? 'branchAreas.updateLoadError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      const errorKey = UPDATE_ERROR_KEYS[code] ?? item.message ?? fallbackMessage;

      if (this.isEmailError(code)) {
        this.emailErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      this.updateErrorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.updateErrorSignal.set(fallbackMessage);
    }
  }

  private readDeactivateErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.deactivateLoadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code
      ? DEACTIVATE_ERROR_KEYS[code] ?? 'branchAreas.deactivateLoadError'
      : 'branchAreas.deactivateLoadError';
  }

  private readRestoreErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'branchAreas.restoreLoadError';
    }

    const errorResponse = error.error as ApiErrorResponse | null;
    const code = errorResponse?.errors?.find((item) => item.code)?.code;
    return code ? RESTORE_ERROR_KEYS[code] ?? 'branchAreas.restoreLoadError' : 'branchAreas.restoreLoadError';
  }

  private applyAssignBranchesError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.assignBranchesErrorSignal.set('branchAreas.assignBranchesLoadError');
      return;
    }

    const errorResponse = this.readErrorResponse(error.error);
    const errors = errorResponse?.errors ?? [];
    const fallbackMessage =
      errors[0]?.message ?? errorResponse?.detail ?? 'branchAreas.assignBranchesLoadError';
    let hasSpecificError = false;

    for (const item of errors) {
      const code = item.code ?? item.messageName ?? '';
      const errorKey = ASSIGN_BRANCHES_ERROR_KEYS[code] ?? item.message ?? fallbackMessage;

      if (this.isBranchesError(code)) {
        this.branchIdsErrorSignal.set(errorKey);
        hasSpecificError = true;
        continue;
      }

      this.assignBranchesErrorSignal.set(errorKey);
      hasSpecificError = true;
    }

    if (!hasSpecificError) {
      this.assignBranchesErrorSignal.set(fallbackMessage);
    }
  }

  private mergeUpdatedDetails(updated: BranchAreaListItem): void {
    const current = this.detailsSignal();

    this.detailsSignal.set({
      branchAreaId: updated.branchAreaId || current?.branchAreaId || '',
      applicationUserId: updated.applicationUserId || current?.applicationUserId || '',
      nameEn: updated.nameEn,
      nameAr: updated.nameAr,
      userName: updated.userName || current?.userName || '',
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      isActive: updated.isActive,
      createdOnUtc: updated.createdOnUtc || current?.createdOnUtc || '',
      branches: updated.branches.length > 0 ? updated.branches : current?.branches ?? [],
    });
  }

  private mergeAssignedBranches(
    result: AssignBranchAreaBranchesResult,
    fallbackBranchAreaId: string,
  ): void {
    const current = this.detailsSignal();
    if (!current) {
      return;
    }

    const branchAreaId = result.branchAreaId || fallbackBranchAreaId;
    if (current.branchAreaId !== branchAreaId) {
      return;
    }

    this.detailsSignal.set({
      ...current,
      branches: result.branches,
    });
  }

  private mergeDeactivatedDetails(
    result: DeactivateBranchAreaResult,
    fallbackBranchAreaId: string,
  ): void {
    const current = this.detailsSignal();
    if (!current) {
      return;
    }

    const branchAreaId = result.branchAreaId || fallbackBranchAreaId;
    if (current.branchAreaId !== branchAreaId) {
      return;
    }

    this.detailsSignal.set({
      ...current,
      applicationUserId: result.applicationUserId || current.applicationUserId,
      isActive: result.isActive,
    });
  }

  private mergeRestoredDetails(result: RestoreBranchAreaResult, fallbackBranchAreaId: string): void {
    const current = this.detailsSignal();
    if (!current) {
      return;
    }

    const branchAreaId = result.branchAreaId || fallbackBranchAreaId;
    if (current.branchAreaId !== branchAreaId) {
      return;
    }

    this.detailsSignal.set({
      ...current,
      applicationUserId: result.applicationUserId || current.applicationUserId,
      isActive: result.isActive,
    });
  }

  private validateBranchIds(branchIds: readonly string[]): string | null {
    if (branchIds.length === 0) {
      return 'branchAreas.assignBranchesRequired';
    }

    if (branchIds.some((branchId) => branchId.length === 0 || branchId === EMPTY_GUID)) {
      return 'branchAreas.assignBranchesInvalid';
    }

    if (new Set(branchIds).size !== branchIds.length) {
      return 'branchAreas.assignBranchesDuplicated';
    }

    return null;
  }

  private readErrorResponse(value: unknown): ApiErrorResponse | null {
    return typeof value === 'object' && value !== null ? (value as ApiErrorResponse) : null;
  }

  private isEmailError(code: string): boolean {
    return code.includes('Email');
  }

  private isBranchesError(code: string): boolean {
    return code.includes('Branches') || code.includes('BranchIds');
  }
}
