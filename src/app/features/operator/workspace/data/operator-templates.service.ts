import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { toQuestionAnswerOption } from '../../../../shared/models/question-answer.model';
import { toQuestionCondition } from '../../../../shared/models/question-condition.model';
import { toScopeState } from '../../../../shared/models/resource-scope.model';
import {
  OperatorAssignedTemplate,
  OperatorAssignedTemplateApiResponse,
  OperatorAssignedTemplateCustomInput,
  OperatorAssignedTemplateCustomInputApiResponse,
  OperatorAssignedTemplateQuestion,
  OperatorAssignedTemplateQuestionApiResponse,
  OperatorTemplateCustomInputType,
  OperatorLatestTemplateAnswer,
  OperatorLatestTemplateAnswerApiResponse,
  OperatorLatestTemplateResponse,
  OperatorLatestTemplateResponseApiResponse,
  OperatorLatestTemplateScore,
  OperatorLatestTemplateScoreApiResponse,
  OperatorTemplateAnswerSubmission,
  OperatorTemplateCustomInputSubmission,
  OperatorTemplateResponseApiResponse,
  OperatorTemplateResponseCustomInput,
  OperatorTemplateResponseCustomInputApiResponse,
  OperatorTemplateResponseResult,
  OperatorMyTemplates,
  OperatorMyTemplatesApiResponse,
} from '../domain/operator-template.model';

