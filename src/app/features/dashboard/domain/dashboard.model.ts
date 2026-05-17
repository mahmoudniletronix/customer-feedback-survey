export type KpiIcon = 'branches' | 'admins' | 'response' | 'departments' | 'surveys' | 'nps' | 'questions' | 'feedback';

export interface Kpi {
  labelKey: string;
  value: string;
  deltaKey: string;
  tone: 'primary' | 'accent' | 'neutral';
  icon: KpiIcon;
}

export interface TrendPoint {
  label: string;
  value: number;
}
