import {
  ScopeApiFields,
  ScopeState,
  SelectableEditableScopeApiFields,
  SelectableEditableScopeState,
} from '../../../shared/models/resource-scope.model';

export type AnonymousTemplateScope = 1 | 2;
export type AnonymousTemplateCustomInputType = 1 | 2;

export interface AnonymousTemplateCustomInput {
  customInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: AnonymousTemplateCustomInputType;
  typeName: string;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  order: number;
  isActive: boolean;
}

export interface AnonymousTemplate extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  activeFrom: string;
  expireTo: string | null;
  status: number | null;
  statusName: string;
  isActive: boolean;
  publicUrl: string;
  qrCode: string | null;
  createdByApplicationUserId: string;
  createdOnUtc: string;
  modifiedOnUtc: string | null;
  summary: AnonymousTemplateSummary;
  questionsCount: number;
  customInputsCount: number;
  questionConditionsCount: number;
  responsesCount: number;
  customInputs: readonly AnonymousTemplateCustomInput[];
  questions: readonly AnonymousTemplateQuestion[];
  questionConditions: readonly AnonymousTemplateQuestionCondition[];
}

export interface AnonymousTemplateSummary {
  questionsCount: number;
  customInputsCount: number;
  questionConditionsCount: number;
}

export interface AnonymousTemplateQuestion extends ScopeState {
  anonymousTemplateQuestionId: string;
  questionId: string;
  branchId: string | null;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  isEditable: boolean;
  textEn: string;
  textAr: string | null;
  type: number | null;
  typeName: string;
  order: number;
  isActive: boolean;
  options: readonly AnonymousTemplateQuestionOption[];
}

export interface AnonymousTemplateQuestionOption {
  optionId: string;
  questionId: string;
  textEn: string;
  textAr: string | null;
  order: number;
  value: number | null;
  isActive: boolean;
}

export interface AnonymousTemplateQuestionsSelection extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  nameEn: string;
  nameAr: string | null;
  selectedQuestionsCount: number;
  questions: readonly AnonymousTemplateQuestionSelectionItem[];
}

export interface AnonymousTemplateQuestionSelectionItem extends SelectableEditableScopeState {
  questionId: string;
  anonymousTemplateQuestionId: string | null;
  branchId: string | null;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  isSelected: boolean;
  selectedOrder: number | null;
  textEn: string;
  textAr: string | null;
  type: number | null;
  typeName: string;
  isActive: boolean;
  options: readonly AnonymousTemplateQuestionOption[];
}

export interface AssignAnonymousTemplateQuestionsPayload {
  questions: readonly AssignAnonymousTemplateQuestionPayload[];
}

export interface AssignAnonymousTemplateQuestionPayload {
  questionId: string;
  order: number;
}

export interface AssignAnonymousTemplateQuestionsResult extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  assignedQuestionsCount: number;
  questions: readonly AnonymousTemplateAssignedQuestion[];
}

export interface AnonymousTemplateAssignedQuestion extends ScopeState {
  anonymousTemplateQuestionId: string;
  questionId: string;
  branchId: string | null;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: number | null;
  typeName: string;
  order: number;
}

export interface AnonymousTemplateQuestionCondition {
  conditionId: string;
  parentAnonymousTemplateQuestionId: string;
  childAnonymousTemplateQuestionId: string;
  triggerType: number | null;
  triggerTypeName: string;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  order: number;
  isActive: boolean;
}

export interface ManageAnonymousTemplateQuestionConditionsPayload {
  conditions: readonly ManageAnonymousTemplateQuestionConditionPayload[];
}

export interface ManageAnonymousTemplateQuestionConditionPayload {
  parentAnonymousTemplateQuestionId: string;
  childAnonymousTemplateQuestionId: string;
  triggerType: number;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  order: number;
}

export interface ManageAnonymousTemplateQuestionConditionsResult extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  conditionsCount: number;
  conditions: readonly AnonymousTemplateQuestionCondition[];
}

export interface AnonymousTemplateListItem extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  activeFrom: string;
  expireTo: string | null;
  status: number | null;
  statusName: string;
  isActive: boolean;
  publicUrl: string;
  qrCode: string | null;
  questionsCount: number;
  customInputsCount: number;
  responsesCount: number;
  createdByApplicationUserId: string;
  createdOnUtc: string;
}