@Injectable()
export class OperatorTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly myTemplatesUrl = `${environment.apiBaseUrl}/api/operators/my-templates`;

  myTemplates(): Observable<OperatorMyTemplates> {
    return this.http
      .get<OperatorMyTemplatesApiResponse>(this.myTemplatesUrl)
      .pipe(map((response) => this.toMyTemplates(response)));
  }

  submitResponse(
    templateId: string,
    answers: readonly OperatorTemplateAnswerSubmission[],
    customInputs: readonly OperatorTemplateCustomInputSubmission[],
  ): Observable<OperatorTemplateResponseResult> {
    return this.http
      .post<OperatorTemplateResponseApiResponse>(
        `${this.myTemplatesUrl}/${templateId}/responses`,
        this.toResponseFormData(answers, customInputs),
      )
      .pipe(map((response) => this.toResponseResult(response, templateId)));
  }

  private toMyTemplates(response: OperatorMyTemplatesApiResponse): OperatorMyTemplates {
    const templates = (response.templates ?? []).map((template) => this.toTemplate(template));

    return {
      operatorId: this.readRecordId(response.operatorId),
      departmentId: this.readRecordId(response.departmentId),
      templatesCount: response.templatesCount ?? templates.length,
      templates,
    };
  }

  private toTemplate(response: OperatorAssignedTemplateApiResponse): OperatorAssignedTemplate {
    const questions = (response.questions ?? []).map((question) => this.toQuestion(question));
    const customInputs = (response.customInputs ?? [])
      .map((customInput) => this.toCustomInput(customInput))
      .filter((customInput) => customInput.customInputId.length > 0)
      .sort((first, second) => first.order - second.order);

    return {
      templateId: this.readRecordId(response.templateId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      branchId: this.readRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? '',
      branchNameAr: response.branchNameAr ?? '',
      branchCode: response.branchCode ?? '',
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? questions.length,
      customInputsCount: response.customInputsCount ?? customInputs.length,
      hasAnswered: response.hasAnswered ?? Boolean(response.latestResponse),
      latestResponse: response.latestResponse
        ? this.toLatestResponse(response.latestResponse)
        : null,
      customInputs,
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

  private toLatestResponse(
    response: OperatorLatestTemplateResponseApiResponse,
  ): OperatorLatestTemplateResponse {
    const answers = (response.answers ?? []).map((answer) => this.toLatestAnswer(answer));
    const customInputs = (response.customInputs ?? []).map((customInput) =>
      this.toResponseCustomInput(customInput),
    );

    return {
      surveyResponseId: this.readRecordId(response.surveyResponseId),
      submittedOnUtc: response.submittedOnUtc ?? '',
      answersCount: response.answersCount ?? answers.length,
      customInputsCount: response.customInputsCount ?? customInputs.length,
      score: response.score ? this.toLatestScore(response.score) : null,
      customInputs,
      answers,
    };
  }

  private toCustomInput(
    response: OperatorAssignedTemplateCustomInputApiResponse,
  ): OperatorAssignedTemplateCustomInput {
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
    };
  }

  private toLatestScore(response: OperatorLatestTemplateScoreApiResponse): OperatorLatestTemplateScore {
    return {
      actualScore: response.actualScore ?? 0,
      maxScore: response.maxScore ?? 0,
      percentage: response.percentage ?? 0,
    };
  }

  private toLatestAnswer(
    response: OperatorLatestTemplateAnswerApiResponse,
  ): OperatorLatestTemplateAnswer {
    return {
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId: this.readRecordId(response.questionId),
      questionType:
        response.questionType !== null && response.questionType !== undefined
          ? String(response.questionType)
          : '',
      selectedQuestionOptionId: this.readNullableRecordId(response.selectedQuestionOptionId),
      selectedOptionTextEn: response.selectedOptionTextEn ?? null,
      selectedOptionTextAr: response.selectedOptionTextAr ?? null,
      starRatingValue: response.starRatingValue ?? null,
      smileValue: response.smileValue ?? null,
      textAnswer: response.textAnswer ?? null,
      voiceFileName: response.voiceFileName ?? null,
      voiceFileUrl: response.voiceFileUrl ? this.toMediaUrl(response.voiceFileUrl) : null,
    };
  }

  private toQuestion(response: OperatorAssignedTemplateQuestionApiResponse): OperatorAssignedTemplateQuestion {
    const questionId = this.readRecordId(response.questionId);

    return {
      ...toScopeState(response),
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId,
      questionBranchId: this.readNullableRecordId(response.questionBranchId),
      order: response.order ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type:
        response.type !== null && response.type !== undefined
          ? String(response.type)
          : response.typeName ?? '',
      groupId: this.readRecordId(response.groupId),
      groupBranchId: this.readNullableRecordId(response.groupBranchId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? '',
      options: (response.options ?? []).map((option) => toQuestionAnswerOption(option, questionId)),
    };
  }

  private toResponseFormData(
    answers: readonly OperatorTemplateAnswerSubmission[],
    customInputs: readonly OperatorTemplateCustomInputSubmission[],
  ): FormData {
    const formData = new FormData();

    customInputs.forEach((customInput, index) => {
      const prefix = `CustomInputs[${index}]`;
      formData.append(`${prefix}.CustomInputId`, customInput.customInputId);
      formData.append(`${prefix}.Value`, customInput.value);
    });

    answers.forEach((answer, index) => {
      const prefix = `Answers[${index}]`;
      formData.append(`${prefix}.QuestionId`, answer.questionId);

      if (answer.selectedQuestionOptionId) {
        formData.append(`${prefix}.SelectedQuestionOptionId`, answer.selectedQuestionOptionId);
      }
      if (answer.starRatingValue !== undefined) {
        formData.append(`${prefix}.StarRatingValue`, String(answer.starRatingValue));
      }
      if (answer.smileValue !== undefined) {
        formData.append(`${prefix}.SmileValue`, String(answer.smileValue));
      }
      if (answer.textAnswer) {
        formData.append(`${prefix}.TextAnswer`, answer.textAnswer);
      }
      if (answer.voiceFile) {
        formData.append(`${prefix}.VoiceFile`, answer.voiceFile, answer.voiceFile.name);
      }
    });

    return formData;
  }

  private toResponseResult(
    response: OperatorTemplateResponseApiResponse,
    fallbackTemplateId: string,
  ): OperatorTemplateResponseResult {
    const customInputs = (response.customInputs ?? []).map((customInput) =>
      this.toResponseCustomInput(customInput),
    );

    return {
      surveyResponseId: this.readRecordId(response.surveyResponseId),
      operatorId: this.readRecordId(response.operatorId),
      templateId: this.readRecordId(response.templateId) || fallbackTemplateId,
      customInputsCount: response.customInputsCount ?? customInputs.length,
      answersCount: response.answersCount ?? 0,
      actualScore: response.actualScore ?? 0,
      maxScore: response.maxScore ?? 0,
      scorePercentage: response.scorePercentage ?? 0,
      submittedOnUtc: response.submittedOnUtc ?? '',
      customInputs,
    };
  }

  private toResponseCustomInput(
    response: OperatorTemplateResponseCustomInputApiResponse,
  ): OperatorTemplateResponseCustomInput {
    const type = this.toCustomInputType(response.type ?? response.typeName);

    return {
      customInputId: this.readRecordId(response.customInputId),
      name: response.name ?? '',
      type,
      typeName: response.typeName ?? (type === 2 ? 'Integer' : 'String'),
      stringValue: response.stringValue ?? null,
      integerValue: response.integerValue ?? null,
    };
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }

  private readNullableRecordId(id: string | number | null | undefined): string | null {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }

  private toCustomInputType(
    type: number | string | null | undefined,
  ): OperatorTemplateCustomInputType {
    const normalizedType = String(type ?? '').trim().toLowerCase();
    return normalizedType === '2' || normalizedType === 'integer' ? 2 : 1;
  }

  private toMediaUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const mediaPath = url.replace(/^\//, '');
    return `${baseUrl}/${mediaPath}`;
  }
}
