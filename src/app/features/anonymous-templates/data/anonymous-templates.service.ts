import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  toScopeState,
  toSelectableEditableScopeState,
} from '../../../shared/models/resource-scope.model';
import {
  AnonymousTemplate,
  AnonymousTemplateApiResponse,
  AnonymousTemplateAssignedQuestion,
  AnonymousTemplateAssignedQuestionApiResponse,
  AnonymousTemplateDashboardApiResponse,
  AnonymousTemplateDashboardCriticalResponse,
  AnonymousTemplateDashboardQuery,
  AnonymousTemplateDashboardResponse,
  AnonymousTemplateDashboardRiskLevel,
  AnonymousTemplateDashboardTemplatePerformance,
  AnonymousTemplateCustomInput,
  AnonymousTemplateCustomInputApiResponse,
  AnonymousTemplateCustomInputType,
  AnonymousTemplateListItem,
  AnonymousTemplateQuestion,
  AnonymousTemplateQuestionApiResponse,
  AnonymousTemplateQuestionCondition,
  AnonymousTemplateQuestionConditionApiResponse,
  AnonymousTemplateQuestionOption,
  AnonymousTemplateQuestionOptionApiResponse,
  AnonymousTemplateQuestionSelectionItem,
  AnonymousTemplateQuestionSelectionItemApiResponse,
  AnonymousTemplateQuestionsSelection,
  AnonymousTemplateQuestionsSelectionApiResponse,
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseAnswerApiResponse,
  AnonymousTemplateResponseCustomInputValue,
  AnonymousTemplateResponseCustomInputValueApiResponse,
  AnonymousTemplateResponseDetails,
  AnonymousTemplateResponseListItem,
  AnonymousTemplateResponseApiResponse,
  AnonymousTemplateResponsesListQuery,
  AnonymousTemplateResponsesPageApiResponse,
  AnonymousTemplateResponsesPageResult,
  AnonymousTemplateStateChange,
  AnonymousTemplateSummary,
  AnonymousTemplateSummaryApiResponse,
  AnonymousTemplatesListQuery,
  AnonymousTemplatesPageApiResponse,
  AnonymousTemplatesPageResult,
  AssignAnonymousTemplateQuestionsApiResponse,
  AssignAnonymousTemplateQuestionsPayload,
  AssignAnonymousTemplateQuestionsResult,
  BranchAnonymousResponseApiResponse,
  BranchAnonymousResponseCustomInputPreview,
  BranchAnonymousResponseCustomInputPreviewApiResponse,
  BranchAnonymousResponseListItem,
  BranchAnonymousResponsesPageApiResponse,
  BranchAnonymousResponsesPageResult,
  BranchAnonymousResponsesQuery,
  CreateAnonymousTemplatePayload,
  ManageAnonymousTemplateQuestionConditionsApiResponse,
  ManageAnonymousTemplateQuestionConditionsPayload,
  ManageAnonymousTemplateQuestionConditionsResult,
  UpdateAnonymousTemplatePayload,
} from '../domain/anonymous-template.model';

