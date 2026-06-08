import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateSuperAdminPayload,
  CreateSuperAdminResponse,
  ManagedUser,
} from '../domain/user-management.model';

@Injectable()
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}/api/users`;
  private readonly superAdminsUrl = `${environment.apiBaseUrl}/api/super-admins`;

  list(): Observable<readonly ManagedUser[]> {
    return this.http.get<readonly ManagedUser[]>(this.usersUrl);
  }

  createSuperAdmin(payload: CreateSuperAdminPayload): Observable<CreateSuperAdminResponse> {
    return this.http.post<CreateSuperAdminResponse>(this.superAdminsUrl, payload);
  }
}