export interface AnonymousTemplateStateChange extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  status: number | null;
  statusName: string;
  isActive: boolean;
}

export interface AnonymousTemplateResponsesListQuery {
  pageNumber: number;
  pageSize: number;
  orderSort: string;
  fromDate: string | null;
  toDate: string | null;
  minScorePercentage: number | null;
  maxScorePercentage: number | null;
}

export interface AnonymousTemplateResponsesPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly AnonymousTemplateResponseListItem[];
}

export interface AnonymousTemplateResponseListItem {
  anonymousSurveyResponseId: string;
  anonymousTemplateId: string;
  submittedOnUtc: string;
  actualScore: number | null;
  maxScore: number | null;
  scorePercentage: number | null;
  isScored: boolean;
  answersCount: number;
  customInputValuesCount: number;
}

export interface AnonymousTemplateResponseDetails extends AnonymousTemplateResponseListItem {
  customInputValues: readonly AnonymousTemplateResponseCustomInputValue[];
  answers: readonly AnonymousTemplateResponseAnswer[];
}

export interface AnonymousTemplateResponseCustomInputValue {
  customInputValueId: string;
  anonymousTemplateCustomInputId: string;
  nameSnapshot: string;
  type: AnonymousTemplateCustomInputType;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
}

export interface AnonymousTemplateResponseAnswer {
  answerId: string;
  anonymousTemplateQuestionId: string;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: number | null;
  questionTypeName: string;
  questionOrder: number;
  selectedQuestionOptionId: string | null;
  selectedOptionTextEn: string | null;
  selectedOptionTextAr: string | null;
  selectedOptionValue: number | null;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string | null;
  voiceFileName: string | null;
}

export interface AnonymousTemplatesListQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  orderSort: string;
  scope: AnonymousTemplateScope | null;
  branchId: string | null;
  isActive: boolean | null;
}

export interface AnonymousTemplatesPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly AnonymousTemplateListItem[];
}

export interface CreateAnonymousTemplatePayload {
  scope: AnonymousTemplateScope | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  activeFrom: string;
  expireTo: string | null;
  customInputs: readonly CreateAnonymousTemplateCustomInputPayload[];
}

export interface CreateAnonymousTemplateCustomInputPayload {
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: AnonymousTemplateCustomInputType;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  order: number;
}

export interface UpdateAnonymousTemplatePayload {
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  activeFrom: string;
  expireTo: string | null;
  customInputs: readonly UpdateAnonymousTemplateCustomInputPayload[];
}

export interface UpdateAnonymousTemplateCustomInputPayload
  extends CreateAnonymousTemplateCustomInputPayload {
  customInputId: string | null;
}

export interface AnonymousTemplateApiResponse extends ScopeApiFields {
  anonymousTemplateId?: string | number;
  branchId?: string | number | null;
  branchNameEn?: string | null;
  branchNameAr?: string | null;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
  status?: number | string | null;
  statusName?: string | null;
  isActive?: boolean;
  publicUrl?: string | null;
  qrCode?: string | null;
  questionsCount?: number | null;
  customInputsCount?: number | null;
  responsesCount?: number | null;
  createdByApplicationUserId?: string | number | null;
  createdOnUtc?: string | null;
  modifiedOnUtc?: string | null;
  summary?: AnonymousTemplateSummaryApiResponse | null;
  customInputs?: readonly AnonymousTemplateCustomInputApiResponse[];
  questions?: readonly AnonymousTemplateQuestionApiResponse[];
  questionConditions?: readonly AnonymousTemplateQuestionConditionApiResponse[];
}

export interface AnonymousTemplatesPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly AnonymousTemplateApiResponse[];
}

export interface AnonymousTemplateSummaryApiResponse {
  questionsCount?: number | null;
  customInputsCount?: number | null;
  questionConditionsCount?: number | null;
}

export interface AnonymousTemplateCustomInputApiResponse {
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
  order?: number | null;
  isActive?: boolean;
}

export interface AnonymousTemplateQuestionApiResponse extends ScopeApiFields {
  anonymousTemplateQuestionId?: string | number;
  questionId?: string | number;
  branchId?: string | number | null;
  groupId?: string | number;
  groupNameEn?: string | null;
  groupNameAr?: string | null;
  isEditable?: boolean;
  textEn?: string | null;
  textAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  order?: number | null;
  isActive?: boolean;
  options?: readonly AnonymousTemplateQuestionOptionApiResponse[];
}

