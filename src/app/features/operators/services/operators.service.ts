import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateOperatorApiResponse,
  CreateOperatorPayload,
  CreateOperatorResponse,
  OperatorActiveTemplateSelection,
  OperatorActiveTemplateSelectionApiResponse,
  OperatorApiResponse,
  OperatorDepartmentSelection,
  OperatorDepartmentSelectionApiResponse,
  OperatorListItem,
  OperatorTemplateQuestionSelectionApiResponse,
  OperatorTemplateQuestionSelectionItem,
  OperatorTemplatesSelection,
  OperatorTemplatesSelectionApiResponse,
  OperatorTemplateSelectionApiResponse,
  OperatorTemplateSelectionItem,
  OperatorsPageApiResponse,
  OperatorsPageResult,
  OperatorsQuery,
  UpdateOperatorApiResponse,
  UpdateOperatorPayload,
  UpdateOperatorResponse,
  UpdateOperatorTemplatesPayload,
} from '../models/operator.model';

@Injectable()
export class OperatorsService {
  private readonly http = inject(HttpClient);
  private readonly operatorsUrl = `${environment.apiBaseUrl}/api/operators`;
  private readonly departmentsSelectionUrl = `${environment.apiBaseUrl}/api/departments/selection`;
  private readonly templatesSelectionUrl = `${environment.apiBaseUrl}/api/templates/selection`;

  list(query: OperatorsQuery): Observable<OperatorsPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    const departmentId = query.departmentId.trim();
    if (departmentId.length > 0) {
      params = params.set('departmentId', departmentId);
    }

    return this.http
      .get<
        OperatorsPageApiResponse | readonly OperatorApiResponse[] | OperatorApiResponse
      >(this.operatorsUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateOperatorPayload): Observable<CreateOperatorResponse> {
    return this.http
      .post<CreateOperatorApiResponse>(this.operatorsUrl, payload)
      .pipe(map((response) => this.toCreateResponse(response, payload)));
  }

  update(operatorId: string, payload: UpdateOperatorPayload): Observable<UpdateOperatorResponse> {
    return this.http
      .put<UpdateOperatorApiResponse>(`${this.operatorsUrl}/${operatorId}`, payload)
      .pipe(map((response) => this.toUpdateResponse(response, operatorId, payload)));
  }

  templatesSelection(
    operatorId: string,
    searchText: string,
  ): Observable<OperatorTemplatesSelection> {
    let params = new HttpParams();
    const normalizedSearchText = searchText.trim();
    if (normalizedSearchText.length > 0) {
      params = params.set('searchText', normalizedSearchText);
    }

    return this.http
      .get<OperatorTemplatesSelectionApiResponse>(
        `${this.operatorsUrl}/${operatorId}/templates-selection`,
        {
          params,
        },
      )
      .pipe(map((response) => this.toTemplatesSelection(response, operatorId)));
  }

  updateTemplatesSelection(
    operatorId: string,
    payload: UpdateOperatorTemplatesPayload,
  ): Observable<void> {
    return this.http.put<void>(`${this.operatorsUrl}/${operatorId}/templates`, payload);
  }

  departmentSelection(): Observable<readonly OperatorDepartmentSelection[]> {
    return this.http
      .get<readonly OperatorDepartmentSelectionApiResponse[]>(this.departmentsSelectionUrl)
      .pipe(
        map((response) =>
          response
            .map((department) => this.toDepartmentSelection(department))
            .filter((department) => department.id.length > 0),
        ),
      );
  }

  activeTemplatesSelection(): Observable<readonly OperatorActiveTemplateSelection[]> {
    return this.http
      .get<readonly OperatorActiveTemplateSelectionApiResponse[]>(this.templatesSelectionUrl)
      .pipe(
        map((response) =>
          response
            .map((template) => this.toActiveTemplateSelection(template))
            .filter((template) => template.id.length > 0),
        ),
      );
  }

  private toPageResult(
    response: OperatorsPageApiResponse | readonly OperatorApiResponse[] | OperatorApiResponse,
    query: OperatorsQuery,
  ): OperatorsPageResult {
    if (this.isOperatorsArray(response)) {
      const operators = response.map((operator) => this.toOperator(operator));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: operators.length,
        data: operators,
      };
    }

    if (this.isPageResponse(response)) {
      const operators = (response.data ?? []).map((operator) => this.toOperator(operator));
      return {
        currentPage: response.currentPage ?? query.pageNumber,
        pageSize: response.pageSize ?? query.pageSize,
        totalItems: response.totalItems ?? operators.length,
        data: operators,
      };
    }

