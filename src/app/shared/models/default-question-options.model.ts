import { AnswerScaleValue } from './question-answer.model';

export interface DefaultQuestionAnswerOption {
  readonly order: number;
  readonly textEn: string;
  readonly textAr: string;
  readonly value: AnswerScaleValue;
}

export const DEFAULT_SINGLE_CHOICE_OPTIONS: readonly DefaultQuestionAnswerOption[] = [
  { order: 1, textEn: 'Excellent', textAr: 'ممتاز', value: 5 },
  { order: 2, textEn: 'Very Good', textAr: 'جيد جدا', value: 4 },
  { order: 3, textEn: 'Good', textAr: 'جيد', value: 3 },
  { order: 4, textEn: 'Accepted', textAr: 'مقبول', value: 2 },
  { order: 5, textEn: 'Worst', textAr: 'ضعيف', value: 1 },
];