export interface AnonymousTemplateQuestionsSelectionApiResponse extends ScopeApiFields {
  anonymousTemplateId?: string | number;
  branchId?: string | number | null;
  nameEn?: string | null;
  nameAr?: string | null;
  selectedQuestionsCount?: number | null;
  questions?: readonly AnonymousTemplateQuestionSelectionItemApiResponse[];
}

export interface AnonymousTemplateQuestionSelectionItemApiResponse
  extends SelectableEditableScopeApiFields {
  questionId?: string | number;
  anonymousTemplateQuestionId?: string | number | null;
  branchId?: string | number | null;
  groupId?: string | number;
  groupNameEn?: string | null;
  groupNameAr?: string | null;
  isSelected?: boolean;
  selectedOrder?: number | null;
  textEn?: string | null;
  textAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  isActive?: boolean;
  options?: readonly AnonymousTemplateQuestionOptionApiResponse[];
}

export interface AssignAnonymousTemplateQuestionsApiResponse extends ScopeApiFields {
  anonymousTemplateId?: string | number;
  branchId?: string | number | null;
  assignedQuestionsCount?: number | null;
  questions?: readonly AnonymousTemplateAssignedQuestionApiResponse[];
}

export interface AnonymousTemplateAssignedQuestionApiResponse extends ScopeApiFields {
  anonymousTemplateQuestionId?: string | number;
  questionId?: string | number;
  branchId?: string | number | null;
  groupId?: string | number;
  groupNameEn?: string | null;
  groupNameAr?: string | null;
  textEn?: string | null;
  textAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  order?: number | null;
}

export interface AnonymousTemplateQuestionOptionApiResponse {
  optionId?: string | number;
  questionId?: string | number;
  textEn?: string | null;
  textAr?: string | null;
  order?: number | null;
  value?: number | null;
  isActive?: boolean;
}

export interface AnonymousTemplateQuestionConditionApiResponse {
  conditionId?: string | number;
  parentAnonymousTemplateQuestionId?: string | number;
  childAnonymousTemplateQuestionId?: string | number;
  triggerType?: number | string | null;
  triggerTypeName?: string | null;
  selectedQuestionOptionId?: string | number | null;
  triggerValue?: number | null;
  order?: number | null;
  isActive?: boolean;
}

export interface ManageAnonymousTemplateQuestionConditionsApiResponse extends ScopeApiFields {
  anonymousTemplateId?: string | number;
  branchId?: string | number | null;
  conditionsCount?: number | null;
  conditions?: readonly AnonymousTemplateQuestionConditionApiResponse[];
}

export interface AnonymousTemplateResponsesPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly AnonymousTemplateResponseApiResponse[];
}

export interface AnonymousTemplateResponseApiResponse {
  anonymousSurveyResponseId?: string | number;
  anonymousTemplateId?: string | number;
  submittedOnUtc?: string | null;
  actualScore?: number | null;
  maxScore?: number | null;
  scorePercentage?: number | null;
  isScored?: boolean;
  answersCount?: number | null;
  customInputValuesCount?: number | null;
  customInputValues?: readonly AnonymousTemplateResponseCustomInputValueApiResponse[];
  answers?: readonly AnonymousTemplateResponseAnswerApiResponse[];
}

export interface AnonymousTemplateResponseCustomInputValueApiResponse {
  customInputValueId?: string | number;
  anonymousTemplateCustomInputId?: string | number;
  nameSnapshot?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  stringValue?: string | null;
  integerValue?: number | null;
}

export interface AnonymousTemplateResponseAnswerApiResponse {
  answerId?: string | number;
  anonymousTemplateQuestionId?: string | number;
  questionId?: string | number;
  questionTextEn?: string | null;
  questionTextAr?: string | null;
  questionType?: number | string | null;
  questionTypeName?: string | null;
  questionOrder?: number | null;
  selectedQuestionOptionId?: string | number | null;
  selectedOptionTextEn?: string | null;
  selectedOptionTextAr?: string | null;
  selectedOptionValue?: number | null;
  starRatingValue?: number | null;
  smileValue?: number | null;
  textAnswer?: string | null;
  voiceFileName?: string | null;
}
