import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../../shared/models/role.model';
import { BranchContext, BranchContextApiResponse } from '../models/branch-context.model';

@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private readonly http = inject(HttpClient);
  private readonly branchesUrl = `${environment.apiBaseUrl}/api/branches`;
  private readonly myBranchUrl = `${environment.apiBaseUrl}/api/branches/my-branch`;
  private readonly branchUserMyRolesUrl = `${environment.apiBaseUrl}/api/branch-users/my-roles`;
  private readonly templatesSelectionUrl = `${environment.apiBaseUrl}/api/templates/selection`;
  private readonly operatorMyTemplatesUrl = `${environment.apiBaseUrl}/api/operators/my-templates`;
  private readonly branchSignal = signal<BranchContext | null>(null);
  private readonly loadingSignal = signal(false);
  private requestedBranchKey: string | null = null;

  readonly branch = this.branchSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  loadCurrentBranch(branchId: string | null | undefined, role: Role | null): void {
    const branchKey = `${role ?? 'unknown'}:${branchId?.trim() || 'current-user-branch'}`;
    if (this.loadingSignal() || this.requestedBranchKey === branchKey) {
      return;
    }

    this.requestedBranchKey = branchKey;
    this.loadingSignal.set(true);

    this.resolveCurrentBranch(branchId?.trim() ?? '', role)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (this.requestedBranchKey !== branchKey) {
            return;
          }

          this.branchSignal.set(response);
        },
        error: () => {
          if (this.requestedBranchKey !== branchKey) {
            return;
          }

          this.branchSignal.set(null);
        },
      });
  }

  clear(): void {
    this.requestedBranchKey = null;
    this.branchSignal.set(null);
    this.loadingSignal.set(false);
  }

  private resolveCurrentBranch(
    branchId: string,
    role: Role | null,
  ): Observable<BranchContext | null> {
    if (role === 'BRANCH_ADMIN') {
      return this.loadBranchFromEndpoint(this.myBranchUrl).pipe(
        switchMap((branch) => (branch ? of(branch) : this.loadBranchFromTemplatesSelection())),
        switchMap((branch) => this.loadBranchByIdWhenMissing(branch, branchId)),
      );
    }

    if (role === 'BRANCH_USER') {
      return this.loadBranchFromEndpoint(this.branchUserMyRolesUrl).pipe(
        switchMap((branch) => (branch ? of(branch) : this.loadBranchFromTemplatesSelection())),
        switchMap((branch) => this.loadBranchByIdWhenMissing(branch, branchId)),
      );
    }

    if (role === 'OPERATOR') {
      return this.loadBranchFromOperatorTemplates().pipe(
        switchMap((branch) => this.loadBranchByIdWhenMissing(branch, branchId)),
      );
    }

    return this.loadBranchByIdWhenMissing(null, branchId);
  }

  private loadBranchFromEndpoint(url: string): Observable<BranchContext | null> {
    return this.http.get<BranchContextApiResponse>(url).pipe(
      map((response) => this.toBranchContext(response)),
      catchError(() => of(null)),
    );
  }

  private loadBranchFromTemplatesSelection(): Observable<BranchContext | null> {
    return this.http.get<readonly BranchContextApiResponse[]>(this.templatesSelectionUrl).pipe(
      map((templates) => this.firstBranchContext(templates)),
      catchError(() => of(null)),
    );
  }

  private loadBranchFromOperatorTemplates(): Observable<BranchContext | null> {
    return this.http.get<BranchContextApiResponse>(this.operatorMyTemplatesUrl).pipe(
      map((response) => this.firstBranchContext(response.templates ?? [])),
      catchError(() => of(null)),
    );
  }

  private loadBranchByIdWhenMissing(
    branch: BranchContext | null,
    branchId: string,
  ): Observable<BranchContext | null> {
    return branch || branchId.length === 0
      ? of(branch)
      : this.loadBranchFromEndpoint(`${this.branchesUrl}/${branchId}`);
  }

  private firstBranchContext(items: readonly BranchContextApiResponse[]): BranchContext | null {
    for (const item of items) {
      const branch = this.toBranchContext(item);
      if (branch) {
        return branch;
      }
    }

    return null;
  }

  private toBranchContext(response: BranchContextApiResponse): BranchContext | null {
    const branch = response.branch ?? response;
    const nameEn =
      this.readString(branch.branchNameEn) ||
      this.readString(response.branchNameEn) ||
      this.readString(response.branchName) ||
      this.readString(branch.nameEn);
    const nameAr =
      this.readString(branch.branchNameAr) ||
      this.readString(response.branchNameAr) ||
      this.readString(branch.nameAr);

    if (nameEn.length === 0 && nameAr.length === 0) {
      return null;
    }

    return {
      id: this.readRecordId(branch.id ?? branch.branchId ?? response.id ?? response.branchId),
      nameEn,
      nameAr,
      code:
        this.readString(branch.code) ||
        this.readString(branch.branchCode) ||
        this.readString(response.branchCode),
    };
  }

  private readString(value: string | null | undefined): string {
    return typeof value === 'string' && value.length > 0 ? value : '';
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
