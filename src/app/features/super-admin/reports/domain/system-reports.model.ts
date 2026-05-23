export type SystemReportsGroupBy = 'Day' | 'Month';
export type SystemReportsRiskLevel = 'Healthy' | 'MediumRisk' | 'HighRisk';
export type SystemResponseQuestionType =
  | 'SingleChoice'
  | 'StarRating'
  | 'Smiles'
  | 'Complain'
  | 'Voice';

export interface SystemDashboardQuery {
  from?: string;
  to?: string;
  branchId?: string;
  departmentId?: string;
  groupBy?: SystemReportsGroupBy;
  criticalScoreThreshold?: number;
  criticalResponsesCount?: number;
  topTemplatesCount?: number;
}

export interface SystemResponsesQuery {
  from?: string;
  to?: string;
  branchId?: string;
  departmentId?: string;
  templateId?: string;
  minScorePercentage?: number;
  maxScorePercentage?: number;
  hasComplaint?: boolean;
  hasVoice?: boolean;
  searchText?: string;
  pageNumber: number;
  pageSize: number;
}

export interface SystemDashboardResponse {
  period: SystemDashboardPeriod;
  summary: SystemDashboardSummary;
  satisfactionTrend: readonly SystemTrendPoint[];
  branchPerformance: readonly SystemBranchPerformance[];
  departmentActivity: readonly SystemDepartmentActivity[];
  topTemplates: readonly SystemTemplatePerformance[];
  criticalResponses: readonly SystemCriticalResponse[];
}

export interface SystemDashboardPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  groupBy: SystemReportsGroupBy;
}

export interface SystemDashboardSummary {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  totalDepartments: number;
  activeDepartments: number;
  totalOperators: number;
  totalTemplates: number;
  activeTemplates: number;
  totalResponses: number;
  averageScorePercentage: number;
  complaintsCount: number;
  voiceAnswersCount: number;
}

export interface SystemTrendPoint {
  period: string;
  responsesCount: number;
  averageScorePercentage: number;
}

export interface SystemBranchPerformance {
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  responsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  voiceAnswersCount: number;
  activeTemplatesCount: number;
  riskLevel: SystemReportsRiskLevel;
}

export interface SystemDepartmentActivity {
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string | null;
  operatorsCount: number;
  responsesCount: number;
  lastResponseDate: string | null;
}

export interface SystemTemplatePerformance {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  responsesCount: number;
  averageScorePercentage: number;
  complaintsCount: number;
  riskLevel: SystemReportsRiskLevel;
}

export interface SystemCriticalResponse {
  surveyResponseId: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string | null;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  scorePercentage: number;
  complaintText: string | null;
  customInputs: readonly SystemResponseCustomInputPreview[];
}

export interface SystemResponsesPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: readonly SystemResponseListItem[];
}

export interface SystemResponseListItem {
  surveyResponseId: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string | null;
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
  customInputsPreview: readonly SystemResponseCustomInputPreview[];
}

export interface SystemResponseCustomInputPreview {
  name: string;
  value: string;
}

export interface SystemResponseDetails {
  surveyResponseId: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string | null;
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  operatorId: string;
  operatorNameEn: string;
  operatorNameAr: string | null;
  submittedOnUtc: string;
  score: SystemResponseScore;
  customInputsCount: number;
  answersCount: number;
  customInputs: readonly SystemResponseCustomInput[];
  answers: readonly SystemResponseAnswer[];
}

export interface SystemResponseScore {
  actualScore: number;
  maxScore: number;
  scorePercentage: number;
  isScored: boolean;
}

export interface SystemResponseCustomInput {
  customInputId: string;
  name: string;
  type: 'String' | 'Integer' | string;
  typeName: string;
  stringValue: string | null;
  integerValue: number | null;
  displayValue: string;
}

export interface SystemResponseAnswer {
  templateQuestionId: string;
  questionId: string;
  questionTextEn: string;
  questionTextAr: string | null;
  questionType: SystemResponseQuestionType;
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
  children: readonly SystemResponseAnswer[];
}

export interface ReportBranchOption {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
}

export interface ReportDepartmentOption {
  id: string;
  nameEn: string;
  nameAr: string;
}
