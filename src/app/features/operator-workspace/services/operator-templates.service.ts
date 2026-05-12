import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OperatorAssignedTemplate,
  OperatorAssignedTemplateApiResponse,
  OperatorAssignedTemplateQuestion,
  OperatorAssignedTemplateQuestionApiResponse,
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
      questionsCount: response.questionsCount ?? questions.length,
      questions,
    };
  }

  private toQuestion(response: OperatorAssignedTemplateQuestionApiResponse): OperatorAssignedTemplateQuestion {
    return {
      templateQuestionId: this.readRecordId(response.templateQuestionId),
      questionId: this.readRecordId(response.questionId),
      order: response.order ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? '',
      type: response.type ?? '',
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? '',
    };
  }

  private readRecordId(id: string | number | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }
}
