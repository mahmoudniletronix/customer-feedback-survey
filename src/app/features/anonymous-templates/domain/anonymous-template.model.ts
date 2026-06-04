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
  startWith: string | null;
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

export type BranchAnonymousResponsesOrderSort = 'Newest' | 'Oldest' | '';

export interface BranchAnonymousResponsesQuery {
  anonymousTemplateId?: string;
  from?: string;
  to?: string;
  minScorePercentage?: number;
  maxScorePercentage?: number;
  hasComplaint?: boolean;
  hasVoice?: boolean;
  searchText?: string;
  orderSort?: BranchAnonymousResponsesOrderSort;
  pageNumber: number;
  pageSize: number;
}

export interface BranchAnonymousResponsesPageResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: readonly BranchAnonymousResponseListItem[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BranchAnonymousResponseListItem {
  anonymousSurveyResponseId: string;
  anonymousTemplateId: string;
  anonymousTemplateNameEn: string;
  anonymousTemplateNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number | null;
  isScored: boolean;
  hasComplaint: boolean;
  hasVoice: boolean;
  customInputsPreview: readonly BranchAnonymousResponseCustomInputPreview[];
}

export interface BranchAnonymousResponseCustomInputPreview {
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  value: string;
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
  templateNameEn: string;
  templateNameAr: string | null;
  customInputValues: readonly AnonymousTemplateResponseCustomInputValue[];
  answers: readonly AnonymousTemplateResponseAnswer[];
}

export interface AnonymousTemplateResponseCustomInputValue {
  customInputValueId: string;
  anonymousTemplateCustomInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  nameSnapshot: string;
  type: AnonymousTemplateCustomInputType;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
  displayValue: string;
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
  voiceUrl: string | null;
  children: readonly AnonymousTemplateResponseAnswer[];
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
  startWith: string | null;
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
  startWith?: string | null;
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

export interface BranchAnonymousResponsesPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  data?: readonly BranchAnonymousResponseApiResponse[];
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface BranchAnonymousResponseApiResponse {
  anonymousSurveyResponseId?: string | number;
  anonymousTemplateId?: string | number;
  anonymousTemplateNameEn?: string | null;
  anonymousTemplateNameAr?: string | null;
  submittedOnUtc?: string | null;
  scorePercentage?: number | null;
  isScored?: boolean | null;
  hasComplaint?: boolean | null;
  hasVoice?: boolean | null;
  customInputsPreview?: readonly BranchAnonymousResponseCustomInputPreviewApiResponse[];
}

export interface BranchAnonymousResponseCustomInputPreviewApiResponse {
  name?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  value?: string | number | null;
}

export interface AnonymousTemplateResponseApiResponse {
  anonymousSurveyResponseId?: string | number;
  anonymousTemplateId?: string | number;
  templateNameEn?: string | null;
  templateNameAr?: string | null;
  submittedOnUtc?: string | null;
  actualScore?: number | null;
  maxScore?: number | null;
  scorePercentage?: number | null;
  isScored?: boolean;
  answersCount?: number | null;
  customInputValuesCount?: number | null;
  customInputs?: readonly AnonymousTemplateResponseCustomInputValueApiResponse[];
  customInputValues?: readonly AnonymousTemplateResponseCustomInputValueApiResponse[];
  answers?: readonly AnonymousTemplateResponseAnswerApiResponse[];
}

export interface AnonymousTemplateResponseCustomInputValueApiResponse {
  customInputValueId?: string | number;
  anonymousTemplateCustomInputId?: string | number;
  name?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  nameSnapshot?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  stringValue?: string | null;
  integerValue?: number | null;
  value?: string | number | null;
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
  order?: number | null;
  selectedQuestionOptionId?: string | number | null;
  selectedOptionTextEn?: string | null;
  selectedOptionTextAr?: string | null;
  selectedOptionValue?: number | null;
  starRatingValue?: number | null;
  smileValue?: number | null;
  textAnswer?: string | null;
  voiceFileName?: string | null;
  voiceUrl?: string | null;
  children?: readonly AnonymousTemplateResponseAnswerApiResponse[];
  childAnswers?: readonly AnonymousTemplateResponseAnswerApiResponse[];
}

export type AnonymousTemplateDashboardGroupBy = 'Day' | 'Month';
export type AnonymousTemplateDashboardRiskLevel = 'Healthy' | 'MediumRisk' | 'HighRisk';

export interface AnonymousTemplateDashboardQuery {
  from?: string;
  to?: string;
  anonymousTemplateId?: string;
  groupBy?: AnonymousTemplateDashboardGroupBy;
  topQuestionsCount?: number;
  criticalResponsesCount?: number;
  criticalScoreThreshold?: number;
}

export interface AnonymousTemplateDashboardResponse {
  period: AnonymousTemplateDashboardPeriod;
  summary: AnonymousTemplateDashboardSummary;
  satisfactionTrend: readonly AnonymousTemplateDashboardTrendPoint[];
  anonymousTemplatePerformance: readonly AnonymousTemplateDashboardTemplatePerformance[];
  lowestRatedQuestions: readonly AnonymousTemplateDashboardQuestionInsight[];
  customInputSegments: readonly AnonymousTemplateDashboardCustomInputSegment[];
  criticalResponses: readonly AnonymousTemplateDashboardCriticalResponse[];
}

export interface AnonymousTemplateDashboardPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  groupBy: AnonymousTemplateDashboardGroupBy;
}

export interface AnonymousTemplateDashboardSummary {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  totalAnonymousTemplates: number;
  activeAnonymousTemplates: number;
  templatesWithResponsesCount: number;
  totalResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
  averageScorePercentage: number;
  satisfiedResponses: number;
  neutralResponses: number;
  unhappyResponses: number;
  complaintsCount: number;
  voiceAnswersCount: number;
}

export interface AnonymousTemplateDashboardTrendPoint {
  period: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface AnonymousTemplateDashboardTemplatePerformance {
  anonymousTemplateId: string;
  nameEn: string;
  nameAr: string | null;
  scope: number;
  scopeName: string;
  status: number;
  statusName: string;
  isActive: boolean;
  publicUrl: string;
  qrCode: string | null;
  responsesCount: number;
  scoredResponsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  riskLevel: AnonymousTemplateDashboardRiskLevel;
}

export interface AnonymousTemplateDashboardQuestionInsight {
  anonymousTemplateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  anonymousTemplateQuestionId: string;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: number;
  questionTypeName: string;
  answersCount: number;
  averageValue: number;
  averageScorePercentage: number;
}

export interface AnonymousTemplateDashboardCustomInputSegment {
  customInputName: string;
  type: number;
  typeName: string;
  segments: readonly AnonymousTemplateDashboardCustomInputSegmentItem[];
}

export interface AnonymousTemplateDashboardCustomInputSegmentItem {
  value: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface AnonymousTemplateDashboardCriticalResponse {
  anonymousSurveyResponseId: string;
  anonymousTemplateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number;
  complaintText: string | null;
  customInputs: readonly AnonymousTemplateDashboardCriticalCustomInput[];
}

export interface AnonymousTemplateDashboardCriticalCustomInput {
  name: string;
  value: string;
}

export interface AnonymousTemplateDashboardApiResponse {
  period?: {
    from?: string | null;
    to?: string | null;
    isDefaultPeriod?: boolean | null;
    groupBy?: AnonymousTemplateDashboardGroupBy | string | null;
  } | null;
  summary?: Partial<AnonymousTemplateDashboardSummary> | null;
  satisfactionTrend?: readonly Partial<AnonymousTemplateDashboardTrendPoint>[];
  anonymousTemplatePerformance?: readonly Partial<AnonymousTemplateDashboardTemplatePerformance>[];
  lowestRatedQuestions?: readonly Partial<AnonymousTemplateDashboardQuestionInsight>[];
  customInputSegments?: readonly {
    customInputName?: string | null;
    type?: number | null;
    typeName?: string | null;
    segments?: readonly Partial<AnonymousTemplateDashboardCustomInputSegmentItem>[];
  }[];
  criticalResponses?: readonly {
    anonymousSurveyResponseId?: string | number | null;
    anonymousTemplateId?: string | number | null;
    templateNameEn?: string | null;
    templateNameAr?: string | null;
    submittedOnUtc?: string | null;
    scorePercentage?: number | null;
    complaintText?: string | null;
    customInputs?: readonly Partial<AnonymousTemplateDashboardCriticalCustomInput>[];
  }[];
}
