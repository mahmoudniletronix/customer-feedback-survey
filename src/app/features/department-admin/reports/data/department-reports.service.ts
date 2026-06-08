import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  DepartmentCriticalResponse,
  DepartmentCriticalResponseCustomInput,
  DepartmentCustomInputSegment,
  DepartmentCustomInputSegmentValue,
  DepartmentDashboardPeriod,
  DepartmentDashboardQuery,
  DepartmentDashboardResponse,
  DepartmentDashboardSummary,
  DepartmentDashboardTrendPoint,
  DepartmentOperatorPerformance,
  DepartmentOperatorResponseListItem,
  DepartmentOperatorResponsesPagination,
  DepartmentOperatorResponsesQuery,
  DepartmentQuestionInsight,
  DepartmentReportTemplateOption,
  DepartmentReportsGroupBy,
  DepartmentReportsOrderSort,
  DepartmentReportsRiskLevel,
  DepartmentResponseAnswer,
  DepartmentResponseBranch,
  DepartmentResponseCustomInput,
  DepartmentResponseCustomInputPreview,
  DepartmentResponseDetails,
  DepartmentResponseOperator,
  DepartmentResponseQuestionType,
  DepartmentResponseScore,
  DepartmentResponseTemplate,
  DepartmentTemplatePerformance,
} from '../domain/department-reports.model';

type ApiRecord = Record<string, unknown>;

@Injectable()
export class DepartmentReportsService {
  private readonly http = inject(HttpClient);
  private readonly departmentDashboardUrl = `${environment.apiBaseUrl}/api/reports/department-dashboard`;
  private readonly departmentOperatorsUrl = `${environment.apiBaseUrl}/api/reports/department-operators`;
  private readonly templatesSelectionUrl = `${environment.apiBaseUrl}/api/templates/selection`;

  getDashboard(query: DepartmentDashboardQuery): Observable<DepartmentDashboardResponse> {
    let params = new HttpParams();

    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.templateId) params = params.set('templateId', query.templateId);
    if (query.groupBy) params = params.set('groupBy', query.groupBy);
    if (query.topQuestionsCount !== undefined) {
      params = params.set('topQuestionsCount', String(query.topQuestionsCount));
    }
    if (query.criticalResponsesCount !== undefined) {
      params = params.set('criticalResponsesCount', String(query.criticalResponsesCount));
    }
    if (query.criticalScoreThreshold !== undefined) {
      params = params.set('criticalScoreThreshold', String(query.criticalScoreThreshold));
    }

