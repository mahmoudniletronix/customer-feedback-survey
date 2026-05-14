import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { toQuestionAnswerOption } from '../../../shared/models/question-answer.model';
import { toQuestionCondition } from '../../../shared/models/question-condition.model';
import {
  OperatorAssignedTemplate,
  OperatorAssignedTemplateApiResponse,
  OperatorAssignedTemplateQuestion,
  OperatorAssignedTemplateQuestionApiResponse,
  OperatorLatestTemplateAnswer,
  OperatorLatestTemplateAnswerApiResponse,
  OperatorLatestTemplateResponse,
  OperatorLatestTemplateResponseApiResponse,
  OperatorTemplateAnswerSubmission,
  OperatorTemplateResponseApiResponse,
  OperatorTemplateResponseResult,
  OperatorMyTemplates,
  OperatorMyTemplatesApiResponse,
} from '../models/operator-template.model';

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
  ): Observable<OperatorTemplateResponseResult> {
    return this.http
      .post<OperatorTemplateResponseApiResponse>(
        `${this.myTemplatesUrl}/${templateId}/responses`,
        this.toResponseFormData(answers),
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

    return {
      templateId: this.readRecordId(response.templateId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? '',
      description: response.description ?? '',
      branchId: this.readRecordId(response.branchId),
      branchNameEn: response.branchNameEn ?? '',
      branchNameAr: response.branchNameAr ?? '',
      branchCode: response.branchCode ?? '',
      isActive: response.isActive ?? true,
      questionsCount: response.questionsCount ?? questions.length,
      hasAnswered: response.hasAnswered ?? Boolean(response.latestResponse),
      latestResponse: response.latestResponse
        ? this.toLatestResponse(response.latestResponse)
        : null,
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

    return {
      surveyResponseId: this.readRecordId(response.surveyResponseId),
      submittedOnUtc: response.submittedOnUtc ?? '',
      answersCount: response.answersCount ?? answers.length,
      answers,
    };
  }

  private toLatestAnswer(
    response: OperatorLatestTemplateAnswerApiResponse,
  ): OperatorLatestTemplateAnswer {
    return {
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId: this.readRecordId(response.questionId),
      questionType: response.questionType ?? '',
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
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId,
      order: response.order ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type ?? '',
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? '',
      options: (response.options ?? []).map((option) => toQuestionAnswerOption(option, questionId)),
    };
  }

  private toResponseFormData(answers: readonly OperatorTemplateAnswerSubmission[]): FormData {
    const formData = new FormData();

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
    return {
      surveyResponseId: this.readRecordId(response.surveyResponseId),
      operatorId: this.readRecordId(response.operatorId),
      templateId: this.readRecordId(response.templateId) || fallbackTemplateId,
      answersCount: response.answersCount ?? 0,
      submittedOnUtc: response.submittedOnUtc ?? '',
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }

  private readNullableRecordId(id: string | number | null | undefined): string | null {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
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
