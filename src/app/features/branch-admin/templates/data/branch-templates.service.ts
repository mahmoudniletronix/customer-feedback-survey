import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toQuestionAnswerOption } from '../../../../shared/models/question-answer.model';
import { toQuestionCondition } from '../../../../shared/models/question-condition.model';
import {
  toEditableScopeState,
  toScopeState,
  toSelectableEditableScopeState,
  toSelectableScopeState,
} from '../../../../shared/models/resource-scope.model';
import {
  BranchTemplate,
  BranchTemplateApiResponse,
  BranchTemplateDetailsQuestion,
  BranchTemplateDetailsQuestionApiResponse,
  BranchTemplateQuestionGroupSelection,
  BranchTemplateQuestionGroupSelectionApiResponse,
  BranchTemplateQuestionSelection,
  BranchTemplateQuestionSelectionApiResponse,
  BranchTemplateQuestionSelectionItem,
  BranchTemplateQuestionSelectionItemApiResponse,
  BranchTemplateSelection,
  BranchTemplateSelectionApiResponse,
  BranchTemplatesPageApiResponse,
  BranchTemplatesPageResult,
  BranchTemplatesQuery,
  CreateBranchTemplatePayload,
  UpdateBranchTemplateQuestionConditionsPayload,
  UpdateBranchTemplateQuestionsApiResponse,
  UpdateBranchTemplateQuestionsPayload,
  UpdateBranchTemplateQuestionsResult,
  UpdatedBranchTemplateQuestion,
  UpdatedBranchTemplateQuestionApiResponse,
  UpdateBranchTemplatePayload,
} from '../domain/branch-template.model';

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
      .get<
        | BranchTemplatesPageApiResponse
        | readonly BranchTemplateApiResponse[]
        | BranchTemplateApiResponse
      >(this.templatesUrl, { params })
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

  getQuestionsSelection(templateId: string): Observable<BranchTemplateQuestionSelection> {
    return this.http
      .get<BranchTemplateQuestionSelectionApiResponse>(
        `${this.templatesUrl}/${templateId}/questions-selection`,
      )
      .pipe(map((response) => this.toQuestionsSelection(response, templateId)));
  }

  update(templateId: string, payload: UpdateBranchTemplatePayload): Observable<BranchTemplate> {
    return this.http
      .put<BranchTemplateApiResponse>(`${this.templatesUrl}/${templateId}`, payload)
      .pipe(map((response) => this.toTemplate(response)));
  }

  updateQuestions(
    templateId: string,
    payload: UpdateBranchTemplateQuestionsPayload,
  ): Observable<UpdateBranchTemplateQuestionsResult> {
    return this.http
      .put<UpdateBranchTemplateQuestionsApiResponse>(
        `${this.templatesUrl}/${templateId}/questions`,
        payload,
      )
      .pipe(map((response) => this.toUpdatedQuestions(response, templateId)));
  }

  updateQuestionConditions(
    templateId: string,
    payload: UpdateBranchTemplateQuestionConditionsPayload,
  ): Observable<void> {
    return this.http
      .put<unknown>(`${this.templatesUrl}/${templateId}/question-conditions`, payload)
      .pipe(map(() => undefined));
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
    response:
      | BranchTemplatesPageApiResponse
      | readonly BranchTemplateApiResponse[]
      | BranchTemplateApiResponse,
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
    const questions = (response.questions ?? []).map((question) =>
      this.toTemplateDetailsQuestion(question),
    );

    return {
      templateId: this.readRecordId(response.templateId),
      branchId: this.readRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      status: response.statusName ?? response.status ?? 'Draft',
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? questions.length,
      createdOnUtc: response.createdOnUtc ?? '',
      questions,
      questionConditions: (response.questionConditions ?? [])
        .map((condition) => toQuestionCondition(condition))
        .filter(
          (condition) =>
            condition.parentTemplateQuestionId.length > 0 &&
            condition.childTemplateQuestionId.length > 0,
        ),
    };
  }

  private toTemplateSelection(
    response: BranchTemplateSelectionApiResponse,
  ): BranchTemplateSelection {
    return {
      id: this.readRecordId(response.id),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      branchId: this.readRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? '',
      branchNameAr: response.branchNameAr ?? '',
      branchCode: response.branchCode ?? '',
    };
  }

  private toQuestionsSelection(
    response: BranchTemplateQuestionSelectionApiResponse,
    fallbackTemplateId: string,
  ): BranchTemplateQuestionSelection {
    return {
      templateId: this.readRecordId(response.templateId) || fallbackTemplateId,
      branchId: this.readRecordId(response.branchId),
      templateNameEn: response.templateNameEn ?? '',
      templateNameAr: response.templateNameAr ?? '',
      status: response.status ?? 'Draft',
      isActive: response.isActive ?? true,
      groups: this.toQuestionSelectionGroups(response),
      questionConditions: (response.questionConditions ?? [])
        .map((condition) => toQuestionCondition(condition))
        .filter(
          (condition) =>
            condition.parentTemplateQuestionId.length > 0 &&
            condition.childTemplateQuestionId.length > 0,
        ),
    };
  }

  private toTemplateDetailsQuestion(
    response: BranchTemplateDetailsQuestionApiResponse,
  ): BranchTemplateDetailsQuestion {
    const questionId = this.readRecordId(response.questionId);

    return {
      ...toEditableScopeState(response),
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId,
      questionBranchId: this.readNullableRecordId(response.questionBranchId),
      order: response.order ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type !== null && response.type !== undefined ? String(response.type) : '',
      typeName: response.typeName ?? '',
      isActive: response.isActive ?? true,
      groupId: this.readRecordId(response.groupId),
      groupBranchId: this.readNullableRecordId(response.groupBranchId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? '',
      options: (response.options ?? []).map((option) => toQuestionAnswerOption(option, questionId)),
    };
  }

  private toQuestionSelectionGroups(
    response: BranchTemplateQuestionSelectionApiResponse,
  ): readonly BranchTemplateQuestionGroupSelection[] {
    if (response.groups && response.groups.length > 0) {
      return response.groups.map((group) => this.toQuestionSelectionGroup(group));
    }

    return this.groupFlatQuestionSelection(response.questions ?? []);
  }

  private toQuestionSelectionGroup(
    response: BranchTemplateQuestionGroupSelectionApiResponse,
  ): BranchTemplateQuestionGroupSelection {
    return {
      ...toSelectableScopeState(response),
      groupId: this.readRecordId(response.groupId),
      branchId: this.readNullableRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      isActive: response.isActive ?? true,
      questions: (response.questions ?? []).map((question) =>
        this.toQuestionSelectionItem(question),
      ),
    };
  }

  private groupFlatQuestionSelection(
    questions: readonly BranchTemplateQuestionSelectionItemApiResponse[],
  ): readonly BranchTemplateQuestionGroupSelection[] {
    const groupsById = new Map<string, BranchTemplateQuestionGroupSelection>();

    for (const question of questions) {
      const groupId = this.readRecordId(question.groupId) || 'ungrouped';
      const currentGroup = groupsById.get(groupId);
      const nextQuestion = this.toQuestionSelectionItem(question);

      if (currentGroup) {
        groupsById.set(groupId, {
          ...currentGroup,
          questions: [...currentGroup.questions, nextQuestion],
        });
        continue;
      }

      groupsById.set(groupId, {
        ...toSelectableScopeState(question),
        groupId,
        branchId: this.readNullableRecordId(question.branchId),
        nameEn: question.groupNameEn ?? '',
        nameAr: question.groupNameAr ?? '',
        isActive: true,
        questions: [nextQuestion],
      });
    }

    return [...groupsById.values()];
  }

  private toQuestionSelectionItem(
    response: BranchTemplateQuestionSelectionItemApiResponse,
  ): BranchTemplateQuestionSelectionItem {
    const questionId = this.readRecordId(response.questionId);

    return {
      ...toSelectableEditableScopeState(response),
      questionId,
      templateQuestionId: this.readNullableRecordId(response.templateQuestionId),
      branchId: this.readNullableRecordId(response.branchId),
      groupId: this.readRecordId(response.groupId),
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type !== null && response.type !== undefined ? String(response.type) : '',
      typeName: response.typeName ?? '',
      isSelected: response.isSelected ?? false,
      isActive: response.isActive ?? true,
      order: response.order ?? null,
      options: (response.options ?? []).map((option) => toQuestionAnswerOption(option, questionId)),
    };
  }

  private toUpdatedQuestions(
    response: UpdateBranchTemplateQuestionsApiResponse,
    fallbackTemplateId: string,
  ): UpdateBranchTemplateQuestionsResult {
    const questions = (response.questions ?? []).map((question) => this.toUpdatedQuestion(question));

    return {
      templateId: this.readRecordId(response.templateId) || fallbackTemplateId,
      branchId: this.readRecordId(response.branchId),
      questionsCount: response.questionsCount ?? questions.length,
      questions,
    };
  }

  private toUpdatedQuestion(response: UpdatedBranchTemplateQuestionApiResponse): UpdatedBranchTemplateQuestion {
    return {
      ...toScopeState(response),
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId: this.readRecordId(response.questionId),
      questionBranchId: this.readNullableRecordId(response.questionBranchId),
      groupId: this.readRecordId(response.groupId),
      order: response.order ?? 0,
    };
  }

  private isPageResponse(
    response: BranchTemplatesPageApiResponse | BranchTemplateApiResponse,
  ): response is BranchTemplatesPageApiResponse {
    return 'data' in response || 'currentPage' in response || 'totalItems' in response;
  }

  private isTemplatesArray(
    response:
      | BranchTemplatesPageApiResponse
      | readonly BranchTemplateApiResponse[]
      | BranchTemplateApiResponse,
  ): response is readonly BranchTemplateApiResponse[] {
    return Array.isArray(response);
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }

  private readNullableRecordId(id: string | number | null | undefined): string | null {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }
}
