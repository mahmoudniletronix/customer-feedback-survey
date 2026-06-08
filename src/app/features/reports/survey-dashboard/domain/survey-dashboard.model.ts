import {
  QuestionAnswerOption,
  QuestionAnswerTypeInput,
} from '../../../../shared/models/question-answer.model';
import { QuestionCondition } from '../../../../shared/models/question-condition.model';

export type SurveyDashboardSource = 'All' | 'Internal' | 'Anonymous';
export type SurveyDashboardGroupBy = 'Day' | 'Month';
export type SurveyDashboardRiskLevel = 'Healthy' | 'MediumRisk' | 'HighRisk' | string;
export type SurveyDashboardTemplateKind = 'Authorized' | 'Anonymous';
export type SurveyDashboardTemplateDashboardSource = 'Internal' | 'Anonymous';

export interface SurveyDashboardQuery {
  branchId?: string;
  source?: SurveyDashboardSource;
  templateId?: string;
  anonymousTemplateId?: string;
  from?: string;
  to?: string;
  groupBy?: SurveyDashboardGroupBy;
  topQuestionsCount?: number;
  criticalResponsesCount?: number;
  criticalScoreThreshold?: number;
}

export interface SurveyDashboardTemplatesSelectionQuery {
  branchId?: string;
  searchText?: string;
  templateKind?: SurveyDashboardTemplateKind;
}

export interface SurveyDashboardNavigation {
  routeType: string;
  method: string;
  path: string;
}

export interface SurveyDashboardResponse {
  period: SurveyDashboardPeriod;
  scope: SurveyDashboardScope;
  filters: SurveyDashboardAppliedFilters;
  appliedFilters: SurveyDashboardAppliedFilters;
  summary: SurveyDashboardSummary;
  sourceBreakdown: SurveyDashboardSourceBreakdown;
  branchesSummary: readonly SurveyDashboardBranchSummary[];
  satisfactionTrend: readonly SurveyDashboardTrendPoint[];
  templatePerformance: readonly SurveyDashboardTemplatePerformance[];
  lowestRatedQuestions: readonly SurveyDashboardLowestRatedQuestion[];
  customInputSegments: readonly SurveyDashboardCustomInputSegment[];
  criticalResponses: readonly SurveyDashboardCriticalResponse[];
}

export interface SurveyDashboardPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  groupBy: SurveyDashboardGroupBy;
}

export interface SurveyDashboardScope {
  actorScope: string;
  dataScope: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
}

export interface SurveyDashboardAppliedFilters {
  source: SurveyDashboardSource;
  branchId: string | null;
  templateId: string | null;
  anonymousTemplateId: string | null;
  templateKind: SurveyDashboardTemplateKind | null;
  from: string | null;
  to: string | null;
  groupBy: SurveyDashboardGroupBy;
  topQuestionsCount: number;
  criticalResponsesCount: number;
  criticalScoreThreshold: number;
}

export interface SurveyDashboardSummary {
  totalResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
  internalResponses: number;
  anonymousResponses: number;
  internalScoredResponses: number;
  anonymousScoredResponses: number;
  averageScorePercentage: number | null;
  satisfiedResponses: number;
  neutralResponses: number;
  unhappyResponses: number;
  complaintsCount: number;
  voiceAnswersCount: number;
  activeInternalTemplatesCount: number;
  activeAnonymousTemplatesCount: number;
  templatesWithResponsesCount: number;
  branchesCount: number;
  branchesWithResponsesCount: number;
}

export interface SurveyDashboardSourceBreakdown {
  internal: SurveyDashboardSourceMetrics;
  anonymous: SurveyDashboardSourceMetrics;
}

export interface SurveyDashboardSourceMetrics {
  responsesCount: number;
  scoredResponsesCount: number;
  averageScorePercentage: number | null;
  satisfiedResponses: number;
  neutralResponses: number;
  unhappyResponses: number;
  complaintsCount: number;
  voiceAnswersCount: number;
}

