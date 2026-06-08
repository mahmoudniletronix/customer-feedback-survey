import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ReportBranchOption,
  ReportDepartmentOption,
  SystemBranchPerformance,
  SystemCriticalResponse,
  SystemDashboardPeriod,
  SystemDashboardQuery,
  SystemDashboardResponse,
  SystemDashboardSummary,
  SystemDepartmentActivity,
  SystemReportsGroupBy,
  SystemReportsRiskLevel,
  SystemResponseAnswer,
  SystemResponseCustomInput,
  SystemResponseCustomInputPreview,
  SystemResponseDetails,
  SystemResponseListItem,
  SystemResponseQuestionType,
  SystemResponseScore,
  SystemResponsesPagination,
  SystemResponsesQuery,
  SystemTemplatePerformance,
  SystemTrendPoint,
} from '../domain/system-reports.model';

type ApiRecord = Record<string, unknown>;

@Injectable()
export class SystemReportsService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiBaseUrl}/api/reports`;

  getDashboard(query: SystemDashboardQuery): Observable<SystemDashboardResponse> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branchId) params = params.set('branchId', query.branchId);
    if (query.departmentId) params = params.set('departmentId', query.departmentId);
    if (query.groupBy) params = params.set('groupBy', query.groupBy);
    if (query.criticalScoreThreshold !== undefined) {
      params = params.set('criticalScoreThreshold', String(query.criticalScoreThreshold));
    }
    if (query.criticalResponsesCount !== undefined) {
      params = params.set('criticalResponsesCount', String(query.criticalResponsesCount));
    }
    if (query.topTemplatesCount !== undefined) {
      params = params.set('topTemplatesCount', String(query.topTemplatesCount));
    }

    return this.http
      .get<ApiRecord>(`${this.reportsUrl}/system-dashboard`, { params })
      .pipe(map((response) => this.toDashboard(response)));
  }

  getResponses(query: SystemResponsesQuery): Observable<SystemResponsesPagination> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branchId) params = params.set('branchId', query.branchId);
    if (query.departmentId) params = params.set('departmentId', query.departmentId);
    if (query.templateId) params = params.set('templateId', query.templateId);
    if (query.minScorePercentage !== undefined) {
      params = params.set('minScorePercentage', String(query.minScorePercentage));
    }
    if (query.maxScorePercentage !== undefined) {
      params = params.set('maxScorePercentage', String(query.maxScorePercentage));
    }
    if (query.hasComplaint !== undefined) params = params.set('hasComplaint', String(query.hasComplaint));
    if (query.hasVoice !== undefined) params = params.set('hasVoice', String(query.hasVoice));
    if (query.searchText) params = params.set('searchText', query.searchText);

    return this.http
      .get<ApiRecord>(`${this.reportsUrl}/system-responses`, { params })
      .pipe(map((response) => this.toResponsesPagination(response)));
  }

  getResponseDetails(surveyResponseId: string): Observable<SystemResponseDetails> {
    return this.http
      .get<ApiRecord>(`${this.reportsUrl}/system-responses/${encodeURIComponent(surveyResponseId)}`)
      .pipe(map((response) => this.toResponseDetails(response)));
  }

  getBranchOptions(): Observable<readonly ReportBranchOption[]> {
    return this.http
      .get<ApiRecord[]>(`${environment.apiBaseUrl}/api/branches/selection`)
      .pipe(map((response) => response.map((item) => this.toBranchOption(item))));
  }

  getDepartmentOptions(): Observable<readonly ReportDepartmentOption[]> {
    return this.http
      .get<ApiRecord[]>(`${environment.apiBaseUrl}/api/departments/selection`)
      .pipe(map((response) => response.map((item) => this.toDepartmentOption(item))));
  }

  private toDashboard(response: ApiRecord): SystemDashboardResponse {
    return {
      period: this.toPeriod(this.readRecord(response['period'])),
      summary: this.toSummary(this.readRecord(response['summary'])),
      satisfactionTrend: this.readArray(response['satisfactionTrend']).map((item) => this.toTrendPoint(item)),
      branchPerformance: this.readArray(response['branchPerformance']).map((item) => this.toBranchPerformance(item)),
      departmentActivity: this.readArray(response['departmentActivity']).map((item) => this.toDepartmentActivity(item)),
      topTemplates: this.readArray(response['topTemplates']).map((item) => this.toTemplatePerformance(item)),
      criticalResponses: this.readArray(response['criticalResponses']).map((item) => this.toCriticalResponse(item)),
    };
  }

  private toPeriod(period: ApiRecord | null): SystemDashboardPeriod {
    return {
      from: this.readString(period, 'from'),
      to: this.readString(period, 'to'),
      isDefaultPeriod: this.readBoolean(period, 'isDefaultPeriod'),
      groupBy: this.toGroupBy(this.readString(period, 'groupBy')),
    };
  }

  private toSummary(summary: ApiRecord | null): SystemDashboardSummary {
    return {
      totalBranches: this.readNumber(summary, 'totalBranches'),
      activeBranches: this.readNumber(summary, 'activeBranches'),
      inactiveBranches: this.readNumber(summary, 'inactiveBranches'),
      totalDepartments: this.readNumber(summary, 'totalDepartments'),
      activeDepartments: this.readNumber(summary, 'activeDepartments'),
      totalOperators: this.readNumber(summary, 'totalOperators'),
      totalTemplates: this.readNumber(summary, 'totalTemplates'),
      activeTemplates: this.readNumber(summary, 'activeTemplates'),
      totalResponses: this.readNumber(summary, 'totalResponses'),
      averageScorePercentage: this.readNumber(summary, 'averageScorePercentage'),
      complaintsCount: this.readNumber(summary, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(summary, 'voiceAnswersCount'),
    };
  }

  private toTrendPoint(item: ApiRecord): SystemTrendPoint {
    return {
      period: this.readString(item, 'period'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
    };
  }

  private toBranchPerformance(item: ApiRecord): SystemBranchPerformance {
    return {
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(item, 'voiceAnswersCount'),
      activeTemplatesCount: this.readNumber(item, 'activeTemplatesCount'),
      riskLevel: this.toRiskLevel(this.readString(item, 'riskLevel')),
    };
  }

  private toDepartmentActivity(item: ApiRecord): SystemDepartmentActivity {
    return {
      departmentId: this.readString(item, 'departmentId'),
      departmentNameEn: this.readString(item, 'departmentNameEn'),
      departmentNameAr: this.readNullableString(item, 'departmentNameAr'),
      operatorsCount: this.readNumber(item, 'operatorsCount'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      lastResponseDate: this.readNullableString(item, 'lastResponseDate'),
    };
  }

  private toTemplatePerformance(item: ApiRecord): SystemTemplatePerformance {
    return {
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      riskLevel: this.toRiskLevel(this.readString(item, 'riskLevel')),
    };
  }

  private toCriticalResponse(item: ApiRecord): SystemCriticalResponse {
    return {
      ...this.toResponseIdentity(item),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      scorePercentage: this.readNumber(item, 'scorePercentage'),
      complaintText: this.readNullableString(item, 'complaintText'),
      customInputs: this.readArray(item['customInputs']).map((input) => this.toCustomInputPreview(input)),
    };
  }

  private toResponsesPagination(response: ApiRecord): SystemResponsesPagination {
    return {
      currentPage: this.readNumber(response, 'currentPage') || 1,
      pageSize: this.readNumber(response, 'pageSize') || 10,
      totalItems: this.readNumber(response, 'totalItems'),
      totalPages: this.readNumber(response, 'totalPages'),
      data: this.readArray(response['data']).map((item) => this.toResponseListItem(item)),
    };
  }

  private toResponseListItem(item: ApiRecord): SystemResponseListItem {
    return {
      ...this.toResponseIdentity(item),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      actualScore: this.readNumber(item, 'actualScore'),
      maxScore: this.readNumber(item, 'maxScore'),
      scorePercentage: this.readNumber(item, 'scorePercentage'),
      isScored: this.readBoolean(item, 'isScored'),
      hasComplaint: this.readBoolean(item, 'hasComplaint'),
      hasVoice: this.readBoolean(item, 'hasVoice'),
      customInputsPreview: this.readArray(item['customInputsPreview']).map((input) => this.toCustomInputPreview(input)),
    };
  }

  private toResponseDetails(response: ApiRecord): SystemResponseDetails {
    return {
      ...this.toResponseIdentity(response),
      submittedOnUtc: this.readString(response, 'submittedOnUtc'),
      score: this.toResponseScore(this.readRecord(response['score'])),
      customInputsCount: this.readNumber(response, 'customInputsCount'),
      answersCount: this.readNumber(response, 'answersCount'),
      customInputs: this.readArray(response['customInputs']).map((input) => this.toResponseCustomInput(input)),
      answers: this.readArray(response['answers']).map((answer) => this.toResponseAnswer(answer)),
    };
  }

  private toResponseIdentity(item: ApiRecord) {
    const branch = this.readRecord(item['branch']);
    const department = this.readRecord(item['department']);
    const template = this.readRecord(item['template']);
    const operator = this.readRecord(item['operator']);

    return {
      surveyResponseId: this.readString(item, 'surveyResponseId'),
      branchId: this.readString(item, 'branchId') || this.readString(branch, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn') || this.readString(branch, 'nameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr') ?? this.readNullableString(branch, 'nameAr'),
      branchCode: this.readString(item, 'branchCode') || this.readString(branch, 'code'),
      departmentId: this.readString(item, 'departmentId') || this.readString(department, 'departmentId'),
      departmentNameEn: this.readString(item, 'departmentNameEn') || this.readString(department, 'nameEn'),
      departmentNameAr:
        this.readNullableString(item, 'departmentNameAr') ?? this.readNullableString(department, 'nameAr'),
      templateId: this.readString(item, 'templateId') || this.readString(template, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn') || this.readString(template, 'nameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr') ?? this.readNullableString(template, 'nameAr'),
      operatorId: this.readString(item, 'operatorId') || this.readString(operator, 'operatorId'),
      operatorNameEn: this.readString(item, 'operatorNameEn') || this.readString(operator, 'nameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr') ?? this.readNullableString(operator, 'nameAr'),
    };
  }

  private toResponseScore(score: ApiRecord | null): SystemResponseScore {
    return {
      actualScore: this.readNumber(score, 'actualScore'),
      maxScore: this.readNumber(score, 'maxScore'),
      scorePercentage: this.readNumber(score, 'scorePercentage'),
      isScored: this.readBoolean(score, 'isScored'),
    };
  }

  private toResponseCustomInput(item: ApiRecord): SystemResponseCustomInput {
    return {
      customInputId: this.readString(item, 'customInputId'),
      name: this.readString(item, 'name'),
      type: this.readString(item, 'type'),
      typeName: this.readString(item, 'typeName'),
      stringValue: this.readNullableString(item, 'stringValue'),
      integerValue: this.readNullableNumber(item, 'integerValue'),
      displayValue: this.readString(item, 'displayValue'),
    };
  }

  private toResponseAnswer(item: ApiRecord): SystemResponseAnswer {
    return {
      templateQuestionId: this.readString(item, 'templateQuestionId'),
      questionId: this.readString(item, 'questionId'),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.toQuestionType(this.readString(item, 'questionType')),
      questionTypeName: this.readString(item, 'questionTypeName'),
      questionOrder: this.readNumber(item, 'questionOrder') || this.readNumber(item, 'order'),
      selectedQuestionOptionId: this.readNullableString(item, 'selectedQuestionOptionId'),
      selectedOptionTextEn: this.readNullableString(item, 'selectedOptionTextEn'),
      selectedOptionTextAr: this.readNullableString(item, 'selectedOptionTextAr'),
      selectedOptionValue: this.readNullableNumber(item, 'selectedOptionValue'),
      starRatingValue: this.readNullableNumber(item, 'starRatingValue'),
      smileValue: this.readNullableNumber(item, 'smileValue'),
      textAnswer: this.readNullableString(item, 'textAnswer'),
      voiceFileName: this.readNullableString(item, 'voiceFileName'),
      voiceFileUrl: this.readNullableString(item, 'voiceFileUrl'),
      imageFileName: this.readNullableString(item, 'imageFileName'),
      imageFileUrl:
        this.readNullableString(item, 'imageFileUrl') ?? this.readNullableString(item, 'imageUrl'),
      displayValue: this.readString(item, 'displayValue'),
      children: this.readAnswerChildren(item).map((answer) => this.toResponseAnswer(answer)),
    };
  }

  private readAnswerChildren(item: ApiRecord): ApiRecord[] {
    const children = this.readArray(item['children']);
    if (children.length > 0) {
      return children;
    }

    return this.readArray(item['childAnswers']);
  }

  private toCustomInputPreview(item: ApiRecord): SystemResponseCustomInputPreview {
    return {
      name: this.readString(item, 'name'),
      value: this.readString(item, 'value'),
    };
  }

  private toBranchOption(item: ApiRecord): ReportBranchOption {
    return {
      id: this.readString(item, 'id') || this.readString(item, 'branchId'),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readString(item, 'nameAr'),
      code: this.readString(item, 'code'),
    };
  }

  private toDepartmentOption(item: ApiRecord): ReportDepartmentOption {
    return {
      id: this.readString(item, 'id') || this.readString(item, 'departmentId'),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readString(item, 'nameAr'),
    };
  }

  private toGroupBy(value: string): SystemReportsGroupBy {
    return value === 'Month' ? 'Month' : 'Day';
  }

  private toRiskLevel(value: string): SystemReportsRiskLevel {
    return value === 'HighRisk' || value === 'MediumRisk' || value === 'Healthy' ? value : 'Healthy';
  }

  private toQuestionType(value: string): SystemResponseQuestionType {
    return value === 'SingleChoice' || value === 'StarRating' || value === 'Smiles' || value === 'Complain' || value === 'Voice' || value === 'Image'
      ? value
      : 'SingleChoice';
  }

  private readRecord(value: unknown): ApiRecord | null {
    return typeof value === 'object' && value !== null ? (value as ApiRecord) : null;
  }

  private readArray(value: unknown): ApiRecord[] {
    return Array.isArray(value)
      ? value.filter((item): item is ApiRecord => typeof item === 'object' && item !== null)
      : [];
  }

  private readString(record: ApiRecord | null, key: string): string {
    const value = record?.[key];
    return typeof value === 'string' ? value : '';
  }

  private readNullableString(record: ApiRecord | null, key: string): string | null {
    const value = record?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private readNumber(record: ApiRecord | null, key: string): number {
    const value = record?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private readNullableNumber(record: ApiRecord | null, key: string): number | null {
    const value = record?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readBoolean(record: ApiRecord | null, key: string): boolean {
    return record?.[key] === true;
  }
}
