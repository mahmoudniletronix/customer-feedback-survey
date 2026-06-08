import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchAdminStateChangeApiResponse,
  BranchAdminStateChangeResult,
  UpdateBranchAdminPayload,
} from '../domain/branch-admin.model';

@Injectable()
export class BranchAdminsService {
  private readonly http = inject(HttpClient);
  private readonly branchAdminsUrl = `${environment.apiBaseUrl}/api/branch-admins`;

  update(branchAdminId: string, payload: UpdateBranchAdminPayload): Observable<void> {
    return this.http.put<void>(`${this.branchAdminsUrl}/${branchAdminId}`, payload);
  }

  delete(branchAdminId: string): Observable<void> {
    return this.http.delete<void>(`${this.branchAdminsUrl}/${branchAdminId}`);
  }

  deactivate(branchAdminId: string): Observable<BranchAdminStateChangeResult> {
    return this.http.put<BranchAdminStateChangeApiResponse>(
      `${this.branchAdminsUrl}/${branchAdminId}/deactivate`,
      null,
    ).pipe(map((response) => this.toStateChange(response, branchAdminId, false)));
  }

  restore(branchAdminId: string): Observable<BranchAdminStateChangeResult> {
    return this.http.put<BranchAdminStateChangeApiResponse>(
      `${this.branchAdminsUrl}/${branchAdminId}/restore`,
      null,
    ).pipe(map((response) => this.toStateChange(response, branchAdminId, true)));
  }

  private toStateChange(
    response: BranchAdminStateChangeApiResponse,
    fallbackBranchAdminId: string,
    fallbackIsActive: boolean,
  ): BranchAdminStateChangeResult {
    return {
      branchAdminId: this.readRecordId(response.branchAdminId) || fallbackBranchAdminId,
      applicationUserId: this.readRecordId(response.applicationUserId),
      isActive: response.isActive ?? fallbackIsActive,
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}

