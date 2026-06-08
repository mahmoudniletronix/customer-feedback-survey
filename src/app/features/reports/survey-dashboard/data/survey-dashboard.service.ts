import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  AnswerScaleValue,
  QuestionAnswerOption,
} from '../../../../shared/models/question-answer.model';
import {
  QUESTION_CONDITION_TRIGGER_TYPE,
  QuestionCondition,
  QuestionConditionTriggerType,
  triggerTypeName,
} from '../../../../shared/models/question-condition.model';
import {
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseCustomInputValue,
  AnonymousTemplateResponseDetails,
} from '../../../anonymous-templates/domain/anonymous-template.model';
import {
  BranchSurveyResponseAnswer,
  BranchSurveyResponseCustomInput,
  BranchSurveyResponseDetails,
  BranchSurveyResponseQuestionType,
  BranchSurveyResponseScore,
} from '../../../branch-admin/dashboard/domain/branch-dashboard.model';
import {
  SurveyDashboardAppliedFilters,
  SurveyDashboardBranchOption,
  SurveyDashboardBranchSummary,
  SurveyDashboardCriticalResponse,
  SurveyDashboardCustomInputPreview,
  SurveyDashboardCustomInputSegment,
  SurveyDashboardCustomInputSegmentValue,
  SurveyDashboardGroupBy,
  SurveyDashboardLowestRatedQuestion,
  SurveyDashboardNavigation,
  SurveyDashboardPeriod,
  SurveyDashboardQuery,
  SurveyDashboardResponse,
  SurveyDashboardScope,
  SurveyDashboardSource,
  SurveyDashboardSourceBreakdown,
  SurveyDashboardSourceMetrics,
  SurveyDashboardSummary,
  SurveyDashboardTemplateDashboardSource,
  SurveyDashboardTemplateCustomInput,
  SurveyDashboardTemplateDetails,
  SurveyDashboardTemplateKind,
  SurveyDashboardTemplateOption,
  SurveyDashboardTemplatePerformance,
  SurveyDashboardTemplateQuestion,
  SurveyDashboardTemplatesSelectionQuery,
  SurveyDashboardTrendPoint,
} from '../domain/survey-dashboard.model';

type ApiRecord = Record<string, unknown>;

