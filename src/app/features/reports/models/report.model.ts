export type ReportIcon = 'satisfaction' | 'feedback' | 'risk';

export interface ReportSummary {
  id: string;
  titleKey: string;
  metric: string;
  descriptionKey: string;
  icon: ReportIcon;
}
