import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchTemplate,
  BranchTemplateApiResponse,
  BranchTemplateSelection,
  BranchTemplateSelectionApiResponse,
  BranchTemplatesPageApiResponse,
  BranchTemplatesPageResult,
  BranchTemplatesQuery,
  CreateBranchTemplatePayload,
  UpdateBranchTemplatePayload,
} from '../models/branch-template.model';

@Injectable()
export class BranchTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly templatesUrl = `${environment.apiBaseUrl}/api/templates`;
  private readonly templatesSelectionUrl = `${this.templatesUrl}/selection`;

  list(query: BranchTemplatesQuery): Observable<BranchTemplatesPageResult> {
    let params = new HttpParams()
      .set('PageNumber', query.pageNumber)
      .set('PageSize', query.pageSize);

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('SearchText', searchText);
    }

    if (query.isActive !== null) {
      params = params.set('IsActive', query.isActive);
    }

    const orderSort = query.orderSort.trim();
    if (orderSort.length > 0) {
      params = params.set('OrderSort', orderSort);
    }

    return this.http
      .get<BranchTemplatesPageApiResponse | readonly BranchTemplateApiResponse[] | BranchTemplateApiResponse>(
        this.templatesUrl,
        { params },
      )
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateBranchTemplatePayload): Observable<BranchTemplate> {
    return this.http
      .post<BranchTemplateApiResponse>(this.templatesUrl, payload)
      .pipe(map((response) => this.toTemplate(response)));
  }

  selection(): Observable<readonly BranchTemplateSelection[]> {
    return this.http
      .get<readonly BranchTemplateSelectionApiResponse[]>(this.templatesSelectionUrl)
      .pipe(
        map((response) =>
          response
            .map((template) => this.toTemplateSelection(template))
            .filter((template) => template.id.length > 0),
        ),
      );
  }

  getById(templateId: string): Observable<BranchTemplate> {
    return this.http
      .get<BranchTemplateApiResponse>(`${this.templatesUrl}/${templateId}`)
      .pipe(map((response) => this.toTemplate(response)));
  }

  update(templateId: string, payload: UpdateBranchTemplatePayload): Observable<BranchTemplate> {
    return this.http
      .put<BranchTemplateApiResponse>(`${this.templatesUrl}/${templateId}`, payload)
      .pipe(map((response) => this.toTemplate(response)));
  }

  delete(templateId: string): Observable<BranchTemplate> {
    return this.http
      .delete<BranchTemplateApiResponse>(`${this.templatesUrl}/${templateId}`)
      .pipe(map((response) => this.toTemplate(response)));
  }

  restore(templateId: string): Observable<BranchTemplate> {
    return this.http
      .put<BranchTemplateApiResponse>(`${this.templatesUrl}/${templateId}/restore`, {})
      .pipe(map((response) => this.toTemplate(response)));
  }

  private toPageResult(
    response: BranchTemplatesPageApiResponse | readonly BranchTemplateApiResponse[] | BranchTemplateApiResponse,
    query: BranchTemplatesQuery,
  ): BranchTemplatesPageResult {
    if (this.isTemplatesArray(response)) {
      const templates = response.map((template) => this.toTemplate(template));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: templates.length,
        data: templates,
      };
    }

    if (this.isPageResponse(response)) {
      const templates = (response.data ?? []).map((template) => this.toTemplate(template));
      return {
        currentPage: response.currentPage ?? query.pageNumber,
        pageSize: response.pageSize ?? query.pageSize,
        totalItems: response.totalItems ?? templates.length,
        data: templates,
      };
    }

    const template = this.toTemplate(response);
    return {
      currentPage: query.pageNumber,
      pageSize: query.pageSize,
      totalItems: template.templateId.length > 0 ? 1 : 0,
      data: template.templateId.length > 0 ? [template] : [],
    };
  }

  private toTemplate(response: BranchTemplateApiResponse): BranchTemplate {
    return {
      templateId: this.readRecordId(response.templateId),
      branchId: this.readRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      status: response.status ?? 'Draft',
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? 0,
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toTemplateSelection(response: BranchTemplateSelectionApiResponse): BranchTemplateSelection {
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

  private isPageResponse(
    response: BranchTemplatesPageApiResponse | BranchTemplateApiResponse,
  ): response is BranchTemplatesPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isTemplatesArray(
    response: BranchTemplatesPageApiResponse | readonly BranchTemplateApiResponse[] | BranchTemplateApiResponse,
  ): response is readonly BranchTemplateApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
