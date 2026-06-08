import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateDepartmentAdminPayload,
  CreateDepartmentAdminResponse,
  DepartmentAdminStateChangeApiResponse,
  DepartmentAdminStateChangeResult,
} from '../domain/department-admin.model';

@Injectable()
export class DepartmentAdminsService {
  private readonly http = inject(HttpClient);
  private readonly departmentAdminsUrl = `${environment.apiBaseUrl}/api/department-admins`;

  create(payload: CreateDepartmentAdminPayload): Observable<CreateDepartmentAdminResponse> {
    return this.http.post<CreateDepartmentAdminResponse>(this.departmentAdminsUrl, payload);
  }

  deactivate(departmentAdminId: string): Observable<DepartmentAdminStateChangeResult> {
    return this.http.put<DepartmentAdminStateChangeApiResponse>(
      `${this.departmentAdminsUrl}/${departmentAdminId}/deactivate`,
      null,
    ).pipe(map((response) => this.toStateChange(response, departmentAdminId, false)));
  }

  restore(departmentAdminId: string): Observable<DepartmentAdminStateChangeResult> {
    return this.http.put<DepartmentAdminStateChangeApiResponse>(
      `${this.departmentAdminsUrl}/${departmentAdminId}/restore`,
      null,
    ).pipe(map((response) => this.toStateChange(response, departmentAdminId, true)));
  }

  private toStateChange(
    response: DepartmentAdminStateChangeApiResponse,
    fallbackDepartmentAdminId: string,
    fallbackIsActive: boolean,
  ): DepartmentAdminStateChangeResult {
    return {
      departmentAdminId: this.readRecordId(response.departmentAdminId) || fallbackDepartmentAdminId,
      applicationUserId: this.readRecordId(response.applicationUserId),
      isActive: response.isActive ?? fallbackIsActive,
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
