import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Branch,
  BranchApiResponse,
  CreateBranchAdminPayload,
  CreateBranchPayload
} from '../models/branch.model';

@Injectable()
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly branchesUrl = `${environment.apiBaseUrl}/api/branches`;

  list(): Observable<readonly Branch[]> {
    return this.http
      .get<readonly BranchApiResponse[]>(this.branchesUrl)
      .pipe(map((response) => response.map((branch) => this.toBranch(branch))));
  }

  create(payload: CreateBranchPayload): Observable<void> {
    return this.http.post<void>(this.branchesUrl, payload);
  }

  createBranchAdmin(payload: CreateBranchAdminPayload): Observable<void> {
    return this.http.post<void>(`${this.branchesUrl}/branch-admins-create`, payload);
  }

  private toBranch(response: BranchApiResponse): Branch {
    return {
      id: this.readId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      code: response.code ?? '',
      address: response.address ?? ''
    };
  }

  private readId(response: BranchApiResponse): string {
    const id = response.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