    const operator = this.toOperator(response);
    return {
      currentPage: query.pageNumber,
      pageSize: query.pageSize,
      totalItems: operator.operatorId.length > 0 ? 1 : 0,
      data: operator.operatorId.length > 0 ? [operator] : [],
    };
  }

  private toOperator(response: OperatorApiResponse): OperatorListItem {
    return {
      operatorId: this.readRecordId(response.operatorId),
      applicationUserId: this.readRecordId(response.applicationUserId),
      departmentId: this.readRecordId(response.departmentId),
      departmentNameEn: response.departmentNameEn ?? '',
      departmentNameAr: response.departmentNameAr ?? '',
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      userName: response.userName ?? '',
      email: response.email ?? '',
      phoneNumber: response.phoneNumber ?? '',
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toCreateResponse(
    response: CreateOperatorApiResponse,
    fallbackPayload: CreateOperatorPayload,
  ): CreateOperatorResponse {
    return {
      applicationUserId: this.readRecordId(response.applicationUserId),
      operatorId: this.readRecordId(response.operatorId),
      departmentId: this.readRecordId(response.departmentId) || fallbackPayload.departmentId || '',
      nameEn: response.nameEn ?? fallbackPayload.nameEn,
      userName: response.userName ?? fallbackPayload.userName,
      email: response.email ?? fallbackPayload.email,
    };
  }

  private toUpdateResponse(
    response: UpdateOperatorApiResponse,
    fallbackOperatorId: string,
    fallbackPayload: UpdateOperatorPayload,
  ): UpdateOperatorResponse {
    return {
      operatorId: this.readRecordId(response.operatorId) || fallbackOperatorId,
      applicationUserId: this.readRecordId(response.applicationUserId),
      departmentId: this.readRecordId(response.departmentId),
      nameEn: response.nameEn ?? fallbackPayload.nameEn,
      nameAr: response.nameAr ?? fallbackPayload.nameAr,
      email: response.email ?? fallbackPayload.email,
      phoneNumber: response.phoneNumber ?? fallbackPayload.phoneNumber,
    };
  }

  private toDepartmentSelection(
    response: OperatorDepartmentSelectionApiResponse,
  ): OperatorDepartmentSelection {
    return {
      id: this.readRecordId(response.id ?? response.departmentId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
    };
  }

  private toActiveTemplateSelection(
    response: OperatorActiveTemplateSelectionApiResponse,
  ): OperatorActiveTemplateSelection {
    return {
      id: this.readRecordId(response.id),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      branchId: this.readRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? '',
      branchNameAr: response.branchNameAr ?? '',
      branchCode: response.branchCode ?? '',
    };
  }

  private toTemplatesSelection(
    response: OperatorTemplatesSelectionApiResponse,
    fallbackOperatorId: string,
  ): OperatorTemplatesSelection {
    const selectedTemplates = (response.selectedTemplates ?? []).map((template) =>
      this.toTemplateSelectionItem(template),
    );
    const availableTemplates = (response.availableTemplates ?? []).map((template) =>
      this.toTemplateSelectionItem(template),
    );

    return {
      operatorId: this.readRecordId(response.operatorId) || fallbackOperatorId,
      selectedTemplatesCount: response.selectedTemplatesCount ?? selectedTemplates.length,
      availableTemplatesCount: response.availableTemplatesCount ?? availableTemplates.length,
      selectedTemplates,
      availableTemplates,
    };
  }

  private toTemplateSelectionItem(
    response: OperatorTemplateSelectionApiResponse,
  ): OperatorTemplateSelectionItem {
    const questions = (response.questions ?? []).map((question) =>
      this.toTemplateQuestionSelectionItem(question),
    );

    return {
      templateId: this.readRecordId(response.templateId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      branchId: this.readRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? '',
      branchNameAr: response.branchNameAr ?? '',
      branchCode: response.branchCode ?? '',
      questionsCount: response.questionsCount ?? questions.length,
      questions,
    };
  }

  private toTemplateQuestionSelectionItem(
    response: OperatorTemplateQuestionSelectionApiResponse,
  ): OperatorTemplateQuestionSelectionItem {
    return {
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId: this.readRecordId(response.questionId),
      order: response.order ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type ?? '',
      isActive: response.isActive ?? false,
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? '',
    };
  }

  private isPageResponse(
    response: OperatorsPageApiResponse | OperatorApiResponse,
  ): response is OperatorsPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isOperatorsArray(
    response: OperatorsPageApiResponse | readonly OperatorApiResponse[] | OperatorApiResponse,
  ): response is readonly OperatorApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