    return this.http
      .get<ApiRecord>(this.departmentDashboardUrl, { params })
      .pipe(map((response) => this.toDashboard(response)));
  }

  getOperatorResponses(
    operatorId: string,
    query: DepartmentOperatorResponsesQuery,
  ): Observable<DepartmentOperatorResponsesPagination> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize))
      .set('orderSort', query.orderSort ?? 'Newest');

    if (query.searchText) params = params.set('searchText', query.searchText);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.templateId) params = params.set('templateId', query.templateId);
    if (query.minScorePercentage !== undefined) {
      params = params.set('minScorePercentage', String(query.minScorePercentage));
    }
    if (query.maxScorePercentage !== undefined) {
      params = params.set('maxScorePercentage', String(query.maxScorePercentage));
    }
    if (query.hasComplaint !== undefined) {
      params = params.set('hasComplaint', String(query.hasComplaint));
    }
    if (query.hasVoice !== undefined) {
      params = params.set('hasVoice', String(query.hasVoice));
    }

    return this.http
      .get<ApiRecord>(
        `${this.departmentOperatorsUrl}/${encodeURIComponent(operatorId)}/responses`,
        { params },
      )
      .pipe(map((response) => this.toOperatorResponsesPagination(response)));
  }

  getResponseDetails(operatorId: string, surveyResponseId: string): Observable<DepartmentResponseDetails> {
    return this.http
      .get<ApiRecord>(
        `${this.departmentOperatorsUrl}/${encodeURIComponent(operatorId)}/responses/${encodeURIComponent(
          surveyResponseId,
        )}`,
      )
      .pipe(map((response) => this.toResponseDetails(response)));
  }

  getTemplateOptions(): Observable<readonly DepartmentReportTemplateOption[]> {
    return this.http.get<unknown>(this.templatesSelectionUrl).pipe(
      map((response) =>
        this.readArray(response)
          .map((item) => this.toTemplateOption(item))
          .filter((template) => template.id.length > 0),
      ),
    );
  }

  private toDashboard(response: ApiRecord): DepartmentDashboardResponse {
    return {
      period: this.toPeriod(this.readRecord(response['period'])),
      summary: this.toSummary(this.readRecord(response['summary'])),
      satisfactionTrend: this.readArray(response['satisfactionTrend']).map((item) =>
        this.toTrendPoint(item),
      ),
      operatorPerformance: this.readArray(response['operatorPerformance']).map((item) =>
        this.toOperatorPerformance(item),
      ),
      templatePerformance: this.readArray(response['templatePerformance']).map((item) =>
        this.toTemplatePerformance(item),
      ),
      lowestRatedQuestions: this.readArray(response['lowestRatedQuestions']).map((item) =>
        this.toQuestionInsight(item),
      ),
      customInputSegments: this.readArray(response['customInputSegments']).map((item) =>
        this.toCustomInputSegment(item),
      ),
      criticalResponses: this.readArray(response['criticalResponses']).map((item) =>
        this.toCriticalResponse(item),
      ),
    };
  }

  private toPeriod(period: ApiRecord | null): DepartmentDashboardPeriod {
    return {
      from: this.readString(period, 'from'),
      to: this.readString(period, 'to'),
      isDefaultPeriod: this.readBoolean(period, 'isDefaultPeriod'),
      groupBy: this.toGroupBy(this.readString(period, 'groupBy')),
    };
  }

  private toSummary(summary: ApiRecord | null): DepartmentDashboardSummary {
    return {
      totalOperators: this.readNumber(summary, 'totalOperators'),
      activeOperators: this.readNumber(summary, 'activeOperators'),
      totalAssignedTemplates: this.readNumber(summary, 'totalAssignedTemplates'),
      activeAssignedTemplates: this.readNumber(summary, 'activeAssignedTemplates'),
      templatesWithResponsesCount: this.readNumber(summary, 'templatesWithResponsesCount'),
      totalResponses: this.readNumber(summary, 'totalResponses'),
      averageScorePercentage: this.readNumber(summary, 'averageScorePercentage'),
      complaintsCount: this.readNumber(summary, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(summary, 'voiceAnswersCount'),
      satisfiedResponses: this.readNumber(summary, 'satisfiedResponses'),
      neutralResponses: this.readNumber(summary, 'neutralResponses'),
      unhappyResponses: this.readNumber(summary, 'unhappyResponses'),
      scoredResponses: this.readNumber(summary, 'scoredResponses'),
      unscoredResponses: this.readNumber(summary, 'unscoredResponses'),
    };
  }

  private toTrendPoint(item: ApiRecord): DepartmentDashboardTrendPoint {
    return {
      period: this.readString(item, 'period'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
    };
  }

  private toOperatorPerformance(item: ApiRecord): DepartmentOperatorPerformance {
    return {
      operatorId: this.readString(item, 'operatorId'),
      operatorNameEn: this.readString(item, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr'),
      status: this.readString(item, 'status') || '-',
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(item, 'voiceAnswersCount'),
      lastResponseOnUtc: this.readNullableString(item, 'lastResponseOnUtc'),
      riskLevel: this.toRiskLevel(this.readString(item, 'riskLevel')),
    };
  }

  private toTemplatePerformance(item: ApiRecord): DepartmentTemplatePerformance {
    return {
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      riskLevel: this.toRiskLevel(this.readString(item, 'riskLevel')),
    };
  }

  private toQuestionInsight(item: ApiRecord): DepartmentQuestionInsight {
    return {
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      questionId: this.readString(item, 'questionId'),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.readString(item, 'questionType'),
      questionTypeName: this.readString(item, 'questionTypeName'),
      answersCount: this.readNumber(item, 'answersCount'),
      averageValue: this.readNumber(item, 'averageValue'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
    };
  }

  private toCustomInputSegment(item: ApiRecord): DepartmentCustomInputSegment {
    return {
      customInputName: this.readString(item, 'customInputName'),
      type: this.readString(item, 'type'),
      typeName: this.readString(item, 'typeName'),
      segments: this.readArray(item['segments']).map((segment) =>
        this.toCustomInputSegmentValue(segment),
      ),
    };
  }

  private toCustomInputSegmentValue(item: ApiRecord): DepartmentCustomInputSegmentValue {
    return {
      value: this.readString(item, 'value'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
    };
  }

  private toCriticalResponse(item: ApiRecord): DepartmentCriticalResponse {
    return {
      surveyResponseId: this.readString(item, 'surveyResponseId'),
      operatorId: this.readString(item, 'operatorId'),
      operatorNameEn: this.readString(item, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr'),
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      scorePercentage: this.readNumber(item, 'scorePercentage'),
      complaintText: this.readNullableString(item, 'complaintText'),
      customInputs: this.readArray(item['customInputs']).map((input) =>
        this.toCriticalCustomInput(input),
      ),
    };
  }

  private toCriticalCustomInput(item: ApiRecord): DepartmentCriticalResponseCustomInput {
    return {
      name: this.readString(item, 'name'),
      value: this.readString(item, 'value'),
    };
  }

  private toOperatorResponsesPagination(response: ApiRecord): DepartmentOperatorResponsesPagination {
    const currentPage = this.readNumber(response, 'currentPage') || 1;
    const pageSize = this.readNumber(response, 'pageSize') || 10;
    const totalPages = this.readNumber(response, 'totalPages');

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems: this.readNumber(response, 'totalItems'),
      hasPreviousPage: this.readBoolean(response, 'hasPreviousPage') || currentPage > 1,
      hasNextPage:
        this.readBoolean(response, 'hasNextPage') || (totalPages > 0 && currentPage < totalPages),
      data: this.readArray(response['data']).map((item) => this.toOperatorResponseItem(item)),
    };
  }

  private toOperatorResponseItem(item: ApiRecord): DepartmentOperatorResponseListItem {
    return {
      surveyResponseId: this.readString(item, 'surveyResponseId'),
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      operatorId: this.readString(item, 'operatorId'),
      operatorNameEn: this.readString(item, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr'),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      actualScore: this.readNumber(item, 'actualScore'),
      maxScore: this.readNumber(item, 'maxScore'),
      scorePercentage: this.readNumber(item, 'scorePercentage'),
      isScored: this.readBoolean(item, 'isScored'),
      hasComplaint: this.readBoolean(item, 'hasComplaint'),
      hasVoice: this.readBoolean(item, 'hasVoice'),
      customInputsPreview: this.readArray(item['customInputsPreview']).map((input) =>
        this.toCustomInputPreview(input),
      ),
    };
  }

  private toCustomInputPreview(item: ApiRecord): DepartmentResponseCustomInputPreview {
    return {
      name: this.readString(item, 'name'),
      value: this.readString(item, 'value'),
    };
  }

  private toResponseDetails(response: ApiRecord): DepartmentResponseDetails {
    return {
      surveyResponseId: this.readString(response, 'surveyResponseId'),
      branch: this.toResponseBranch(this.readRecord(response['branch'])),
      template: this.toResponseTemplate(this.readRecord(response['template'])),
      operator: this.toResponseOperator(this.readRecord(response['operator'])),
      submittedOnUtc: this.readString(response, 'submittedOnUtc'),
      score: this.toResponseScore(this.readRecord(response['score'])),
      customInputsCount: this.readNumber(response, 'customInputsCount'),
      answersCount: this.readNumber(response, 'answersCount'),
      customInputs: this.readArray(response['customInputs']).map((input) =>
        this.toResponseCustomInput(input),
      ),
      answers: this.readArray(response['answers']).map((answer) => this.toResponseAnswer(answer)),
    };
  }

  private toResponseBranch(branch: ApiRecord | null): DepartmentResponseBranch {
    return {
      branchId: this.readString(branch, 'branchId'),
      nameEn: this.readString(branch, 'nameEn'),
      nameAr: this.readNullableString(branch, 'nameAr'),
      code: this.readString(branch, 'code'),
    };
  }

  private toResponseTemplate(template: ApiRecord | null): DepartmentResponseTemplate {
    return {
      templateId: this.readString(template, 'templateId'),
      nameEn: this.readString(template, 'nameEn'),
      nameAr: this.readNullableString(template, 'nameAr'),
    };
  }

  private toResponseOperator(operator: ApiRecord | null): DepartmentResponseOperator {
    return {
      operatorId: this.readString(operator, 'operatorId'),
      nameEn: this.readString(operator, 'nameEn'),
      nameAr: this.readNullableString(operator, 'nameAr'),
    };
  }

  private toResponseScore(score: ApiRecord | null): DepartmentResponseScore {
    return {
      actualScore: this.readNumber(score, 'actualScore'),
      maxScore: this.readNumber(score, 'maxScore'),
      scorePercentage: this.readNumber(score, 'scorePercentage'),
      isScored: this.readBoolean(score, 'isScored'),
    };
  }

  private toResponseCustomInput(item: ApiRecord): DepartmentResponseCustomInput {
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

  private toResponseAnswer(item: ApiRecord): DepartmentResponseAnswer {
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

  private toTemplateOption(item: ApiRecord): DepartmentReportTemplateOption {
    return {
      id: this.readString(item, 'id') || this.readString(item, 'templateId'),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readNullableString(item, 'nameAr'),
      branchId: this.readString(item, 'branchId'),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
    };
  }

  private toGroupBy(value: string): DepartmentReportsGroupBy {
    return value === 'Month' ? 'Month' : 'Day';
  }

  private toRiskLevel(value: string): DepartmentReportsRiskLevel {
    if (value === 'HighRisk' || value === 'MediumRisk' || value === 'Healthy') {
      return value;
    }

    return 'Healthy';
  }

  private toOrderSort(value: string): DepartmentReportsOrderSort {
    return value === 'Oldest' ? 'Oldest' : 'Newest';
  }

  private toQuestionType(value: string): DepartmentResponseQuestionType {
    if (
      value === 'SingleChoice' ||
      value === 'StarRating' ||
      value === 'Smiles' ||
      value === 'Complain' ||
      value === 'Voice' ||
      value === 'Image'
    ) {
      return value;
    }

    return 'SingleChoice';
  }

  normalizeOrderSort(value: string): DepartmentReportsOrderSort {
    return this.toOrderSort(value);
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
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
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
