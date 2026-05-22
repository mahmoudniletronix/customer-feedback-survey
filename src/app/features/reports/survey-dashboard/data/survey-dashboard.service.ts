import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
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
  SurveyDashboardTemplateOption,
  SurveyDashboardTemplatePerformance,
  SurveyDashboardTrendPoint,
} from '../domain/survey-dashboard.model';

type ApiRecord = Record<string, unknown>;

@Injectable()
export class SurveyDashboardService {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiBaseUrl}/api/reports`;
  private readonly dashboardUrl = `${this.reportsUrl}/survey-dashboard`;

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

  getBranchOptions(): Observable<readonly SurveyDashboardBranchOption[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/branches/selection`)
      .pipe(map((response) => this.readPageArray(response).map((item) => this.toBranchOption(item))));
  }

  getInternalTemplateOptions(): Observable<readonly SurveyDashboardTemplateOption[]> {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/templates/selection`)
      .pipe(
        map((response) =>
          this.readPageArray(response)
            .map((item) => this.toTemplateOption(item))
            .filter((item) => item.id.length > 0),
        ),
      );
  }

  getAnonymousTemplateOptions(): Observable<readonly SurveyDashboardTemplateOption[]> {
    const params = new HttpParams().set('pageNumber', '1').set('pageSize', '100');

    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/api/anonymous-templates`, { params })
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
    if (query.source) params = params.set('source', query.source);
    if (query.templateId) params = params.set('templateId', query.templateId);
    if (query.anonymousTemplateId) {
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

  private toDashboard(response: ApiRecord): SurveyDashboardResponse {
    return {
      period: this.toPeriod(this.readRecord(response['period'])),
      scope: this.toScope(this.readRecord(response['scope'])),
      filters: this.toAppliedFilters(this.readRecord(response['filters'])),
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
    return {
      id: this.readRecordId(item['id']) || this.readRecordId(item['templateId']),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readNullableString(item, 'nameAr'),
      branchId: this.readNullableString(item, 'branchId'),
      branchNameEn: this.readNullableString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
    };
  }

  private toAnonymousTemplateOption(item: ApiRecord): SurveyDashboardTemplateOption {
    return {
      id: this.readRecordId(item['anonymousTemplateId']) || this.readRecordId(item['id']),
      nameEn: this.readString(item, 'nameEn'),
      nameAr: this.readNullableString(item, 'nameAr'),
      branchId: this.readNullableString(item, 'branchId'),
      branchNameEn: this.readNullableString(item, 'branchNameEn'),
      branchNameAr: this.readNullableString(item, 'branchNameAr'),
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
      questionId: this.readRecordId(item['questionId']),
      questionTextEn: this.readString(item, 'questionTextEn'),
      questionTextAr: this.readNullableString(item, 'questionTextAr'),
      questionType: this.toInternalQuestionType(
        this.readString(item, 'questionTypeName') || this.readString(item, 'questionType'),
      ),
      questionTypeName: this.readString(item, 'questionTypeName'),
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
      displayValue: this.readString(item, 'displayValue'),
    };
  }

  private toAnonymousResponseDetails(
    response: ApiRecord,
    fallbackAnonymousTemplateId: string,
  ): AnonymousTemplateResponseDetails {
    const customInputValues = this.readArray(
      response['customInputValues'] ?? response['customInputs'],
    ).map((input) => this.toAnonymousResponseCustomInput(input));
    const answers = this.readArray(response['answers'])
      .map((answer) => this.toAnonymousResponseAnswer(answer))
      .sort((first, second) => first.questionOrder - second.questionOrder);

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

  private toGroupBy(value: string): SurveyDashboardGroupBy {
    return value === 'Month' ? 'Month' : 'Day';
  }

  private toInternalQuestionType(value: string): BranchSurveyResponseQuestionType {
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

  private toAnonymousCustomInputType(value: unknown): 1 | 2 {
    const normalized = String(value ?? '')
      .trim()
      .toLowerCase();
    return normalized === '2' || normalized === 'integer' ? 2 : 1;
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
}