@Injectable()
export class SurveyDashboardService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiBaseUrl}/api/reports`;
  private readonly dashboardUrl = `${this.reportsUrl}/survey-dashboard`;
  private readonly dashboardTemplatesSelectionUrl = `${this.dashboardUrl}/templates-selection`;
  private readonly templatesUrl = `${environment.apiBaseUrl}/api/templates`;
  private readonly anonymousTemplatesUrl = `${environment.apiBaseUrl}/api/anonymous-templates`;

  getDashboard(query: SurveyDashboardQuery): Observable<SurveyDashboardResponse> {
    return this.http
      .get<ApiRecord>(this.dashboardUrl, { params: this.toDashboardParams(query) })
      .pipe(map((response) => this.toDashboard(response)));
  }

  getDashboardByPath(path: string): Observable<SurveyDashboardResponse> {
    return this.http
      .get<ApiRecord>(this.toApiUrl(path))
      .pipe(map((response) => this.toDashboard(response)));
  }

  getInternalResponseDetailsByPath(path: string): Observable<BranchSurveyResponseDetails> {
    return this.http
      .get<ApiRecord>(this.toApiUrl(path))
      .pipe(map((response) => this.toInternalResponseDetails(response)));
  }

  getAnonymousResponseDetailsByPath(path: string): Observable<AnonymousTemplateResponseDetails> {
    return this.http
      .get<ApiRecord>(this.toApiUrl(path))
      .pipe(map((response) => this.toAnonymousResponseDetails(response, '')));
  }

  getTemplateDetails(
    templateId: string,
    source: SurveyDashboardSource,
  ): Observable<SurveyDashboardTemplateDetails> {
    const isAnonymous = source === 'Anonymous';
    const detailsUrl = isAnonymous
      ? `${this.anonymousTemplatesUrl}/${templateId}`
      : `${this.templatesUrl}/${templateId}`;

    return this.http.get<ApiRecord>(detailsUrl).pipe(
      map((response) =>
        isAnonymous
          ? this.toAnonymousTemplateDetails(response, templateId)
          : this.toInternalTemplateDetails(response, templateId),
      ),
    );
  }

  getBranchOptions(): Observable<readonly SurveyDashboardBranchOption[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/branches/selection`)
      .pipe(map((response) => this.readPageArray(response).map((item) => this.toBranchOption(item))));
  }

  getInternalTemplateOptions(): Observable<readonly SurveyDashboardTemplateOption[]> {
    return this.http
      .get<unknown>(`${this.templatesUrl}/selection`)
      .pipe(
        map((response) =>
          this.readPageArray(response)
            .map((item) => this.toTemplateOption(item))
            .filter((item) => item.id.length > 0),
        ),
      );
  }

  getDashboardTemplateOptions(
    query: SurveyDashboardTemplatesSelectionQuery = {},
  ): Observable<readonly SurveyDashboardTemplateOption[]> {
    return this.http
      .get<unknown>(this.dashboardTemplatesSelectionUrl, {
        params: this.toTemplatesSelectionParams(query),
      })
      .pipe(
        map((response) =>
          this.readPageArray(response)
            .map((item) => this.toDashboardTemplateOption(item))
            .filter((item) => item.id.length > 0),
        ),
      );
  }

  getAnonymousTemplateOptions(): Observable<readonly SurveyDashboardTemplateOption[]> {
    const params = new HttpParams().set('pageNumber', '1').set('pageSize', '100');

    return this.http
      .get<unknown>(this.anonymousTemplatesUrl, { params })
      .pipe(
        map((response) =>
          this.readPageArray(response)
            .map((item) => this.toAnonymousTemplateOption(item))
            .filter((item) => item.id.length > 0),
        ),
      );
  }

  private toDashboardParams(query: SurveyDashboardQuery): HttpParams {
    let params = new HttpParams();
    if (query.branchId) params = params.set('branchId', query.branchId);
    if (query.source && !query.templateId) params = params.set('source', query.source);
    if (query.templateId) params = params.set('templateId', query.templateId);
    if (query.anonymousTemplateId && !query.templateId) {
      params = params.set('anonymousTemplateId', query.anonymousTemplateId);
    }
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
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

    return params;
  }

  private toTemplatesSelectionParams(query: SurveyDashboardTemplatesSelectionQuery): HttpParams {
    let params = new HttpParams();
    if (query.branchId) params = params.set('branchId', query.branchId);
    if (query.searchText) params = params.set('searchText', query.searchText);
    if (query.templateKind) params = params.set('templateKind', query.templateKind);
    return params;
  }

  private toDashboard(response: ApiRecord): SurveyDashboardResponse {
    const filters = this.toAppliedFilters(this.readRecord(response['filters']));
    const appliedFilters = this.toAppliedFilters(
      this.readRecord(response['appliedFilters']) ?? this.readRecord(response['filters']),
    );

    return {
      period: this.toPeriod(this.readRecord(response['period'])),
      scope: this.toScope(this.readRecord(response['scope'])),
      filters,
      appliedFilters,
      summary: this.toSummary(this.readRecord(response['summary'])),
      sourceBreakdown: this.toSourceBreakdown(this.readRecord(response['sourceBreakdown'])),
      branchesSummary: this.readArray(response['branchesSummary']).map((item) =>
        this.toBranchSummary(item),
      ),
      satisfactionTrend: this.readArray(response['satisfactionTrend']).map((item) =>
        this.toTrendPoint(item),
      ),
      templatePerformance: this.readArray(response['templatePerformance']).map((item) =>
        this.toTemplatePerformance(item),
      ),
      lowestRatedQuestions: this.readArray(response['lowestRatedQuestions']).map((item) =>
        this.toLowestRatedQuestion(item),
      ),
      customInputSegments: this.readArray(response['customInputSegments']).map((item) =>
        this.toCustomInputSegment(item),
      ),
      criticalResponses: this.readArray(response['criticalResponses']).map((item) =>
        this.toCriticalResponse(item),
      ),
    };
  }

  private toPeriod(period: ApiRecord | null): SurveyDashboardPeriod {
    return {
      from: this.readString(period, 'from'),
      to: this.readString(period, 'to'),
      isDefaultPeriod: this.readBoolean(period, 'isDefaultPeriod'),
      groupBy: this.toGroupBy(this.readString(period, 'groupBy')),
    };
  }

  private toScope(scope: ApiRecord | null): SurveyDashboardScope {
    return {
      actorScope: this.readString(scope, 'actorScope'),
      dataScope: this.readString(scope, 'dataScope'),
      branchId: this.readNullableString(scope, 'branchId'),
      branchNameEn: this.readNullableString(scope, 'branchNameEn'),
      branchNameAr: this.readNullableString(scope, 'branchNameAr'),
    };
  }

  private toAppliedFilters(filters: ApiRecord | null): SurveyDashboardAppliedFilters {
    return {
      source: this.toSource(this.readString(filters, 'source')),
      branchId: this.readNullableString(filters, 'branchId'),
      templateId: this.readNullableString(filters, 'templateId'),
      anonymousTemplateId: this.readNullableString(filters, 'anonymousTemplateId'),
      templateKind: this.toTemplateKindOrNull(this.readString(filters, 'templateKind')),
      from: this.readNullableString(filters, 'from'),
      to: this.readNullableString(filters, 'to'),
      groupBy: this.toGroupBy(this.readString(filters, 'groupBy')),
      topQuestionsCount: this.readNumber(filters, 'topQuestionsCount') || 5,
      criticalResponsesCount: this.readNumber(filters, 'criticalResponsesCount') || 10,
      criticalScoreThreshold: this.readNumber(filters, 'criticalScoreThreshold') || 40,
    };
  }

  private toSummary(summary: ApiRecord | null): SurveyDashboardSummary {
    return {
      totalResponses: this.readNumber(summary, 'totalResponses'),
      scoredResponses: this.readNumber(summary, 'scoredResponses'),
      unscoredResponses: this.readNumber(summary, 'unscoredResponses'),
      internalResponses: this.readNumber(summary, 'internalResponses'),
      anonymousResponses: this.readNumber(summary, 'anonymousResponses'),
      internalScoredResponses: this.readNumber(summary, 'internalScoredResponses'),
      anonymousScoredResponses: this.readNumber(summary, 'anonymousScoredResponses'),
      averageScorePercentage: this.readNullableNumber(summary, 'averageScorePercentage'),
      satisfiedResponses: this.readNumber(summary, 'satisfiedResponses'),
      neutralResponses: this.readNumber(summary, 'neutralResponses'),
      unhappyResponses: this.readNumber(summary, 'unhappyResponses'),
      complaintsCount: this.readNumber(summary, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(summary, 'voiceAnswersCount'),
      activeInternalTemplatesCount: this.readNumber(summary, 'activeInternalTemplatesCount'),
      activeAnonymousTemplatesCount: this.readNumber(summary, 'activeAnonymousTemplatesCount'),
      templatesWithResponsesCount: this.readNumber(summary, 'templatesWithResponsesCount'),
      branchesCount: this.readNumber(summary, 'branchesCount'),
      branchesWithResponsesCount: this.readNumber(summary, 'branchesWithResponsesCount'),
    };
  }

  private toSourceBreakdown(breakdown: ApiRecord | null): SurveyDashboardSourceBreakdown {
    return {
      internal: this.toSourceMetrics(this.readRecord(breakdown?.['internal'])),
      anonymous: this.toSourceMetrics(this.readRecord(breakdown?.['anonymous'])),
    };
  }

  private toSourceMetrics(metrics: ApiRecord | null): SurveyDashboardSourceMetrics {
    return {
      responsesCount: this.readNumber(metrics, 'responsesCount'),
      scoredResponsesCount: this.readNumber(metrics, 'scoredResponsesCount'),
      averageScorePercentage: this.readNullableNumber(metrics, 'averageScorePercentage'),
      satisfiedResponses: this.readNumber(metrics, 'satisfiedResponses'),
      neutralResponses: this.readNumber(metrics, 'neutralResponses'),
      unhappyResponses: this.readNumber(metrics, 'unhappyResponses'),
      complaintsCount: this.readNumber(metrics, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(metrics, 'voiceAnswersCount'),
    };
  }

  private toBranchSummary(item: ApiRecord): SurveyDashboardBranchSummary {
    return {
      branchId: this.readRecordId(item['branchId']),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      totalResponses: this.readNumber(item, 'totalResponses'),
      internalResponses: this.readNumber(item, 'internalResponses'),
      anonymousResponses: this.readNumber(item, 'anonymousResponses'),
      averageScorePercentage: this.readNullableNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(item, 'voiceAnswersCount'),
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toTrendPoint(item: ApiRecord): SurveyDashboardTrendPoint {
    return {
      period: this.readString(item, 'period'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      internalResponses: this.readNumber(item, 'internalResponses'),
      anonymousResponses: this.readNumber(item, 'anonymousResponses'),
      averageScorePercentage: this.readNullableNumber(item, 'averageScorePercentage'),
      internalAverageScorePercentage: this.readNullableNumber(
        item,
        'internalAverageScorePercentage',
      ),
      anonymousAverageScorePercentage: this.readNullableNumber(
        item,
        'anonymousAverageScorePercentage',
      ),
    };
  }

  private toTemplatePerformance(item: ApiRecord): SurveyDashboardTemplatePerformance {
    return {
      source: this.toSource(this.readString(item, 'source')),
      templateId: this.readRecordId(item['templateId']),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readRecordId(item['branchId']),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      scoredResponsesCount: this.readNumber(item, 'scoredResponsesCount'),
      averageScorePercentage: this.readNullableNumber(item, 'averageScorePercentage'),
      complaintsCount: this.readNumber(item, 'complaintsCount'),
      voiceAnswersCount: this.readNumber(item, 'voiceAnswersCount'),
      riskLevel: this.readString(item, 'riskLevel') || 'Healthy',
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toLowestRatedQuestion(item: ApiRecord): SurveyDashboardLowestRatedQuestion {
    return {
      source: this.toSource(this.readString(item, 'source')),
      templateId: this.readRecordId(item['templateId']),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readRecordId(item['branchId']),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      questionId: this.readRecordId(item['questionId']),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.readString(item, 'questionType'),
      questionTypeName: this.readString(item, 'questionTypeName'),
      answersCount: this.readNumber(item, 'answersCount'),
      averageValue: this.readNullableNumber(item, 'averageValue'),
      averageScorePercentage: this.readNullableNumber(item, 'averageScorePercentage'),
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toCustomInputSegment(item: ApiRecord): SurveyDashboardCustomInputSegment {
    return {
      source: this.toSource(this.readString(item, 'source')),
      customInputName: this.readString(item, 'customInputName'),
      labelEn: this.readNullableString(item, 'labelEn'),
      labelAr: this.readNullableString(item, 'labelAr'),
      type: this.readString(item, 'type'),
      typeName: this.readString(item, 'typeName'),
      segments: this.readArray(item['segments']).map((segment) =>
        this.toCustomInputSegmentValue(segment),
      ),
    };
  }

  private toCustomInputSegmentValue(item: ApiRecord): SurveyDashboardCustomInputSegmentValue {
    return {
      value: this.readString(item, 'value'),
      responsesCount: this.readNumber(item, 'responsesCount'),
      internalResponses: this.readNumber(item, 'internalResponses'),
      anonymousResponses: this.readNumber(item, 'anonymousResponses'),
      averageScorePercentage: this.readNullableNumber(item, 'averageScorePercentage'),
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toCriticalResponse(item: ApiRecord): SurveyDashboardCriticalResponse {
    return {
      source: this.toSource(this.readString(item, 'source')),
      responseId:
        this.readRecordId(item['responseId']) ||
        this.readRecordId(item['surveyResponseId']) ||
        this.readRecordId(item['anonymousSurveyResponseId']),
      templateId: this.readRecordId(item['templateId']),
      templateNameEn: this.readString(item, 'templateNameEn'),
      templateNameAr: this.readNullableString(item, 'templateNameAr'),
      branchId: this.readRecordId(item['branchId']),
      branchNameEn: this.readString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      submittedOnUtc: this.readString(item, 'submittedOnUtc'),
      scorePercentage: this.readNullableNumber(item, 'scorePercentage'),
      complaintText: this.readNullableString(item, 'complaintText'),
      hasComplaint: this.readBoolean(item, 'hasComplaint'),
      hasVoice: this.readBoolean(item, 'hasVoice'),
      operatorId: this.readNullableString(item, 'operatorId'),
      operatorNameEn: this.readNullableString(item, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(item, 'operatorNameAr'),
      customInputsPreview: this.readArray(item['customInputsPreview']).map((input) =>
        this.toCustomInputPreview(input),
      ),
      detailsNavigation: this.toNavigation(this.readRecord(item['detailsNavigation'])),
    };
  }

  private toNavigation(navigation: ApiRecord | null): SurveyDashboardNavigation | null {
    const path = this.readString(navigation, 'path');
    if (path.length === 0) {
      return null;
    }

    return {
      routeType: this.readString(navigation, 'routeType'),
      method: this.readString(navigation, 'method') || 'GET',
      path,
    };
  }

  private toCustomInputPreview(item: ApiRecord): SurveyDashboardCustomInputPreview {
    return {
      name: this.readString(item, 'name'),
      labelEn: this.readNullableString(item, 'labelEn'),
      labelAr: this.readNullableString(item, 'labelAr'),
      value: this.readDisplayString(item['value']),
    };
  }

  private toBranchOption(item: ApiRecord): SurveyDashboardBranchOption {
    return {
      id: this.readRecordId(item['id']) || this.readRecordId(item['branchId']),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readNullableString(item, 'nameAr'),
      code: this.readString(item, 'code'),
    };
  }

  private toTemplateOption(item: ApiRecord): SurveyDashboardTemplateOption {
    const nameEn = this.readString(item, 'nameEn');
    const nameAr = this.readNullableString(item, 'nameAr');

    return {
      id: this.readRecordId(item['id']) || this.readRecordId(item['templateId']),
      templateKind: 'Authorized',
      dashboardSource: 'Internal',
      nameEn,
      nameAr,
      displayName: this.readString(item, 'displayName') || nameEn || nameAr || '',
      branchId: this.readNullableString(item, 'branchId'),
      branchNameEn: this.readNullableString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
    };
  }

  private toAnonymousTemplateOption(item: ApiRecord): SurveyDashboardTemplateOption {
    const nameEn = this.readString(item, 'nameEn');
    const nameAr = this.readNullableString(item, 'nameAr');

    return {
      id: this.readRecordId(item['anonymousTemplateId']) || this.readRecordId(item['id']),
      templateKind: 'Anonymous',
      dashboardSource: 'Anonymous',
      nameEn,
      nameAr,
      displayName: this.readString(item, 'displayName') || nameEn || nameAr || '',
      branchId: this.readNullableString(item, 'branchId'),
      branchNameEn: this.readNullableString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
    };
  }

  private toDashboardTemplateOption(item: ApiRecord): SurveyDashboardTemplateOption {
    const nameEn = this.readString(item, 'nameEn');
    const nameAr = this.readNullableString(item, 'nameAr');
    const templateKind = this.toTemplateKind(this.readString(item, 'templateKind'));
    const dashboardSource = this.toTemplateDashboardSource(
      this.readString(item, 'dashboardSource'),
      templateKind,
    );

    return {
      id: this.readRecordId(item['templateId']),
      templateKind,
      dashboardSource,
      nameEn,
      nameAr,
      displayName: this.readString(item, 'displayName') || nameEn || nameAr || '',
      branchId: this.readNullableString(item, 'branchId'),
      branchNameEn: this.readNullableString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
      branchCode: this.readString(item, 'branchCode'),
    };
  }

  private toInternalResponseDetails(response: ApiRecord): BranchSurveyResponseDetails {
    const customInputs = this.readArray(response['customInputs']).map((input) =>
      this.toInternalResponseCustomInput(input),
    );
    const answers = this.readArray(response['answers']).map((answer) =>
      this.toInternalResponseAnswer(answer),
    );

    return {
      surveyResponseId: this.readRecordId(response['surveyResponseId']),
      templateId: this.readRecordId(response['templateId']),
      templateNameEn: this.readString(response, 'templateNameEn'),
      templateNameAr: this.readNullableString(response, 'templateNameAr'),
      operatorId: this.readRecordId(response['operatorId']),
      operatorNameEn: this.readString(response, 'operatorNameEn'),
      operatorNameAr: this.readNullableString(response, 'operatorNameAr'),
      submittedOnUtc: this.readString(response, 'submittedOnUtc'),
      score: this.toInternalResponseScore(this.readRecord(response['score'])),
      customInputsCount: this.readNumber(response, 'customInputsCount') || customInputs.length,
      answersCount: this.readNumber(response, 'answersCount') || answers.length,
      customInputs,
      answers,
    };
  }

  private toInternalResponseScore(score: ApiRecord | null): BranchSurveyResponseScore {
    return {
      actualScore: this.readNumber(score, 'actualScore'),
      maxScore: this.readNumber(score, 'maxScore'),
      scorePercentage: this.readNumber(score, 'scorePercentage'),
      isScored: this.readBoolean(score, 'isScored'),
    };
  }

  private toInternalResponseCustomInput(item: ApiRecord): BranchSurveyResponseCustomInput {
    return {
      customInputId: this.readRecordId(item['customInputId']),
      name: this.readString(item, 'name'),
      type: this.readString(item, 'type'),
      typeName: this.readString(item, 'typeName'),
      stringValue: this.readNullableString(item, 'stringValue'),
      integerValue: this.readNullableNumber(item, 'integerValue'),
      displayValue: this.readString(item, 'displayValue') || this.readDisplayString(item['value']),
    };
  }

  private toInternalResponseAnswer(item: ApiRecord): BranchSurveyResponseAnswer {
    return {
      templateQuestionId: this.readRecordId(item['templateQuestionId']),
      questionId: this.readRecordId(item['questionId']),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.toInternalQuestionType(
        this.readString(item, 'questionTypeName') || this.readString(item, 'questionType'),
      ),
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
      voiceFileUrl:
        this.readNullableString(item, 'voiceFileUrl') ?? this.readNullableString(item, 'voiceUrl'),
      imageFileName: this.readNullableString(item, 'imageFileName'),
      imageFileUrl:
        this.readNullableString(item, 'imageFileUrl') ?? this.readNullableString(item, 'imageUrl'),
      displayValue: this.readString(item, 'displayValue'),
      children: this.readAnswerChildren(item).map((answer) => this.toInternalResponseAnswer(answer)),
    };
  }

  private toAnonymousResponseDetails(
    response: ApiRecord,
    fallbackAnonymousTemplateId: string,
  ): AnonymousTemplateResponseDetails {
    const customInputValues = this.readArray(
      response['customInputValues'] ?? response['customInputs'],
    ).map((input) => this.toAnonymousResponseCustomInput(input));
    const answers = this.readArray(response['answers']).map((answer) =>
      this.toAnonymousResponseAnswer(answer),
    );

    return {
      anonymousSurveyResponseId: this.readRecordId(response['anonymousSurveyResponseId']),
      anonymousTemplateId:
        this.readRecordId(response['anonymousTemplateId']) || fallbackAnonymousTemplateId,
      submittedOnUtc: this.readString(response, 'submittedOnUtc'),
      actualScore: this.readNullableNumber(response, 'actualScore'),
      maxScore: this.readNullableNumber(response, 'maxScore'),
      scorePercentage: this.readNullableNumber(response, 'scorePercentage'),
      isScored: this.readBoolean(response, 'isScored') || this.readNullableNumber(response, 'scorePercentage') !== null,
      answersCount: this.readNumber(response, 'answersCount') || answers.length,
      customInputValuesCount:
        this.readNumber(response, 'customInputValuesCount') || customInputValues.length,
      templateNameEn: this.readString(response, 'templateNameEn'),
      templateNameAr: this.readNullableString(response, 'templateNameAr'),
      customInputValues,
      answers,
    };
  }

  private toAnonymousResponseCustomInput(item: ApiRecord): AnonymousTemplateResponseCustomInputValue {
    const type = this.toAnonymousCustomInputType(item['type'] ?? item['typeName']);
    const value = item['value'];
    const stringValue =
      this.readNullableString(item, 'stringValue') ??
      (typeof value === 'string' || typeof value === 'number' ? String(value) : null);
    const integerValue =
      this.readNullableNumber(item, 'integerValue') ?? (typeof value === 'number' ? value : null);
    const name = this.readString(item, 'nameSnapshot') || this.readString(item, 'name');
    const displayValue =
      this.readString(item, 'displayValue') ??
      stringValue ??
      (integerValue === null ? '' : String(integerValue));

    return {
      customInputValueId: this.readRecordId(item['customInputValueId']),
      anonymousTemplateCustomInputId: this.readRecordId(item['anonymousTemplateCustomInputId']),
      name,
      labelEn: this.readNullableString(item, 'labelEn'),
      labelAr: this.readNullableString(item, 'labelAr'),
      nameSnapshot: name,
      type,
      typeName: this.readString(item, 'typeName') || (type === 2 ? 'Integer' : 'String'),
      stringValue,
      integerValue,
      displayValue,
    };
  }

  private toAnonymousResponseAnswer(item: ApiRecord): AnonymousTemplateResponseAnswer {
    const questionId = this.readRecordId(item['questionId']);

    return {
      answerId: this.readRecordId(item['answerId']) || questionId,
      anonymousTemplateQuestionId: this.readRecordId(item['anonymousTemplateQuestionId']),
      questionId,
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.readNullableNumber(item, 'questionType'),
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
      voiceUrl: this.readNullableString(item, 'voiceUrl'),
      imageFileName: this.readNullableString(item, 'imageFileName'),
      imageFileUrl:
        this.readNullableString(item, 'imageFileUrl') ?? this.readNullableString(item, 'imageUrl'),
      children: this.readAnswerChildren(item).map((answer) =>
        this.toAnonymousResponseAnswer(answer),
      ),
    };
  }

  private readAnswerChildren(item: ApiRecord): ApiRecord[] {
    const children = this.readArray(item['children']);
    if (children.length > 0) {
      return children;
    }

    return this.readArray(item['childAnswers']);
  }

  private toInternalTemplateDetails(
    response: ApiRecord,
    fallbackTemplateId: string,
  ): SurveyDashboardTemplateDetails {
    const template = this.unwrapDetailsRecord(response);
    const questions = this.readArray(template['questions']).map((question) =>
      this.toTemplateQuestion(question, false),
    );
    const customInputs = this.readArray(template['customInputs'])
      .map((customInput) => this.toTemplateCustomInput(customInput))
      .sort((first, second) => first.order - second.order);
    const questionConditions = this.readArray(template['questionConditions'])
      .map((condition) => this.toTemplateQuestionCondition(condition, false))
      .filter(
        (condition) =>
          condition.parentTemplateQuestionId.length > 0 &&
          condition.childTemplateQuestionId.length > 0,
      );
    const summary = this.readRecord(template['summary']);

    return {
      source: 'Internal',
      templateId: this.readRecordId(template['templateId']) || fallbackTemplateId,
      branchId: this.readNullableRecordId(template['branchId']),
      branchNameEn: this.readNullableString(template, 'branchNameEn'),
      branchNameAr: this.readNullableString(template, 'branchNameAr'),
      branchCode: this.readNullableString(template, 'branchCode'),
      nameEn: this.readString(template, 'nameEn'),
      nameAr: this.readNullableString(template, 'nameAr'),
      description: this.readNullableString(template, 'description'),
      status:
        this.readString(template, 'statusName') ||
        this.readDisplayString(template['status']) ||
        'Draft',
      isActive: this.readBooleanWithDefault(template, 'isActive', true),
      activeFrom: this.readString(template, 'activeFrom'),
      expireTo: this.readNullableString(template, 'expireTo'),
      createdOnUtc: this.readNullableString(template, 'createdOnUtc'),
      publicUrl: null,
      qrCode: null,
      questionsCount:
        this.readNumber(summary, 'questionsCount') ||
        this.readNumber(template, 'questionsCount') ||
        questions.length,
      groupsCount: this.readNumber(summary, 'groupsCount') || this.countQuestionGroups(questions),
      customInputsCount:
        this.readNumber(summary, 'customInputsCount') ||
        this.readNumber(template, 'customInputsCount') ||
        customInputs.length,
      questionConditionsCount: questionConditions.length,
      responsesCount: null,
      customInputs,
      questions,
      questionConditions,
    };
  }

  private toAnonymousTemplateDetails(
    response: ApiRecord,
    fallbackTemplateId: string,
  ): SurveyDashboardTemplateDetails {
    const template = this.unwrapDetailsRecord(response);
    const questions = this.readArray(template['questions']).map((question) =>
      this.toTemplateQuestion(question, true),
    );
    const customInputs = this.readArray(template['customInputs'])
      .map((customInput) => this.toTemplateCustomInput(customInput))
      .sort((first, second) => first.order - second.order);
    const questionConditions = this.readArray(template['questionConditions'])
      .map((condition) => this.toTemplateQuestionCondition(condition, true))
      .filter(
        (condition) =>
          condition.parentTemplateQuestionId.length > 0 &&
          condition.childTemplateQuestionId.length > 0,
      );
    const summary = this.readRecord(template['summary']);

    return {
      source: 'Anonymous',
      templateId: this.readRecordId(template['anonymousTemplateId']) || fallbackTemplateId,
      branchId: this.readNullableRecordId(template['branchId']),
      branchNameEn: this.readNullableString(template, 'branchNameEn'),
      branchNameAr: this.readNullableString(template, 'branchNameAr'),
      branchCode: null,
      nameEn: this.readString(template, 'nameEn'),
      nameAr: this.readNullableString(template, 'nameAr'),
      description: this.readNullableString(template, 'description'),
      status:
        this.readString(template, 'statusName') ||
        this.readDisplayString(template['status']) ||
        'Draft',
      isActive: this.readBooleanWithDefault(template, 'isActive', true),
      activeFrom: this.readString(template, 'activeFrom'),
      expireTo: this.readNullableString(template, 'expireTo'),
      createdOnUtc: this.readNullableString(template, 'createdOnUtc'),
      publicUrl: this.readNullableString(template, 'publicUrl'),
      qrCode: this.readNullableString(template, 'qrCode'),
      questionsCount:
        this.readNumber(summary, 'questionsCount') ||
        this.readNumber(template, 'questionsCount') ||
        questions.length,
      groupsCount: this.countQuestionGroups(questions),
      customInputsCount:
        this.readNumber(summary, 'customInputsCount') ||
        this.readNumber(template, 'customInputsCount') ||
        customInputs.length,
      questionConditionsCount:
        this.readNumber(summary, 'questionConditionsCount') || questionConditions.length,
      responsesCount: this.readNullableNumber(template, 'responsesCount'),
      customInputs,
      questions,
      questionConditions,
    };
  }

  private toTemplateCustomInput(item: ApiRecord): SurveyDashboardTemplateCustomInput {
    return {
      customInputId: this.readRecordId(item['customInputId']),
      name: this.readString(item, 'name'),
      labelEn: this.readNullableString(item, 'labelEn'),
      labelAr: this.readNullableString(item, 'labelAr'),
      type: this.readDisplayString(item['type']) || this.readString(item, 'typeName'),
      typeName:
        this.readString(item, 'typeName') ||
        (String(item['type']) === '2' ? 'Integer' : 'String'),
      isRequired: this.readBoolean(item, 'isRequired'),
      minLength: this.readNullableNumber(item, 'minLength'),
      maxLength: this.readNullableNumber(item, 'maxLength'),
      minValue: this.readNullableNumber(item, 'minValue'),
      maxValue: this.readNullableNumber(item, 'maxValue'),
      order: this.readNumber(item, 'order'),
      isActive: this.readBooleanWithDefault(item, 'isActive', true),
    };
  }

  private toTemplateQuestion(
    item: ApiRecord,
    isAnonymous: boolean,
  ): SurveyDashboardTemplateQuestion {
    const questionId = this.readRecordId(item['questionId']);
    const templateQuestionId = isAnonymous
      ? this.readRecordId(item['anonymousTemplateQuestionId'])
      : this.readRecordId(item['templateQuestionId']);

    return {
      templateQuestionId,
      questionId,
      textEn: this.readString(item, 'textEn'),
      textAr: this.readNullableString(item, 'textAr'),
      type: this.readQuestionType(item),
      typeName: this.readString(item, 'typeName'),
      groupId: this.readRecordId(item['groupId']),
      groupNameEn: this.readString(item, 'groupNameEn'),
      groupNameAr: this.readNullableString(item, 'groupNameAr'),
      order: this.readNullableNumber(item, 'order'),
      isActive: this.readBooleanWithDefault(item, 'isActive', true),
      options: this.readArray(item['options'])
        .map((option) => this.toQuestionOption(option, questionId))
        .sort((first, second) => first.order - second.order),
    };
  }

  private toQuestionOption(item: ApiRecord, fallbackQuestionId: string): QuestionAnswerOption {
    return {
      optionId: this.readRecordId(item['optionId']),
      questionId: this.readRecordId(item['questionId']) || fallbackQuestionId,
      textEn: this.readString(item, 'textEn'),
      textAr: this.readNullableString(item, 'textAr'),
      order: this.readNumber(item, 'order'),
      value: this.toAnswerScaleValue(item['value']),
      isActive: this.readBooleanWithDefault(item, 'isActive', true),
    };
  }

  private toTemplateQuestionCondition(
    item: ApiRecord,
    isAnonymous: boolean,
  ): QuestionCondition {
    const triggerType = this.toQuestionConditionTriggerType(item['triggerType']);

    return {
      conditionId: this.readRecordId(item['conditionId']),
      parentTemplateQuestionId: isAnonymous
        ? this.readRecordId(item['parentAnonymousTemplateQuestionId'])
        : this.readRecordId(item['parentTemplateQuestionId']),
      childTemplateQuestionId: isAnonymous
        ? this.readRecordId(item['childAnonymousTemplateQuestionId'])
        : this.readRecordId(item['childTemplateQuestionId']),
      triggerType,
      triggerTypeName: this.readString(item, 'triggerTypeName') || triggerTypeName(triggerType),
      selectedQuestionOptionId: this.readNullableRecordId(item['selectedQuestionOptionId']),
      triggerValue: this.readNullableNumber(item, 'triggerValue'),
      order: this.readNumber(item, 'order'),
    };
  }

  private toApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }

  private toSource(value: string): SurveyDashboardSource {
    if (value === 'Internal' || value === 'Anonymous') {
      return value;
    }

    return 'All';
  }

  private toTemplateKind(value: string): SurveyDashboardTemplateKind {
    return value === 'Anonymous' ? 'Anonymous' : 'Authorized';
  }

  private toTemplateKindOrNull(value: string): SurveyDashboardTemplateKind | null {
    if (value === 'Authorized' || value === 'Anonymous') {
      return value;
    }

    return null;
  }

  private toTemplateDashboardSource(
    value: string,
    templateKind: SurveyDashboardTemplateKind,
  ): SurveyDashboardTemplateDashboardSource {
    if (value === 'Internal' || value === 'Anonymous') {
      return value;
    }

    return templateKind === 'Anonymous' ? 'Anonymous' : 'Internal';
  }

  private toGroupBy(value: string): SurveyDashboardGroupBy {
    return value === 'Month' ? 'Month' : 'Day';
  }

  private toInternalQuestionType(value: string): BranchSurveyResponseQuestionType {
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

  private toAnonymousCustomInputType(value: unknown): 1 | 2 {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();
    return normalized === '2' || normalized === 'integer' ? 2 : 1;
  }

  private unwrapDetailsRecord(response: ApiRecord): ApiRecord {
    const data = this.readRecord(response['data']);
    return data ?? response;
  }

  private readQuestionType(record: ApiRecord): string | number | null {
    const value = record['type'];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return this.readString(record, 'typeName') || null;
  }

  private toAnswerScaleValue(value: unknown): AnswerScaleValue | null {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    if (
      numericValue === 1 ||
      numericValue === 2 ||
      numericValue === 3 ||
      numericValue === 4 ||
      numericValue === 5
    ) {
      return numericValue;
    }

    return null;
  }

  private toQuestionConditionTriggerType(value: unknown): QuestionConditionTriggerType {
    if (typeof value === 'string' && !Number.isFinite(Number(value))) {
      const normalized = value.replace(/[\s_-]/g, '').toLowerCase();
      if (normalized.includes('star')) {
        return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
      }
      if (normalized.includes('smile')) {
        return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
      }
      return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
    }

    const numericValue = typeof value === 'string' ? Number(value) : value;
    if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue) {
      return QUESTION_CONDITION_TRIGGER_TYPE.StarRatingValue;
    }
    if (numericValue === QUESTION_CONDITION_TRIGGER_TYPE.SmileValue) {
      return QUESTION_CONDITION_TRIGGER_TYPE.SmileValue;
    }

    return QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption;
  }

  private countQuestionGroups(questions: readonly SurveyDashboardTemplateQuestion[]): number {
    return new Set(
      questions.map((question) => question.groupId).filter((groupId) => groupId.length > 0),
    ).size;
  }

  private readPageArray(value: unknown): ApiRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is ApiRecord => typeof item === 'object' && item !== null);
    }

    return this.readArray(this.readRecord(value)?.['data']);
  }

  private readRecord(value: unknown): ApiRecord | null {
    return typeof value === 'object' && value !== null ? (value as ApiRecord) : null;
  }

  private readArray(value: unknown): ApiRecord[] {
    return Array.isArray(value)
      ? value.filter((item): item is ApiRecord => typeof item === 'object' && item !== null)
      : [];
  }

  private readRecordId(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  private readNullableRecordId(value: unknown): string | null {
    const recordId = this.readRecordId(value);
    return recordId.length > 0 ? recordId : null;
  }

  private readString(record: ApiRecord | null, key: string): string {
    const value = record?.[key];
    return typeof value === 'string' ? value : '';
  }

  private readDisplayString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return '';
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

  private readBooleanWithDefault(record: ApiRecord | null, key: string, fallback: boolean): boolean {
    const value = record?.[key];
    return typeof value === 'boolean' ? value : fallback;
  }
}
