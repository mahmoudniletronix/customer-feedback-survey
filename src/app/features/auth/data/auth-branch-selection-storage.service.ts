import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BranchSelectionLoginResult, LoginBranchSelection } from '../domain/auth.model';

const BRANCH_SELECTION_KEY = 'cfs_branch_selection';

@Injectable({ providedIn: 'root' })
export class AuthBranchSelectionStorageService {
  private readonly document = inject(DOCUMENT);

  get(): BranchSelectionLoginResult | null {
    const rawSelection = this.window?.localStorage.getItem(BRANCH_SELECTION_KEY);
    if (!rawSelection) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSelection) as unknown;
      return this.isBranchSelectionResult(parsed) ? parsed : null;
    } catch {
      this.clear();
      return null;
    }
  }

  set(selection: BranchSelectionLoginResult): void {
    this.window?.localStorage.setItem(BRANCH_SELECTION_KEY, JSON.stringify(selection));
  }

  clear(): void {
    this.window?.localStorage.removeItem(BRANCH_SELECTION_KEY);
  }

  private get window(): Window | null {
    return this.document.defaultView;
  }

  private isBranchSelectionResult(value: unknown): value is BranchSelectionLoginResult {
    if (!this.isRecord(value)) {
      return false;
    }

    const branches = value['branches'];
    return (
      value['kind'] === 'branch-selection-required' &&
      value['userType'] === 'BranchArea' &&
      typeof value['token'] === 'string' &&
      typeof value['userNameOrEmail'] === 'string' &&
      Array.isArray(branches) &&
      branches.every((branch) => this.isBranchSelection(branch))
    );
  }

  private isBranchSelection(value: unknown): value is LoginBranchSelection {
    return (
      this.isRecord(value) &&
      typeof value['id'] === 'string' &&
      typeof value['nameEn'] === 'string' &&
      (value['nameAr'] === null || typeof value['nameAr'] === 'string') &&
      typeof value['code'] === 'string'
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
