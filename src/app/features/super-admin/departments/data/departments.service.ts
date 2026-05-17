import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateDepartmentApiResponse,
  CreateDepartmentPayload,
  DeleteDepartmentApiResponse,
  Department,
  DepartmentApiResponse,
  DepartmentDetails,
  DepartmentDetailsApiResponse,
  DepartmentDetailsSummary,
  DepartmentDetailsSummaryApiResponse,
  DepartmentDetailsUser,
  DepartmentDetailsUserApiResponse,
  DepartmentListQuery,
  DepartmentPageApiResponse,
  DepartmentPageResult,
  DepartmentSelection,
  DepartmentSelectionApiResponse,
  UpdateDepartmentApiResponse,
  UpdateDepartmentPayload,
} from '../domain/department.model';

@Injectable()
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly departmentsUrl = `${environment.apiBaseUrl}/api/departments`;

  list(query: DepartmentListQuery): Observable<DepartmentPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    return this.http
      .get<DepartmentPageApiResponse | readonly DepartmentApiResponse[]>(this.departmentsUrl, { params })
      .pipe(map((response) => this.toDepartmentPageResult(response, query)));
  }

  selection(): Observable<readonly DepartmentSelection[]> {
    return this.http
      .get<readonly DepartmentSelectionApiResponse[]>(`${this.departmentsUrl}/selection`)
      .pipe(map((response) => response.map((department) => this.toDepartmentSelection(department))));
  }

  details(departmentId: string): Observable<DepartmentDetails> {
    return this.http
      .get<DepartmentDetailsApiResponse>(`${this.departmentsUrl}/${departmentId}`)
      .pipe(map((response) => this.toDepartmentDetails(response)));
  }

  create(payload: CreateDepartmentPayload): Observable<CreateDepartmentApiResponse> {
    return this.http.post<CreateDepartmentApiResponse>(this.departmentsUrl, payload);
  }

  update(departmentId: string, payload: UpdateDepartmentPayload): Observable<UpdateDepartmentApiResponse> {
    return this.http.put<UpdateDepartmentApiResponse>(`${this.departmentsUrl}/${departmentId}`, payload);
  }

  delete(departmentId: string): Observable<DeleteDepartmentApiResponse> {
    return this.http.delete<DeleteDepartmentApiResponse>(`${this.departmentsUrl}/${departmentId}`);
  }

  private toDepartmentPageResult(
    response: DepartmentPageApiResponse | readonly DepartmentApiResponse[],
    query: DepartmentListQuery
  ): DepartmentPageResult {
    if (Array.isArray(response)) {
      const departments = response.map((department) => this.toDepartment(department));

      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: departments.length,
        data: departments,
      };
    }

    const pageResponse = response as DepartmentPageApiResponse;
    const departments = (pageResponse.data ?? []).map((department: DepartmentApiResponse) =>
      this.toDepartment(department)
    );

    return {
      currentPage: pageResponse.currentPage ?? query.pageNumber,
      pageSize: pageResponse.pageSize ?? query.pageSize,
      totalItems: pageResponse.totalItems ?? departments.length,
      data: departments,
    };
  }

  private toDepartment(response: DepartmentApiResponse): Department {
    return {
      id: this.readDepartmentId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toDepartmentSelection(response: DepartmentSelectionApiResponse): DepartmentSelection {
    return {
      id: this.readDepartmentId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
    };
  }

  private toDepartmentDetails(response: DepartmentDetailsApiResponse): DepartmentDetails {
    return {
      id: this.readDepartmentId(response),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      isActive: response.isActive ?? true,
      createdOnUtc: response.createdOnUtc ?? '',
      summary: this.toDepartmentDetailsSummary(response.summary),
      departmentAdmins: (response.departmentAdmins ?? []).map((admin) => this.toDepartmentDetailsUser(admin)),
      operators: (response.operators ?? []).map((operator) => this.toDepartmentDetailsUser(operator)),
    };
  }

  private toDepartmentDetailsSummary(
    response: DepartmentDetailsSummaryApiResponse | undefined
  ): DepartmentDetailsSummary {
    return {
      departmentAdminsCount: response?.departmentAdminsCount ?? 0,
      operatorsCount: response?.operatorsCount ?? 0,
    };
  }

  private toDepartmentDetailsUser(response: DepartmentDetailsUserApiResponse): DepartmentDetailsUser {
    return {
      departmentAdminId: this.readRecordId(response.departmentAdminId) || undefined,
      operatorId: this.readRecordId(response.operatorId) || undefined,
      applicationUserId: this.readRecordId(response.applicationUserId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
    };
  }

  private readDepartmentId(response: DepartmentApiResponse | DepartmentSelectionApiResponse): string {
    return this.readRecordId(response.id ?? response.departmentId);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
