import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ResetUserPasswordApiResponse,
  ResetUserPasswordRequest,
  ResetUserPasswordResponse,
} from '../domain/user-password-reset.model';

@Injectable({ providedIn: 'root' })
export class UserPasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}/api/auth/users`;

  resetPassword(
    applicationUserId: string,
    request: ResetUserPasswordRequest,
  ): Observable<ResetUserPasswordResponse> {
    return this.http
      .put<ResetUserPasswordApiResponse>(
        `${this.usersUrl}/${encodeURIComponent(applicationUserId)}/reset-password`,
        request,
      )
      .pipe(map((response) => this.toResetPasswordResponse(response, applicationUserId)));
  }

  private toResetPasswordResponse(
    response: ResetUserPasswordApiResponse,
    fallbackApplicationUserId: string,
  ): ResetUserPasswordResponse {
    return {
      applicationUserId:
        this.readRecordId(response.applicationUserId) || fallbackApplicationUserId,
      passwordChanged: response.passwordChanged ?? true,
      mustChangePasswordOnNextLogin: response.mustChangePasswordOnNextLogin ?? true,
      passwordChangedOnUtc: response.passwordChangedOnUtc ?? '',
    };
  }

  private readRecordId(value: string | number | null | undefined): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
