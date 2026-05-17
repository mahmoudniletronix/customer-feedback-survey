import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateDepartmentAdminPayload,
  CreateDepartmentAdminResponse,
} from '../domain/department-admin.model';

@Injectable()
export class DepartmentAdminsService {
  private readonly http = inject(HttpClient);
  private readonly departmentAdminsUrl = `${environment.apiBaseUrl}/api/department-admins`;

  create(payload: CreateDepartmentAdminPayload): Observable<CreateDepartmentAdminResponse> {
    return this.http.post<CreateDepartmentAdminResponse>(this.departmentAdminsUrl, payload);
  }
}
