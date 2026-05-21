import { Language } from '../../../../core/services/i18n.service';

export type BranchTemplatesPdfReportTemplateKind = 'Normal' | 'Anonymous';
export type BranchTemplatesPdfReportScoreCalculationMode =
  | 'RootQuestions'
  | 'LowestConditionLevel';

export interface BranchTemplatesPdfReportQuery {
  fromDate: string;
  toDate: string;
  templateId?: string;
  templateKind?: BranchTemplatesPdfReportTemplateKind;
  scoreCalculationMode?: BranchTemplatesPdfReportScoreCalculationMode;
}

export interface BranchTemplatesPdfReportTemplateOption {
  id: string;
  kind: BranchTemplatesPdfReportTemplateKind;
  nameEn: string;
  nameAr: string | null;
}

export interface BranchTemplatesPdfReportDownloadRequest {
  query: BranchTemplatesPdfReportQuery;
  language: Language;
}
