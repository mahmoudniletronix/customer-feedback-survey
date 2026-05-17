export interface BranchSatisfactionReportQuery {
  from?: string;
  to?: string;
  templateId?: string;
}

export interface BranchSatisfactionReport {
  period: SatisfactionReportPeriod;
  overall: SatisfactionOverall;
  distribution: readonly SatisfactionDistributionItem[];
  byTemplate: readonly SatisfactionByTemplateItem[];
  trend: readonly SatisfactionTrendItem[];
  complaints: SatisfactionComplaints;
}

export interface SatisfactionReportPeriod {
  from: string;
  to: string;
  isDefaultPeriod: boolean;
  periodSource: 'UserProvided' | 'LastSixMonths' | 'TemplateCreatedOn' | string;
}

export interface SatisfactionOverall {
  score: number;
  totalResponses: number;
  scoredResponses: number;
  unscoredResponses: number;
  totalScoredAnswers: number;
  satisfiedResponses: number;
  neutralResponses: number;
  unsatisfiedResponses: number;
  complaintsCount: number;
  voiceAnswersCount: number;
}

export interface SatisfactionDistributionItem {
  value: number;
  labelEn: string;
  labelAr: string;
  count: number;
  percentage: number;
}

export interface SatisfactionByTemplateItem {
  templateId: string;
  templateNameEn: string;
  templateNameAr: string | null;
  score: number;
  responsesCount: number;
  scoredAnswersCount: number;
}

export interface SatisfactionTrendItem {
  date: string;
  score: number;
  responsesCount: number;
}

export interface SatisfactionComplaints {
  count: number;
  percentageOfResponses: number;
}

export interface BranchSatisfactionReportApiResponse {
  period?: Partial<SatisfactionReportPeriod>;
  overall?: Partial<SatisfactionOverall>;
  distribution?: readonly Partial<SatisfactionDistributionItem>[];
  byTemplate?: readonly Partial<SatisfactionByTemplateItem>[];
  trend?: readonly Partial<SatisfactionTrendItem>[];
  complaints?: Partial<SatisfactionComplaints>;
}
