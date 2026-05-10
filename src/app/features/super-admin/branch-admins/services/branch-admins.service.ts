import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UpdateBranchAdminPayload } from '../models/branch-admin.model';

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
}

