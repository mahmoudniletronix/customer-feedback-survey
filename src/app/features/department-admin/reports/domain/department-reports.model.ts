export type DepartmentReportsGroupBy = 'Day' | 'Month';
export type DepartmentReportsRiskLevel = 'Healthy' | 'MediumRisk' | 'HighRisk';
export type DepartmentReportsOrderSort = 'Newest' | 'Oldest';
export type DepartmentResponseQuestionType =
  | 'SingleChoice'
  | 'StarRating'
  | 'Smiles'
  | 'Complain'
  | 'Voice';

export interface DepartmentDashboardQuery {
  from?: string;
  to?: string;
  templateId?: string;
  groupBy?: DepartmentReportsGroupBy;
  topQuestionsCount?: number;
  criticalResponsesCount?: number;
  criticalScoreThreshold?: number;
}

export interface DepartmentDashboardResponse {
  period: DepartmentDashboardPeriod;
  summary: DepartmentDashboardSummary;
  satisfactionTrend: readonly DepartmentDashboardTrendPoint[];
  operatorPerformance: readonly DepartmentOperatorPerformance[];
  templatePerformance: readonly DepartmentTemplatePerformance[];
  lowestRatedQuestions: readonly DepartmentQuestionInsight[];
  customInputSegments: readonly DepartmentCustomInputSegment[];
  criticalResponses: readonly DepartmentCriticalResponse[];
}

export interface DepartmentDashboardPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  groupBy: DepartmentReportsGroupBy;
}

export interface DepartmentDashboardSummary {
  totalOperators: number;
  activeOperators: number;
  totalAssignedTemplates: number;
  activeAssignedTemplates: number;
  templatesWithResponsesCount: number;
  totalResponses: number;
  averageScorePercentage: number;
  complaintsCount: number;
  voiceAnswersCount: number;
  satisfiedResponses: number;
  neutralResponses: number;
  unhappyResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
}

export interface DepartmentDashboardTrendPoint {
  period: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface DepartmentOperatorPerformance {
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  status: string;
  responsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  voiceAnswersCount: number;
  lastResponseOnUtc: string | null;
  riskLevel: DepartmentReportsRiskLevel;
}

export interface DepartmentTemplatePerformance {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  responsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  riskLevel: DepartmentReportsRiskLevel;
}

export interface DepartmentQuestionInsight {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: string;
  questionTypeName: string;
  answersCount: number;
  averageValue: number;
  averageScorePercentage: number;
}

export interface DepartmentCustomInputSegment {
  customInputName: string;
  type: 'String' | 'Integer' | string;
  typeName: string;
  segments: readonly DepartmentCustomInputSegmentValue[];
}

export interface DepartmentCustomInputSegmentValue {
  value: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface DepartmentCriticalResponse {
  surveyResponseId: string;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  submittedOnUtc: string;
  scorePercentage: number;
  complaintText: string | null;
  customInputs: readonly DepartmentCriticalResponseCustomInput[];
}

export interface DepartmentCriticalResponseCustomInput {
  name: string;
  value: string;
}

export interface DepartmentOperatorResponsesQuery {
  pageNumber: number;
  pageSize: number;
  searchText?: string;
  orderSort?: DepartmentReportsOrderSort;
  from?: string;
  to?: string;
  templateId?: string;
  minScorePercentage?: number;
  maxScorePercentage?: number;
  hasComplaint?: boolean;
  hasVoice?: boolean;
}

export interface DepartmentOperatorResponsesPagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: readonly DepartmentOperatorResponseListItem[];
}

export interface DepartmentOperatorResponseListItem {
  surveyResponseId: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  isScored: boolean;
  hasComplaint: boolean;
  hasVoice: boolean;
  customInputsPreview: readonly DepartmentResponseCustomInputPreview[];
}

export interface DepartmentResponseCustomInputPreview {
  name: string;
  value: string;
}

export interface DepartmentResponseDetails {
  surveyResponseId: string;
  branch: DepartmentResponseBranch;
  template: DepartmentResponseTemplate;
  operator: DepartmentResponseOperator;
  submittedOnUtc: string;
  score: DepartmentResponseScore;
  customInputsCount: number;
  answersCount: number;
  customInputs: readonly DepartmentResponseCustomInput[];
  answers: readonly DepartmentResponseAnswer[];
}

export interface DepartmentResponseBranch {
  branchId: string;
  nameEn: string;
  nameAr: string | null;
  code: string;
}

export interface DepartmentResponseTemplate {
  templateId: string;
  nameEn: string;
  nameAr: string | null;
}

export interface DepartmentResponseOperator {
  operatorId: string;
  nameEn: string;
  nameAr: string | null;
}

export interface DepartmentResponseScore {
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  isScored: boolean;
}

export interface DepartmentResponseCustomInput {
  customInputId: string;
  name: string;
  type: 'String' | 'Integer' | string;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
  displayValue: string;
}

export interface DepartmentResponseAnswer {
  templateQuestionId: string;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: DepartmentResponseQuestionType;
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
  voiceFileUrl: string | null;
  displayValue: string;
  children: readonly DepartmentResponseAnswer[];
}

export interface DepartmentReportTemplateOption {
  id: string;
  nameEn: string;
  nameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
}
