import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
} from '../../../shared/models/question-answer.model';
import {
  QuestionCondition,
  QuestionConditionApiResponse,
} from '../../../shared/models/question-condition.model';

export interface OperatorMyTemplates {
  operatorId: string;
  departmentId: string;
  templatesCount: number;
  templates: readonly OperatorAssignedTemplate[];
}

export interface OperatorAssignedTemplate {
  templateId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
  isActive: boolean;
  questionsCount: number;
  hasAnswered: boolean;
  latestResponse: OperatorLatestTemplateResponse | null;
  questions: readonly OperatorAssignedTemplateQuestion[];
  questionConditions: readonly QuestionCondition[];
}

export interface OperatorLatestTemplateResponse {
  surveyResponseId: string;
  submittedOnUtc: string;
  answersCount: number;
  answers: readonly OperatorLatestTemplateAnswer[];
}

export interface OperatorLatestTemplateAnswer {
  templateQuestionId: string;
  questionId: string;
  questionType: string;
  selectedQuestionOptionId: string | null;
  selectedOptionTextEn: string | null;
  selectedOptionTextAr: string | null;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string | null;
  voiceFileName: string | null;
  voiceFileUrl: string | null;
}

export interface OperatorAssignedTemplateQuestion {
  templateQuestionId: string;
  questionId: string;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  options: readonly QuestionAnswerOption[];
}

export interface OperatorTemplateAnswerSubmission {
  questionId: string;
  selectedQuestionOptionId?: string;
  starRatingValue?: number;
  smileValue?: number;
  textAnswer?: string;
  voiceFile?: File;
}

export interface OperatorTemplateResponseResult {
  surveyResponseId: string;
  operatorId: string;
  templateId: string;
  answersCount: number;
  submittedOnUtc: string;
}

export interface OperatorMyTemplatesApiResponse {
  operatorId?: string | number;
  departmentId?: string | number;
  templatesCount?: number;
  templates?: readonly OperatorAssignedTemplateApiResponse[];
}

export interface OperatorAssignedTemplateApiResponse {
  templateId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string | null;
  isActive?: boolean;
  questionsCount?: number;
  hasAnswered?: boolean;
  latestResponse?: OperatorLatestTemplateResponseApiResponse | null;
  questions?: readonly OperatorAssignedTemplateQuestionApiResponse[];
  questionConditions?: readonly QuestionConditionApiResponse[];
}

export interface OperatorLatestTemplateResponseApiResponse {
  surveyResponseId?: string | number;
  submittedOnUtc?: string | null;
  answersCount?: number;
  answers?: readonly OperatorLatestTemplateAnswerApiResponse[];
}

export interface OperatorLatestTemplateAnswerApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  questionType?: string | null;
  selectedQuestionOptionId?: string | number | null;
  selectedOptionTextEn?: string | null;
  selectedOptionTextAr?: string | null;
  starRatingValue?: number | null;
  smileValue?: number | null;
  textAnswer?: string | null;
  voiceFileName?: string | null;
  voiceFileUrl?: string | null;
}

export interface OperatorAssignedTemplateQuestionApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | null;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
  options?: readonly QuestionAnswerOptionApiResponse[];
}

export interface OperatorTemplateResponseApiResponse {
  surveyResponseId?: string | number;
  operatorId?: string | number;
  templateId?: string | number;
  answersCount?: number;
  submittedOnUtc?: string;
}
