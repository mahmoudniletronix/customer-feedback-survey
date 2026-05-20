import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchDashboardCriticalResponse,
  BranchDashboardCriticalResponseCustomInput,
  BranchDashboardCustomInputSegment,
  BranchDashboardCustomInputSegmentValue,
  BranchDashboardGroupBy,
  BranchDashboardPeriod,
  BranchDashboardQuery,
  BranchDashboardQuestionInsight,
  BranchDashboardResponse,
  BranchDashboardRiskLevel,
  BranchDashboardSummary,
  BranchDashboardTemplatePerformance,
  BranchDashboardTrendPoint,
  BranchSurveyResponseAnswer,
  BranchSurveyResponseCustomInput,
  BranchSurveyResponseCustomInputPreview,
  BranchSurveyResponseDetails,
  BranchSurveyResponseListItem,
  BranchSurveyResponsesPagination,
  BranchSurveyResponsesQuery,
  BranchSurveyResponseQuestionType,
  BranchSurveyResponseScore,
} from '../domain/branch-dashboard.model';

type ApiRecord = Record<string, unknown>;

@Injectable()
export class BranchDashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiBaseUrl}/api/reports/branch-dashboard`;
  private readonly branchResponsesUrl = `${environment.apiBaseUrl}/api/reports/branch-responses`;

  getDashboard(query: BranchDashboardQuery): Observable<BranchDashboardResponse> {
    let params = new HttpParams();

    if (query.from) {
      params = params.set('from', query.from);
    }
    if (query.to) {
      params = params.set('to', query.to);
    }
    if (query.templateId) {
      params = params.set('templateId', query.templateId);
    }
    if (query.groupBy) {
      params = params.set('groupBy', query.groupBy);
    }
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
      .get<ApiRecord>(this.dashboardUrl, { params })
      .pipe(map((response) => this.toDashboard(response)));
  }

  getResponseDetails(surveyResponseId: string): Observable<BranchSurveyResponseDetails> {
    const responseUrl = `${this.branchResponsesUrl}/${encodeURIComponent(surveyResponseId)}`;
    return this.http
      .get<ApiRecord>(responseUrl)
      .pipe(map((response) => this.toResponseDetails(response)));
  }

  getResponses(query: BranchSurveyResponsesQuery): Observable<BranchSurveyResponsesPagination> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber))
      .set('pageSize', String(query.pageSize));

    if (query.from) {
      params = params.set('from', query.from);
    }
    if (query.to) {
      params = params.set('to', query.to);
    }
    if (query.templateId) {
      params = params.set('templateId', query.templateId);
    }
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
    if (query.searchText) {
      params = params.set('searchText', query.searchText);
    }

    return this.http
      .get<ApiRecord>(this.branchResponsesUrl, { params })
      .pipe(map((response) => this.toResponsesPagination(response)));
  }

  private toDashboard(response: ApiRecord): BranchDashboardResponse {
    return {
      period: this.toPeriod(this.readRecord(response['period'])),
      summary: this.toSummary(this.readRecord(response['summary'])),
      satisfactionTrend: this.readArray(response['satisfactionTrend']).map((item) =>
        this.toTrendPoint(item),
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

  private toPeriod(period: ApiRecord | null): BranchDashboardPeriod {
    return {
      from: this.readString(period, 'from'),
      to: this.readString(period, 'to'),
      isDefaultPeriod: this.readBoolean(period, 'isDefaultPeriod'),
      groupBy: this.toGroupBy(this.readString(period, 'groupBy')),
    };
  }

  private toSummary(summary: ApiRecord | null): BranchDashboardSummary {
    return {
      branchId: this.readString(summary, 'branchId'),
      branchNameEn: this.readString(summary, 'branchNameEn'),
      branchNameAr: this.readNullableString(summary, 'branchNameAr'),
      totalResponses: this.readNumber(summary, 'totalResponses'),
      scoredResponses: this.readNumber(summary, 'scoredResponses'),
      unscoredResponses: this.readNumber(summary, 'unscoredResponses'),
      averageScorePercentage: this.readNumber(summary, 'averageScorePercentage'),
      satisfiedResponses: this.readNumber(summary, 'satisfiedResponses'),
      neutralResponses: this.readNumber(summary, 'neutralResponses'),
      unhappyResponses: this.readNumber(summary, 'unhappyResponses'),
      activeTemplatesCount: this.readNumber(summary, 'activeTemplatesCount'),
      templatesWithResponsesCount: this.readNumber(summary, 'templatesWithResponsesCount'),
      complaintsCount: this.readNumber(summary, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(summary, 'voiceAnswersCount'),
    };
  }

  private toTrendPoint(point: ApiRecord): BranchDashboardTrendPoint {
    return {
      period: this.readString(point, 'period'),
      responsesCount: this.readNumber(point, 'responsesCount'),
      averageScorePercentage: this.readNumber(point, 'averageScorePercentage'),
    };
  }

  private toTemplatePerformance(item: ApiRecord): BranchDashboardTemplatePerformance {
    return {
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      scoredResponsesCount: this.readNumber(item, 'scoredResponsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      riskLevel: this.toRiskLevel(this.readString(item, 'riskLevel')),
    };
  }

  private toQuestionInsight(item: ApiRecord): BranchDashboardQuestionInsight {
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

  private toCustomInputSegment(item: ApiRecord): BranchDashboardCustomInputSegment {
    return {
      customInputName: this.readString(item, 'customInputName'),
      type: this.readString(item, 'type'),
      typeName: this.readString(item, 'typeName'),
      segments: this.readArray(item['segments']).map((segment) =>
        this.toCustomInputSegmentValue(segment),
      ),
    };
  }

  private toCustomInputSegmentValue(item: ApiRecord): BranchDashboardCustomInputSegmentValue {
    return {
      value: this.readString(item, 'value'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      averageScorePercentage: this.readNumber(item, 'averageScorePercentage'),
    };
  }

  private toCriticalResponse(item: ApiRecord): BranchDashboardCriticalResponse {
    return {
      surveyResponseId: this.readString(item, 'surveyResponseId'),
      templateId: this.readString(item, 'templateId'),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      scorePercentage: this.readNumber(item, 'scorePercentage'),
      complaintText: this.readNullableString(item, 'complaintText'),
      customInputs: this.readArray(item['customInputs']).map((input) =>
        this.toCriticalCustomInput(input),
      ),
    };
  }

  private toCriticalCustomInput(item: ApiRecord): BranchDashboardCriticalResponseCustomInput {
    return {
      name: this.readString(item, 'name'),
      value: this.readString(item, 'value'),
    };
  }

  private toResponseDetails(response: ApiRecord): BranchSurveyResponseDetails {
    return {
      surveyResponseId: this.readString(response, 'surveyResponseId'),
      templateId: this.readString(response, 'templateId'),
      templateNameEn: this.readString(response, 'templateNameEn'),
      templateNameAr: this.readNullableString(response, 'templateNameAr'),
      operatorId: this.readString(response, 'operatorId'),
      operatorNameEn: this.readString(response, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(response, 'operatorNameAr'),
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

  private toResponseScore(score: ApiRecord | null): BranchSurveyResponseScore {
    return {
      actualScore: this.readNumber(score, 'actualScore'),
      maxScore: this.readNumber(score, 'maxScore'),
      scorePercentage: this.readNumber(score, 'scorePercentage'),
      isScored: this.readBoolean(score, 'isScored'),
    };
  }

  private toResponseCustomInput(item: ApiRecord): BranchSurveyResponseCustomInput {
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

  private toResponseAnswer(item: ApiRecord): BranchSurveyResponseAnswer {
    return {
      questionId: this.readString(item, 'questionId'),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.toResponseQuestionType(this.readString(item, 'questionType')),
      questionTypeName: this.readString(item, 'questionTypeName'),
      selectedQuestionOptionId: this.readNullableString(item, 'selectedQuestionOptionId'),
      selectedOptionTextEn: this.readNullableString(item, 'selectedOptionTextEn'),
      selectedOptionTextAr: this.readNullableString(item, 'selectedOptionTextAr'),
      selectedOptionValue: this.readNullableNumber(item, 'selectedOptionValue'),
      starRatingValue: this.readNullableNumber(item, 'starRatingValue'),
      smileValue: this.readNullableNumber(item, 'smileValue'),
      textAnswer: this.readNullableString(item, 'textAnswer'),
      voiceFileName: this.readNullableString(item, 'voiceFileName'),
      voiceFileUrl: this.readNullableString(item, 'voiceFileUrl'),
      displayValue: this.readString(item, 'displayValue'),
    };
  }

  private toResponsesPagination(response: ApiRecord): BranchSurveyResponsesPagination {
    return {
      currentPage: this.readNumber(response, 'currentPage') || 1,
      pageSize: this.readNumber(response, 'pageSize') || 10,
      totalItems: this.readNumber(response, 'totalItems'),
      totalPages: this.readNumber(response, 'totalPages'),
      data: this.readArray(response['data']).map((item) => this.toResponseListItem(item)),
    };
  }

  private toResponseListItem(item: ApiRecord): BranchSurveyResponseListItem {
    return {
      surveyResponseId: this.readString(item, 'surveyResponseId'),
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
        this.toResponseCustomInputPreview(input),
      ),
    };
  }

  private toResponseCustomInputPreview(item: ApiRecord): BranchSurveyResponseCustomInputPreview {
    return {
      name: this.readString(item, 'name'),
      value: this.readString(item, 'value'),
    };
  }

  private toGroupBy(value: string): BranchDashboardGroupBy {
    return value === 'Month' ? 'Month' : 'Day';
  }

  private toRiskLevel(value: string): BranchDashboardRiskLevel {
    if (value === 'HighRisk' || value === 'MediumRisk' || value === 'Healthy') {
      return value;
    }
    return 'Healthy';
  }

  private toResponseQuestionType(value: string): BranchSurveyResponseQuestionType {
    if (
      value === 'SingleChoice' ||
      value === 'StarRating' ||
      value === 'Smiles' ||
      value === 'Complain' ||
      value === 'Voice'
    ) {
      return value;
    }

    return 'SingleChoice';
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