@Injectable()
export class AnonymousTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly anonymousTemplatesUrl = `${environment.apiBaseUrl}/api/anonymous-templates`;
  private readonly branchAnonymousResponsesUrl = `${environment.apiBaseUrl}/api/reports/anonymous-responses`;

  list(query: AnonymousTemplatesListQuery): Observable<AnonymousTemplatesPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    const searchText = query.searchText.trim();
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    const orderSort = query.orderSort.trim();
    if (orderSort.length > 0) {
      params = params.set('orderSort', orderSort);
    }

    if (query.scope !== null) {
      params = params.set('scope', query.scope);
    }

    if (query.branchId !== null && query.branchId.trim().length > 0) {
      params = params.set('branchId', query.branchId.trim());
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return this.http
      .get<
        AnonymousTemplatesPageApiResponse | readonly AnonymousTemplateApiResponse[]
      >(this.anonymousTemplatesUrl, { params })
      .pipe(map((response) => this.toPageResult(response, query)));
  }

  create(payload: CreateAnonymousTemplatePayload): Observable<AnonymousTemplate> {
    return this.http
      .post<AnonymousTemplateApiResponse>(this.anonymousTemplatesUrl, payload)
      .pipe(map((response) => this.toTemplate(response)));
  }

  details(anonymousTemplateId: string): Observable<AnonymousTemplate> {
    return this.http
      .get<AnonymousTemplateApiResponse>(`${this.anonymousTemplatesUrl}/${anonymousTemplateId}`)
      .pipe(map((response) => this.toTemplate(response)));
  }

  update(
    anonymousTemplateId: string,
    payload: UpdateAnonymousTemplatePayload,
  ): Observable<AnonymousTemplate> {
    return this.http
      .put<AnonymousTemplateApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}`,
        payload,
      )
      .pipe(map((response) => this.toTemplate(response)));
  }

  deleteTemplate(anonymousTemplateId: string): Observable<AnonymousTemplateStateChange> {
    return this.http
      .delete<AnonymousTemplateApiResponse>(`${this.anonymousTemplatesUrl}/${anonymousTemplateId}`)
      .pipe(map((response) => this.toStateChange(response)));
  }

  restoreTemplate(anonymousTemplateId: string): Observable<AnonymousTemplateStateChange> {
    return this.http
      .put<AnonymousTemplateApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}/restore`,
        null,
      )
      .pipe(map((response) => this.toStateChange(response)));
  }

  questionsSelection(
    anonymousTemplateId: string,
    searchText = '',
  ): Observable<AnonymousTemplateQuestionsSelection> {
    let params = new HttpParams();
    const normalizedSearch = searchText.trim();

    if (normalizedSearch.length > 0) {
      params = params.set('searchText', normalizedSearch);
    }

    return this.http
      .get<AnonymousTemplateQuestionsSelectionApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}/questions-selection`,
        { params },
      )
      .pipe(map((response) => this.toQuestionsSelection(response, anonymousTemplateId)));
  }

  assignQuestions(
    anonymousTemplateId: string,
    payload: AssignAnonymousTemplateQuestionsPayload,
  ): Observable<AssignAnonymousTemplateQuestionsResult> {
    return this.http
      .put<AssignAnonymousTemplateQuestionsApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}/questions`,
        payload,
      )
      .pipe(map((response) => this.toAssignQuestionsResult(response, anonymousTemplateId)));
  }

  manageQuestionConditions(
    anonymousTemplateId: string,
    payload: ManageAnonymousTemplateQuestionConditionsPayload,
  ): Observable<ManageAnonymousTemplateQuestionConditionsResult> {
    const normalizedPayload = this.toManageQuestionConditionsPayload(payload);

    return this.http
      .put<ManageAnonymousTemplateQuestionConditionsApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}/question-conditions`,
        normalizedPayload,
      )
      .pipe(
        map((response) => this.toManageQuestionConditionsResult(response, anonymousTemplateId)),
      );
  }

  responses(
    anonymousTemplateId: string,
    query: AnonymousTemplateResponsesListQuery,
  ): Observable<AnonymousTemplateResponsesPageResult> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    const orderSort = query.orderSort.trim();
    if (orderSort.length > 0) {
      params = params.set('orderSort', orderSort);
    }

    if (query.fromDate !== null) {
      params = params.set('fromDate', query.fromDate);
    }

    if (query.toDate !== null) {
      params = params.set('toDate', query.toDate);
    }

    if (query.minScorePercentage !== null) {
      params = params.set('minScorePercentage', query.minScorePercentage);
    }

    if (query.maxScorePercentage !== null) {
      params = params.set('maxScorePercentage', query.maxScorePercentage);
    }

    return this.http
      .get<
        AnonymousTemplateResponsesPageApiResponse | readonly AnonymousTemplateResponseApiResponse[]
      >(`${this.anonymousTemplatesUrl}/${anonymousTemplateId}/responses`, { params })
      .pipe(map((response) => this.toResponsesPageResult(response, query)));
  }

  branchAnonymousResponses(
    query: BranchAnonymousResponsesQuery,
  ): Observable<BranchAnonymousResponsesPageResult> {
    let params = new HttpParams()
      .set('pageNumber', Math.max(query.pageNumber, 1))
      .set('pageSize', Math.min(Math.max(query.pageSize, 1), 100));

    const anonymousTemplateId = query.anonymousTemplateId?.trim() ?? '';
    if (anonymousTemplateId.length > 0) {
      params = params.set('anonymousTemplateId', anonymousTemplateId);
    }

    if (query.from) {
      params = params.set('from', query.from);
    }
    if (query.to) {
      params = params.set('to', query.to);
    }
    if (query.minScorePercentage !== undefined) {
      params = params.set('minScorePercentage', query.minScorePercentage);
    }
    if (query.maxScorePercentage !== undefined) {
      params = params.set('maxScorePercentage', query.maxScorePercentage);
    }
    if (query.hasComplaint !== undefined) {
      params = params.set('hasComplaint', query.hasComplaint);
    }
    if (query.hasVoice !== undefined) {
      params = params.set('hasVoice', query.hasVoice);
    }

    const searchText = query.searchText?.trim() ?? '';
    if (searchText.length > 0) {
      params = params.set('searchText', searchText);
    }

    const orderSort = query.orderSort?.trim() ?? '';
    if (orderSort.length > 0) {
      params = params.set('orderSort', orderSort);
    }

    return this.http
      .get<BranchAnonymousResponsesPageApiResponse>(this.branchAnonymousResponsesUrl, { params })
      .pipe(map((response) => this.toBranchAnonymousResponsesPageResult(response, query)));
  }

  responseDetails(
    anonymousTemplateId: string,
    responseId: string,
  ): Observable<AnonymousTemplateResponseDetails> {
    return this.http
      .get<AnonymousTemplateResponseApiResponse>(
        `${this.anonymousTemplatesUrl}/${anonymousTemplateId}/responses/${responseId}`,
      )
      .pipe(map((response) => this.toResponseDetails(response, anonymousTemplateId)));
  }

  dashboard(query: AnonymousTemplateDashboardQuery): Observable<AnonymousTemplateDashboardResponse> {
    let params = new HttpParams();

    if (query.from) {
      params = params.set('from', query.from);
    }
    if (query.to) {
      params = params.set('to', query.to);
    }
    if (query.anonymousTemplateId) {
      params = params.set('anonymousTemplateId', query.anonymousTemplateId);
    }
    if (query.groupBy) {
      params = params.set('groupBy', query.groupBy);
    }
    if (query.topQuestionsCount !== undefined) {
      params = params.set('topQuestionsCount', query.topQuestionsCount);
    }
    if (query.criticalResponsesCount !== undefined) {
      params = params.set('criticalResponsesCount', query.criticalResponsesCount);
    }
    if (query.criticalScoreThreshold !== undefined) {
      params = params.set('criticalScoreThreshold', query.criticalScoreThreshold);
    }

    return this.http
      .get<AnonymousTemplateDashboardApiResponse>(`${this.anonymousTemplatesUrl}/dashboard`, {
        params,
      })
      .pipe(map((response) => this.toDashboard(response)));
  }

  private toPageResult(
    response: AnonymousTemplatesPageApiResponse | readonly AnonymousTemplateApiResponse[],
    query: AnonymousTemplatesListQuery,
  ): AnonymousTemplatesPageResult {
    if (Array.isArray(response)) {
      const templates = response.map((template) => this.toListItem(template));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: templates.length,
        data: templates,
      };
    }

    const pageResponse = response as AnonymousTemplatesPageApiResponse;
    const templates = (pageResponse.data ?? []).map((template: AnonymousTemplateApiResponse) =>
      this.toListItem(template),
    );
    return {
      currentPage: pageResponse.currentPage ?? query.pageNumber,
      pageSize: pageResponse.pageSize ?? query.pageSize,
      totalItems: pageResponse.totalItems ?? templates.length,
      data: templates,
    };
  }

  private toDashboard(response: AnonymousTemplateDashboardApiResponse): AnonymousTemplateDashboardResponse {
    const summary = response.summary ?? {};

    return {
      period: {
        from: response.period?.from ?? '',
        to: response.period?.to ?? '',
        isDefaultPeriod: response.period?.isDefaultPeriod ?? false,
        groupBy: response.period?.groupBy === 'Month' ? 'Month' : 'Day',
      },
      summary: {
        branchId: this.readRecordId(summary.branchId),
        branchNameEn: summary.branchNameEn ?? '',
        branchNameAr: summary.branchNameAr ?? null,
        totalAnonymousTemplates: summary.totalAnonymousTemplates ?? 0,
        activeAnonymousTemplates: summary.activeAnonymousTemplates ?? 0,
        templatesWithResponsesCount: summary.templatesWithResponsesCount ?? 0,
        totalResponses: summary.totalResponses ?? 0,
        scoredResponses: summary.scoredResponses ?? 0,
        unscoredResponses: summary.unscoredResponses ?? 0,
        averageScorePercentage: summary.averageScorePercentage ?? 0,
        satisfiedResponses: summary.satisfiedResponses ?? 0,
        neutralResponses: summary.neutralResponses ?? 0,
        unhappyResponses: summary.unhappyResponses ?? 0,
        complaintsCount: summary.complaintsCount ?? 0,
        voiceAnswersCount: summary.voiceAnswersCount ?? 0,
      },
      satisfactionTrend: (response.satisfactionTrend ?? []).map((point) => ({
        period: point.period ?? '',
        responsesCount: point.responsesCount ?? 0,
        averageScorePercentage: point.averageScorePercentage ?? 0,
      })),
      anonymousTemplatePerformance: (response.anonymousTemplatePerformance ?? []).map((item) =>
        this.toDashboardTemplatePerformance(item),
      ),
      lowestRatedQuestions: (response.lowestRatedQuestions ?? []).map((item) => ({
        anonymousTemplateId: this.readRecordId(item.anonymousTemplateId),
        templateNameEn: item.templateNameEn ?? '',
        templateNameAr: item.templateNameAr ?? null,
        anonymousTemplateQuestionId: this.readRecordId(item.anonymousTemplateQuestionId),
        questionId: this.readRecordId(item.questionId),
        questionTextEn: item.questionTextEn ?? '',
        questionTextAr: item.questionTextAr ?? null,
        questionType: item.questionType ?? 0,
        questionTypeName: item.questionTypeName ?? '',
        answersCount: item.answersCount ?? 0,
        averageValue: item.averageValue ?? 0,
        averageScorePercentage: item.averageScorePercentage ?? 0,
      })),
      customInputSegments: (response.customInputSegments ?? []).map((segment) => ({
        customInputName: segment.customInputName ?? '',
        type: segment.type ?? 0,
        typeName: segment.typeName ?? '',
        segments: (segment.segments ?? []).map((item) => ({
          value: item.value ?? '',
          responsesCount: item.responsesCount ?? 0,
          averageScorePercentage: item.averageScorePercentage ?? 0,
        })),
      })),
      criticalResponses: (response.criticalResponses ?? []).map((item) =>
        this.toDashboardCriticalResponse(item),
      ),
    };
  }

  private toDashboardTemplatePerformance(
    item: Partial<AnonymousTemplateDashboardTemplatePerformance>,
  ): AnonymousTemplateDashboardTemplatePerformance {
    return {
      anonymousTemplateId: this.readRecordId(item.anonymousTemplateId),
      nameEn: item.nameEn ?? '',
      nameAr: item.nameAr ?? null,
      scope: item.scope ?? 0,
      scopeName: item.scopeName ?? '',
      status: item.status ?? 0,
      statusName: item.statusName ?? '',
      isActive: item.isActive ?? false,
      publicUrl: item.publicUrl ?? '',
      qrCode: item.qrCode ?? null,
      responsesCount: item.responsesCount ?? 0,
      scoredResponsesCount: item.scoredResponsesCount ?? 0,
      averageScorePercentage: item.averageScorePercentage ?? 0,
      complaintsCount: item.complaintsCount ?? 0,
      riskLevel: this.toDashboardRiskLevel(item.riskLevel),
    };
  }

  private toDashboardCriticalResponse(
    item: NonNullable<AnonymousTemplateDashboardApiResponse['criticalResponses']>[number],
  ): AnonymousTemplateDashboardCriticalResponse {
    return {
      anonymousSurveyResponseId: this.readRecordId(item.anonymousSurveyResponseId),
      anonymousTemplateId: this.readRecordId(item.anonymousTemplateId),
      templateNameEn: item.templateNameEn ?? '',
      templateNameAr: item.templateNameAr ?? null,
      submittedOnUtc: item.submittedOnUtc ?? '',
      scorePercentage: item.scorePercentage ?? 0,
      complaintText: item.complaintText ?? null,
      customInputs: (item.customInputs ?? []).map((input) => ({
        name: input.name ?? '',
        value: input.value ?? '',
      })),
    };
  }

  private toDashboardRiskLevel(
    riskLevel: AnonymousTemplateDashboardRiskLevel | string | null | undefined,
  ): AnonymousTemplateDashboardRiskLevel {
    if (riskLevel === 'HighRisk' || riskLevel === 'MediumRisk') {
      return riskLevel;
    }

    return 'Healthy';
  }

  private toResponsesPageResult(
    response:
      | AnonymousTemplateResponsesPageApiResponse
      | readonly AnonymousTemplateResponseApiResponse[],
    query: AnonymousTemplateResponsesListQuery,
  ): AnonymousTemplateResponsesPageResult {
    if (Array.isArray(response)) {
      const responses = response.map((item) => this.toResponseListItem(item));
      return {
        currentPage: query.pageNumber,
        pageSize: query.pageSize,
        totalItems: responses.length,
        data: responses,
      };
    }

    const pageResponse = response as AnonymousTemplateResponsesPageApiResponse;
    const responses = (pageResponse.data ?? []).map((item: AnonymousTemplateResponseApiResponse) =>
      this.toResponseListItem(item),
    );
    return {
      currentPage: pageResponse.currentPage ?? query.pageNumber,
      pageSize: pageResponse.pageSize ?? query.pageSize,
      totalItems: pageResponse.totalItems ?? responses.length,
      data: responses,
    };
  }

  private toBranchAnonymousResponsesPageResult(
    response: BranchAnonymousResponsesPageApiResponse,
    query: BranchAnonymousResponsesQuery,
  ): BranchAnonymousResponsesPageResult {
    const responses = (response.data ?? []).map((item) =>
      this.toBranchAnonymousResponseListItem(item),
    );
    const pageSize = response.pageSize ?? query.pageSize;
    const totalItems = response.totalItems ?? responses.length;
    const totalPages = response.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = response.currentPage ?? query.pageNumber;

    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      data: responses,
      hasPreviousPage: response.hasPreviousPage ?? currentPage > 1,
      hasNextPage: response.hasNextPage ?? currentPage < totalPages,
    };
  }

  private toBranchAnonymousResponseListItem(
    response: BranchAnonymousResponseApiResponse,
  ): BranchAnonymousResponseListItem {
    const scorePercentage = response.scorePercentage ?? null;

    return {
      anonymousSurveyResponseId: this.readRecordId(response.anonymousSurveyResponseId),
      anonymousTemplateId: this.readRecordId(response.anonymousTemplateId),
      anonymousTemplateNameEn: response.anonymousTemplateNameEn ?? '',
      anonymousTemplateNameAr: response.anonymousTemplateNameAr ?? null,
      submittedOnUtc: response.submittedOnUtc ?? '',
      scorePercentage,
      isScored: response.isScored ?? scorePercentage !== null,
      hasComplaint: response.hasComplaint ?? false,
      hasVoice: response.hasVoice ?? false,
      customInputsPreview: (response.customInputsPreview ?? []).map((input) =>
        this.toBranchAnonymousResponseCustomInputPreview(input),
      ),
    };
  }

  private toBranchAnonymousResponseCustomInputPreview(
    response: BranchAnonymousResponseCustomInputPreviewApiResponse,
  ): BranchAnonymousResponseCustomInputPreview {
    return {
      name: response.name ?? '',
      labelEn: response.labelEn ?? null,
      labelAr: response.labelAr ?? null,
      value: response.value === null || response.value === undefined ? '' : String(response.value),
    };
  }

  private toResponseListItem(
    response: AnonymousTemplateResponseApiResponse,
  ): AnonymousTemplateResponseListItem {
    const customInputs = response.customInputValues ?? response.customInputs ?? [];
    const answers = response.answers ?? [];

    return {
      anonymousSurveyResponseId: this.readRecordId(response.anonymousSurveyResponseId),
      anonymousTemplateId: this.readRecordId(response.anonymousTemplateId),
      submittedOnUtc: response.submittedOnUtc ?? '',
      actualScore: response.actualScore ?? null,
      maxScore: response.maxScore ?? null,
      scorePercentage: response.scorePercentage ?? null,
      isScored: response.isScored ?? (response.scorePercentage ?? null) !== null,
      answersCount: response.answersCount ?? answers.length,
      customInputValuesCount: response.customInputValuesCount ?? customInputs.length,
    };
  }

  private toResponseDetails(
    response: AnonymousTemplateResponseApiResponse,
    fallbackAnonymousTemplateId: string,
  ): AnonymousTemplateResponseDetails {
    const listItem = this.toResponseListItem(response);
    const customInputs = response.customInputValues ?? response.customInputs ?? [];

    return {
      ...listItem,
      anonymousTemplateId: listItem.anonymousTemplateId || fallbackAnonymousTemplateId,
      templateNameEn: response.templateNameEn ?? '',
      templateNameAr: response.templateNameAr ?? null,
      customInputValues: customInputs.map((value) => this.toResponseCustomInputValue(value)),
      answers: (response.answers ?? [])
        .map((answer) => this.toResponseAnswer(answer))
        .sort((first, second) => first.questionOrder - second.questionOrder),
    };
  }

  private toResponseCustomInputValue(
    response: AnonymousTemplateResponseCustomInputValueApiResponse,
  ): AnonymousTemplateResponseCustomInputValue {
    const type = this.toCustomInputType(response.type ?? response.typeName);
    const rawValue = response.value;
    const stringValue =
      response.stringValue ??
      (typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : null);
    const integerValue =
      response.integerValue ?? (typeof rawValue === 'number' ? rawValue : null);
    const name = response.nameSnapshot ?? response.name ?? '';
    const displayValue =
      stringValue ?? (integerValue === null || integerValue === undefined ? '' : String(integerValue));

    return {
      customInputValueId: this.readRecordId(response.customInputValueId),
      anonymousTemplateCustomInputId: this.readRecordId(response.anonymousTemplateCustomInputId),
      name,
      labelEn: response.labelEn ?? null,
      labelAr: response.labelAr ?? null,
      nameSnapshot: name,
      type,
      typeName: response.typeName ?? (type === 2 ? 'Integer' : 'String'),
      stringValue,
      integerValue,
      displayValue,
    };
  }

  private toResponseAnswer(
    response: AnonymousTemplateResponseAnswerApiResponse,
  ): AnonymousTemplateResponseAnswer {
    const questionId = this.readRecordId(response.questionId);

    return {
      answerId: this.readRecordId(response.answerId) || questionId,
      anonymousTemplateQuestionId: this.readRecordId(response.anonymousTemplateQuestionId),
      questionId,
      questionTextEn: response.questionTextEn ?? '',
      questionTextAr: response.questionTextAr ?? null,
      questionType: this.toStatus(response.questionType),
      questionTypeName: response.questionTypeName ?? '',
      questionOrder: response.questionOrder ?? response.order ?? 0,
      selectedQuestionOptionId: this.readNullableRecordId(response.selectedQuestionOptionId),
      selectedOptionTextEn: response.selectedOptionTextEn ?? null,
      selectedOptionTextAr: response.selectedOptionTextAr ?? null,
      selectedOptionValue: response.selectedOptionValue ?? null,
      starRatingValue: response.starRatingValue ?? null,
      smileValue: response.smileValue ?? null,
      textAnswer: response.textAnswer ?? null,
      voiceFileName: response.voiceFileName ?? null,
      voiceUrl: response.voiceUrl ?? null,
    };
  }

  private toListItem(response: AnonymousTemplateApiResponse): AnonymousTemplateListItem {
    const scopeState = toScopeState(response);

    return {
      ...scopeState,
      anonymousTemplateId: this.readRecordId(response.anonymousTemplateId),
      branchId: this.readNullableRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? null,
      branchNameAr: response.branchNameAr ?? null,
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      description: response.description ?? null,
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      status: this.toStatus(response.status),
      statusName: response.statusName ?? 'Draft',
      isActive: response.isActive ?? true,
      publicUrl: response.publicUrl ?? '',
      qrCode: response.qrCode ?? null,
      questionsCount: response.questionsCount ?? 0,
      customInputsCount: response.customInputsCount ?? 0,
      responsesCount: response.responsesCount ?? 0,
      createdByApplicationUserId: this.readRecordId(response.createdByApplicationUserId),
      createdOnUtc: response.createdOnUtc ?? '',
    };
  }

  private toTemplate(response: AnonymousTemplateApiResponse): AnonymousTemplate {
    const scopeState = toScopeState(response);
    const customInputs = (response.customInputs ?? [])
      .map((customInput) => this.toCustomInput(customInput))
      .sort((first, second) => first.order - second.order);
    const questions = (response.questions ?? [])
      .map((question) => this.toQuestion(question))
      .sort((first, second) => first.order - second.order);
    const questionConditions = (response.questionConditions ?? [])
      .map((condition) => this.toQuestionCondition(condition))
      .sort((first, second) => first.order - second.order);
    const summary = this.toSummary(
      response.summary,
      questions.length,
      customInputs.length,
      questionConditions.length,
    );

    return {
      ...scopeState,
      anonymousTemplateId: this.readRecordId(response.anonymousTemplateId),
      branchId: this.readNullableRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? null,
      branchNameAr: response.branchNameAr ?? null,
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      description: response.description ?? null,
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      status: this.toStatus(response.status),
      statusName: response.statusName ?? 'Draft',
      isActive: response.isActive ?? true,
      publicUrl: response.publicUrl ?? '',
      qrCode: response.qrCode ?? null,
      createdByApplicationUserId: this.readRecordId(response.createdByApplicationUserId),
      createdOnUtc: response.createdOnUtc ?? '',
      modifiedOnUtc: response.modifiedOnUtc ?? null,
      summary,
      questionsCount: response.questionsCount ?? 0,
      customInputsCount: response.customInputsCount ?? customInputs.length,
      questionConditionsCount: summary.questionConditionsCount,
      responsesCount: response.responsesCount ?? 0,
      customInputs,
      questions,
      questionConditions,
    };
  }

  private toStateChange(response: AnonymousTemplateApiResponse): AnonymousTemplateStateChange {
    return {
      ...toScopeState(response),
      anonymousTemplateId: this.readRecordId(response.anonymousTemplateId),
      branchId: this.readNullableRecordId(response.branchId),
      status: this.toStatus(response.status),
      statusName: response.statusName ?? '',
      isActive: response.isActive ?? true,
    };
  }

  private toSummary(
    response: AnonymousTemplateSummaryApiResponse | null | undefined,
    questionsCount: number,
    customInputsCount: number,
    questionConditionsCount: number,
  ): AnonymousTemplateSummary {
    return {
      questionsCount: response?.questionsCount ?? questionsCount,
      customInputsCount: response?.customInputsCount ?? customInputsCount,
      questionConditionsCount: response?.questionConditionsCount ?? questionConditionsCount,
    };
  }

  private toCustomInput(
    response: AnonymousTemplateCustomInputApiResponse,
  ): AnonymousTemplateCustomInput {
    const type = this.toCustomInputType(response.type ?? response.typeName);

    return {
      customInputId: this.readRecordId(response.customInputId),
      name: response.name ?? '',
      labelEn: response.labelEn ?? null,
      labelAr: response.labelAr ?? null,
      type,
      typeName: response.typeName ?? (type === 2 ? 'Integer' : 'String'),
      isRequired: response.isRequired ?? false,
      minLength: response.minLength ?? null,
      maxLength: response.maxLength ?? null,
      minValue: response.minValue ?? null,
      maxValue: response.maxValue ?? null,
      order: response.order ?? 0,
      isActive: response.isActive ?? true,
    };
  }

  private toQuestion(response: AnonymousTemplateQuestionApiResponse): AnonymousTemplateQuestion {
    const options = (response.options ?? [])
      .map((option) => this.toQuestionOption(option))
      .sort((first, second) => first.order - second.order);

    return {
      ...toScopeState(response),
      anonymousTemplateQuestionId: this.readRecordId(response.anonymousTemplateQuestionId),
      questionId: this.readRecordId(response.questionId),
      branchId: this.readNullableRecordId(response.branchId),
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      isEditable: response.isEditable ?? true,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: this.toStatus(response.type),
      typeName: response.typeName ?? '',
      order: response.order ?? 0,
      isActive: response.isActive ?? true,
      options,
    };
  }

  private toQuestionsSelection(
    response: AnonymousTemplateQuestionsSelectionApiResponse,
    fallbackAnonymousTemplateId: string,
  ): AnonymousTemplateQuestionsSelection {
    const questions = (response.questions ?? [])
      .map((question) => this.toQuestionSelectionItem(question))
      .filter((question) => question.questionId.length > 0);

    return {
      ...toScopeState(response),
      anonymousTemplateId:
        this.readRecordId(response.anonymousTemplateId) || fallbackAnonymousTemplateId,
      branchId: this.readNullableRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      selectedQuestionsCount:
        response.selectedQuestionsCount ??
        questions.filter((question) => question.isSelected).length,
      questions,
    };
  }

  private toQuestionSelectionItem(
    response: AnonymousTemplateQuestionSelectionItemApiResponse,
  ): AnonymousTemplateQuestionSelectionItem {
    const questionId = this.readRecordId(response.questionId);

    return {
      ...toSelectableEditableScopeState(response),
      questionId,
      anonymousTemplateQuestionId: this.readNullableRecordId(response.anonymousTemplateQuestionId),
      branchId: this.readNullableRecordId(response.branchId),
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      isSelected: response.isSelected ?? false,
      selectedOrder: response.selectedOrder ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: this.toStatus(response.type),
      typeName: response.typeName ?? '',
      isActive: response.isActive ?? true,
      options: (response.options ?? [])
        .map((option) => this.toQuestionOption(option))
        .sort((first, second) => first.order - second.order),
    };
  }

  private toAssignQuestionsResult(
    response: AssignAnonymousTemplateQuestionsApiResponse,
    fallbackAnonymousTemplateId: string,
  ): AssignAnonymousTemplateQuestionsResult {
    const questions = (response.questions ?? [])
      .map((question) => this.toAssignedQuestion(question))
      .filter(
        (question) =>
          question.questionId.length > 0 && question.anonymousTemplateQuestionId.length > 0,
      )
      .sort((first, second) => first.order - second.order);

    return {
      ...toScopeState(response),
      anonymousTemplateId:
        this.readRecordId(response.anonymousTemplateId) || fallbackAnonymousTemplateId,
      branchId: this.readNullableRecordId(response.branchId),
      assignedQuestionsCount: response.assignedQuestionsCount ?? questions.length,
      questions,
    };
  }

  private toAssignedQuestion(
    response: AnonymousTemplateAssignedQuestionApiResponse,
  ): AnonymousTemplateAssignedQuestion {
    return {
      ...toScopeState(response),
      anonymousTemplateQuestionId: this.readRecordId(response.anonymousTemplateQuestionId),
      questionId: this.readRecordId(response.questionId),
      branchId: this.readNullableRecordId(response.branchId),
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: this.toStatus(response.type),
      typeName: response.typeName ?? '',
      order: response.order ?? 0,
    };
  }

  private toQuestionOption(
    response: AnonymousTemplateQuestionOptionApiResponse,
  ): AnonymousTemplateQuestionOption {
    return {
      optionId: this.readRecordId(response.optionId),
      questionId: this.readRecordId(response.questionId),
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      order: response.order ?? 0,
      value: response.value ?? null,
      isActive: response.isActive ?? true,
    };
  }

  private toQuestionCondition(
    response: AnonymousTemplateQuestionConditionApiResponse,
  ): AnonymousTemplateQuestionCondition {
    return {
      conditionId: this.readRecordId(response.conditionId),
      parentAnonymousTemplateQuestionId: this.readRecordId(
        response.parentAnonymousTemplateQuestionId,
      ),
      childAnonymousTemplateQuestionId: this.readRecordId(
        response.childAnonymousTemplateQuestionId,
      ),
      triggerType: this.toStatus(response.triggerType),
      triggerTypeName: response.triggerTypeName ?? '',
      selectedQuestionOptionId: this.readNullableRecordId(response.selectedQuestionOptionId),
      triggerValue: response.triggerValue ?? null,
      order: response.order ?? 0,
      isActive: response.isActive ?? true,
    };
  }

  private toManageQuestionConditionsResult(
    response: ManageAnonymousTemplateQuestionConditionsApiResponse,
    fallbackAnonymousTemplateId: string,
  ): ManageAnonymousTemplateQuestionConditionsResult {
    const conditions = (response.conditions ?? [])
      .map((condition) => this.toQuestionCondition(condition))
      .filter(
        (condition) =>
          condition.parentAnonymousTemplateQuestionId.length > 0 &&
          condition.childAnonymousTemplateQuestionId.length > 0,
      )
      .sort((first, second) => first.order - second.order);

    return {
      ...toScopeState(response),
      anonymousTemplateId:
        this.readRecordId(response.anonymousTemplateId) || fallbackAnonymousTemplateId,
      branchId: this.readNullableRecordId(response.branchId),
      conditionsCount: response.conditionsCount ?? conditions.length,
      conditions,
    };
  }

  private toManageQuestionConditionsPayload(
    payload: ManageAnonymousTemplateQuestionConditionsPayload,
  ): ManageAnonymousTemplateQuestionConditionsPayload {
    return {
      conditions: payload.conditions.map((condition, index) => ({
        ...condition,
        order: index + 1,
      })),
    };
  }

  private toCustomInputType(
    type: number | string | null | undefined,
  ): AnonymousTemplateCustomInputType {
    const normalizedType = String(type ?? '')
      .trim()
      .toLowerCase();

    return normalizedType === '2' || normalizedType === 'integer' ? 2 : 1;
  }

  private toStatus(status: number | string | null | undefined): number | null {
    if (typeof status === 'number') {
      return Number.isFinite(status) ? status : null;
    }

    if (typeof status === 'string') {
      const numericStatus = Number(status);
      return Number.isFinite(numericStatus) ? numericStatus : null;
    }

    return null;
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }

  private readNullableRecordId(id: string | number | null | undefined): string | null {
    const recordId = this.readRecordId(id);
    return recordId.length > 0 ? recordId : null;
  }
}
