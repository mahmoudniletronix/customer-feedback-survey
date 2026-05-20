export type BranchDashboardGroupBy = 'Day' | 'Month';
export type BranchDashboardRiskLevel = 'Healthy' | 'MediumRisk' | 'HighRisk';
export type BranchSurveyResponseQuestionType =
  | 'SingleChoice'
  | 'StarRating'
  | 'Smiles'
  | 'Complain'
  | 'Voice';

export interface BranchDashboardQuery {
  from?: string;
  to?: string;
  templateId?: string;
  groupBy?: BranchDashboardGroupBy;
  topQuestionsCount?: number;
  criticalResponsesCount?: number;
  criticalScoreThreshold?: number;
}

export interface BranchSurveyResponsesQuery {
  from?: string;
  to?: string;
  templateId?: string;
  minScorePercentage?: number;
  maxScorePercentage?: number;
  hasComplaint?: boolean;
  hasVoice?: boolean;
  searchText?: string;
  pageNumber: number;
  pageSize: number;
}

export interface BranchSurveyResponsesPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: readonly BranchSurveyResponseListItem[];
}

export interface BranchSurveyResponseListItem {
  surveyResponseId: string;
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
  customInputsPreview: readonly BranchSurveyResponseCustomInputPreview[];
}

export interface BranchSurveyResponseCustomInputPreview {
  name: string;
  value: string;
}

export interface BranchDashboardResponse {
  period: BranchDashboardPeriod;
  summary: BranchDashboardSummary;
  satisfactionTrend: readonly BranchDashboardTrendPoint[];
  templatePerformance: readonly BranchDashboardTemplatePerformance[];
  lowestRatedQuestions: readonly BranchDashboardQuestionInsight[];
  customInputSegments: readonly BranchDashboardCustomInputSegment[];
  criticalResponses: readonly BranchDashboardCriticalResponse[];
}

export interface BranchDashboardPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  groupBy: BranchDashboardGroupBy;
}

export interface BranchDashboardSummary {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  totalResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
  averageScorePercentage: number;
  satisfiedResponses: number;
  neutralResponses: number;
  unhappyResponses: number;
  activeTemplatesCount: number;
  templatesWithResponsesCount: number;
  complaintsCount: number;
  voiceAnswersCount: number;
}

export interface BranchDashboardTrendPoint {
  period: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface BranchDashboardTemplatePerformance {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  responsesCount: number;
  scoredResponsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  riskLevel: BranchDashboardRiskLevel;
}

export interface BranchDashboardQuestionInsight {
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

export interface BranchDashboardCustomInputSegment {
  customInputName: string;
  type: 'String' | 'Integer' | string;
  typeName: string;
  segments: readonly BranchDashboardCustomInputSegmentValue[];
}

export interface BranchDashboardCustomInputSegmentValue {
  value: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface BranchDashboardCriticalResponse {
  surveyResponseId: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number;
  complaintText: string | null;
  customInputs: readonly BranchDashboardCriticalResponseCustomInput[];
}

export interface BranchDashboardCriticalResponseCustomInput {
  name: string;
  value: string;
}

export interface BranchSurveyResponseDetails {
  surveyResponseId: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  score: BranchSurveyResponseScore;
  customInputsCount: number;
  answersCount: number;
  customInputs: readonly BranchSurveyResponseCustomInput[];
  answers: readonly BranchSurveyResponseAnswer[];
}

export interface BranchSurveyResponseScore {
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  isScored: boolean;
}

export interface BranchSurveyResponseCustomInput {
  customInputId: string;
  name: string;
  type: 'String' | 'Integer' | string;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
  displayValue: string;
}

export interface BranchSurveyResponseAnswer {
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: BranchSurveyResponseQuestionType;
  questionTypeName: string;
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
}
