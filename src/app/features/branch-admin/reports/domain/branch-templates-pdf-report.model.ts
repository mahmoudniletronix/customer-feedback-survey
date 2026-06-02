export const BRANCH_TEMPLATES_PDF_REPORT_TEMPLATE_KINDS = ['Normal', 'Anonymous'] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_SCORE_CALCULATION_MODES = [
  'RootQuestions',
  'LowestConditionLevel',
] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_LANGUAGES = ['Arabic', 'English'] as const;
export const BRANCH_TEMPLATES_PDF_REPORT_MIN_TOP_WORST_QUESTIONS_COUNT = 1;
export const BRANCH_TEMPLATES_PDF_REPORT_MAX_TOP_WORST_QUESTIONS_COUNT = 50;

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