export interface SurveyDashboardBranchSummary {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  totalResponses: number;
  internalResponses: number;
  anonymousResponses: number;
  averageScorePercentage: number | null;
  complaintsCount: number;
  voiceAnswersCount: number;
  detailsNavigation: SurveyDashboardNavigation | null;
}

export interface SurveyDashboardTrendPoint {
  period: string;
  responsesCount: number;
  internalResponses: number;
  anonymousResponses: number;
  averageScorePercentage: number | null;
  internalAverageScorePercentage: number | null;
  anonymousAverageScorePercentage: number | null;
}

export interface SurveyDashboardTemplatePerformance {
  source: SurveyDashboardSource;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  responsesCount: number;
  scoredResponsesCount: number;
  averageScorePercentage: number | null;
  complaintsCount: number;
  voiceAnswersCount: number;
  riskLevel: SurveyDashboardRiskLevel;
  detailsNavigation: SurveyDashboardNavigation | null;
}

export interface SurveyDashboardLowestRatedQuestion {
  source: SurveyDashboardSource;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: string;
  questionTypeName: string;
  answersCount: number;
  averageValue: number | null;
  averageScorePercentage: number | null;
  detailsNavigation: SurveyDashboardNavigation | null;
}

export interface SurveyDashboardCustomInputSegment {
  source: SurveyDashboardSource;
  customInputName: string;
  labelEn: string | null;
  labelAr: string | null;
  type: string;
  typeName: string;
  segments: readonly SurveyDashboardCustomInputSegmentValue[];
}

export interface SurveyDashboardCustomInputSegmentValue {
  value: string;
  responsesCount: number;
  internalResponses: number;
  anonymousResponses: number;
  averageScorePercentage: number | null;
  detailsNavigation: SurveyDashboardNavigation | null;
}

export interface SurveyDashboardCriticalResponse {
  source: SurveyDashboardSource;
  responseId: string;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number | null;
  complaintText: string | null;
  hasComplaint: boolean;
  hasVoice: boolean;
  operatorId: string | null;
  operatorNameEn: string | null;
  operatorNameAr: string | null;
  customInputsPreview: readonly SurveyDashboardCustomInputPreview[];
  detailsNavigation: SurveyDashboardNavigation | null;
}

export interface SurveyDashboardCustomInputPreview {
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  value: string;
}

export interface SurveyDashboardBranchOption {
  id: string;
  nameEn: string;
  nameAr: string | null;
  code: string;
}

export interface SurveyDashboardTemplateOption {
  id: string;
  templateKind: SurveyDashboardTemplateKind;
  dashboardSource: SurveyDashboardTemplateDashboardSource;
  nameEn: string;
  nameAr: string | null;
  displayName: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  branchCode: string;
}

export interface SurveyDashboardTemplateDetails {
  source: SurveyDashboardSource;
  templateId: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  branchCode: string | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  status: string;
  isActive: boolean;
  activeFrom: string;
  expireTo: string | null;
  createdOnUtc: string | null;
  publicUrl: string | null;
  qrCode: string | null;
  questionsCount: number;
  groupsCount: number;
  customInputsCount: number;
  questionConditionsCount: number;
  responsesCount: number | null;
  customInputs: readonly SurveyDashboardTemplateCustomInput[];
  questions: readonly SurveyDashboardTemplateQuestion[];
  questionConditions: readonly QuestionCondition[];
}

export interface SurveyDashboardTemplateCustomInput {
  customInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: string;
  typeName: string;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  order: number;
  isActive: boolean;
}

export interface SurveyDashboardTemplateQuestion {
  templateQuestionId: string;
  questionId: string;
  textEn: string;
  textAr: string | null;
  type: QuestionAnswerTypeInput;
  typeName: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  order: number | null;
  isActive: boolean;
  options: readonly QuestionAnswerOption[];
}
