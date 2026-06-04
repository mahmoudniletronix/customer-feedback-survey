export const BRANCH_TEMPLATES_PDF_REPORT_TEMPLATE_KINDS = ['Normal', 'Anonymous'] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_SCORE_CALCULATION_MODES = [
  'RootQuestions',
  'LowestConditionLevel',
] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_LANGUAGES = ['Arabic', 'English'] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_MIN_TOP_WORST_QUESTIONS_COUNT = 1;
export const BRANCH_TEMPLATES_PDF_REPORT_MAX_TOP_WORST_QUESTIONS_COUNT = 50;
export const BRANCH_TEMPLATES_PDF_REPORT_MIN_SCORE_PERCENTAGE = 0;
export const BRANCH_TEMPLATES_PDF_REPORT_MAX_SCORE_PERCENTAGE = 100;
export const BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_WORST_QUESTIONS_MAX_SCORE_PERCENTAGE = 40;
export const BRANCH_TEMPLATES_PDF_REPORT_DEFAULT_BEST_QUESTIONS_MIN_SCORE_PERCENTAGE = 70;

export type BranchTemplatesPdfReportTemplateKind =
  (typeof BRANCH_TEMPLATES_PDF_REPORT_TEMPLATE_KINDS)[number];
export type BranchTemplatesPdfReportScoreCalculationMode =
  (typeof BRANCH_TEMPLATES_PDF_REPORT_SCORE_CALCULATION_MODES)[number];
export type BranchTemplatesPdfReportLanguage =
  (typeof BRANCH_TEMPLATES_PDF_REPORT_LANGUAGES)[number];

export interface BranchTemplatesPdfReportQuery {
  fromDate: string;
  toDate: string;
  templateId?: string;
  templateKind?: BranchTemplatesPdfReportTemplateKind;
  scoreCalculationMode?: BranchTemplatesPdfReportScoreCalculationMode;
  topWorstQuestionsCount?: number;
  worstQuestionsMaxScorePercentage?: number;
  bestQuestionsMinScorePercentage?: number;
  language?: BranchTemplatesPdfReportLanguage;
}

export interface BranchTemplatesPdfReportTemplateOption {
  id: string;
  kind: BranchTemplatesPdfReportTemplateKind;
  nameEn: string;
  nameAr: string | null;
}

export interface BranchTemplatesPdfReportDownloadRequest {
  query: BranchTemplatesPdfReportQuery;
}

export interface BranchTemplatesReportPreviewRequest {
  query: BranchTemplatesPdfReportQuery;
}

export type BranchTemplatesReportSection = Readonly<Record<string, unknown>>;

export type BranchTemplatesReportRankedQuestion = Readonly<
  {
    rank?: number;
    templateName?: string;
    questionText?: string;
    questionType?: string;
    totalAnswers?: number;
    averageScoreValue?: number | null;
    satisfactionPercentage?: number | null;
  } & Record<string, unknown>
>;

export interface BranchTemplatesReportPreview {
  language: string;
  direction: 'ltr' | 'rtl' | string;
  branchName: string;
  generatedBy: string;
  generatedAtUtc: string;
  fromDate: string;
  toDate: string;
  selectedTemplateId: string | null;
  selectedTemplateKind: BranchTemplatesPdfReportTemplateKind | null;
  selectedTemplateName: string;
  scoreCalculationMode: BranchTemplatesPdfReportScoreCalculationMode | string;
  topWorstQuestionsCount: number;
  worstQuestionsMaxScorePercentage: number;
  bestQuestionsMinScorePercentage: number;
  executiveSummary: BranchTemplatesReportSection;
  templates: readonly BranchTemplatesReportSection[];
  questions: readonly BranchTemplatesReportSection[];
  worstQuestions: readonly BranchTemplatesReportRankedQuestion[];
  bestQuestions: readonly BranchTemplatesReportRankedQuestion[];
  templateDetails: readonly BranchTemplatesReportSection[];
}
