import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
} from '../../../../shared/models/question-answer.model';
import {
  QuestionCondition,
  QuestionConditionApiResponse,
} from '../../../../shared/models/question-condition.model';
import {
  ScopeApiFields,
  ScopeState,
} from '../../../../shared/models/resource-scope.model';

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
  descriptionEn: string;
  descriptionAr: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
  activeFrom: string;
  expireTo: string | null;
  isActive: boolean;
  questionsCount: number;
  customInputsCount: number;
  hasAnswered: boolean;
  latestResponse: OperatorLatestTemplateResponse | null;
  customInputs: readonly OperatorAssignedTemplateCustomInput[];
  questions: readonly OperatorAssignedTemplateQuestion[];
  questionConditions: readonly QuestionCondition[];
}

export type OperatorTemplateCustomInputType = 1 | 2;

export interface OperatorAssignedTemplateCustomInput {
  customInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: OperatorTemplateCustomInputType;
  typeName: string;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  startWith: string | null;
  order: number;
}

export interface OperatorLatestTemplateResponse {
  surveyResponseId: string;
  submittedOnUtc: string;
  answersCount: number;
  customInputsCount: number;
  score: OperatorLatestTemplateScore | null;
  customInputs: readonly OperatorTemplateResponseCustomInput[];
  answers: readonly OperatorLatestTemplateAnswer[];
}

export interface OperatorLatestTemplateScore {
  actualScore: number;
  maxScore: number;
  percentage: number;
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

export interface OperatorAssignedTemplateQuestion extends ScopeState {
  templateQuestionId: string;
  questionId: string;
  questionBranchId: string | null;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  groupId: string;
  groupBranchId: string | null;
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

export interface OperatorTemplateCustomInputSubmission {
  customInputId: string;
  value: string;
}

export interface OperatorTemplateResponseResult {
  surveyResponseId: string;
  operatorId: string;
  templateId: string;
  customInputsCount: number;
  answersCount: number;
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  submittedOnUtc: string;
  customInputs: readonly OperatorTemplateResponseCustomInput[];
}

export interface OperatorTemplateResponseCustomInput {
  customInputId: string;
  name: string;
  type: OperatorTemplateCustomInputType;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
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
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
  isActive?: boolean;
  questionsCount?: number;
  customInputsCount?: number;
  hasAnswered?: boolean;
  latestResponse?: OperatorLatestTemplateResponseApiResponse | null;
  customInputs?: readonly OperatorAssignedTemplateCustomInputApiResponse[];
  questions?: readonly OperatorAssignedTemplateQuestionApiResponse[];
  questionConditions?: readonly QuestionConditionApiResponse[];
}

export interface OperatorAssignedTemplateCustomInputApiResponse {
  customInputId?: string | number;
  name?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  isRequired?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  startWith?: string | null;
  order?: number | null;
}

export interface OperatorLatestTemplateResponseApiResponse {
  surveyResponseId?: string | number;
  submittedOnUtc?: string | null;
  answersCount?: number;
  customInputsCount?: number;
  score?: OperatorLatestTemplateScoreApiResponse | null;
  customInputs?: readonly OperatorTemplateResponseCustomInputApiResponse[];
  answers?: readonly OperatorLatestTemplateAnswerApiResponse[];
}

export interface OperatorLatestTemplateScoreApiResponse {
  actualScore?: number | null;
  maxScore?: number | null;
  percentage?: number | null;
}

export interface OperatorLatestTemplateAnswerApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  questionType?: string | number | null;
  selectedQuestionOptionId?: string | number | null;
  selectedOptionTextEn?: string | null;
  selectedOptionTextAr?: string | null;
  starRatingValue?: number | null;
  smileValue?: number | null;
  textAnswer?: string | null;
  voiceFileName?: string | null;
  voiceFileUrl?: string | null;
}

export interface OperatorAssignedTemplateQuestionApiResponse extends ScopeApiFields {
  templateQuestionId?: string | number;
  questionId?: string | number;
  questionBranchId?: string | number | null;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | number | null;
  typeName?: string | null;
  groupId?: string | number;
  groupBranchId?: string | number | null;
  groupNameEn?: string;
  groupNameAr?: string | null;
  options?: readonly QuestionAnswerOptionApiResponse[];
}

export interface OperatorTemplateResponseApiResponse {
  surveyResponseId?: string | number;
  operatorId?: string | number;
  templateId?: string | number;
  customInputsCount?: number;
  answersCount?: number;
  actualScore?: number | null;
  maxScore?: number | null;
  scorePercentage?: number | null;
  submittedOnUtc?: string;
  customInputs?: readonly OperatorTemplateResponseCustomInputApiResponse[];
}

export interface OperatorTemplateResponseCustomInputApiResponse {
  customInputId?: string | number;
  name?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  stringValue?: string | null;
  integerValue?: number | null;
}
