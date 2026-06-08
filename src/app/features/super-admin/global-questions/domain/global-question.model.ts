import {
  AnswerScaleValue,
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
} from '../../../../shared/models/question-answer.model';
import {
  EditableScopeApiFields,
  EditableScopeState,
} from '../../../../shared/models/resource-scope.model';

export const GLOBAL_QUESTION_TYPE = {
  SingleChoice: 1,
  StarRating: 2,
  Smiles: 3,
  Complain: 4,
  Voice: 5,
  Image: 6,
} as const;

export type GlobalQuestionType = (typeof GLOBAL_QUESTION_TYPE)[keyof typeof GLOBAL_QUESTION_TYPE];

export interface GlobalQuestionTypeOption {
  value: GlobalQuestionType;
  labelKey: string;
}

export const GLOBAL_QUESTION_TYPE_OPTIONS: readonly GlobalQuestionTypeOption[] = [
  {
    value: GLOBAL_QUESTION_TYPE.SingleChoice,
    labelKey: 'questions.typeSingleChoice',
  },
  {
    value: GLOBAL_QUESTION_TYPE.StarRating,
    labelKey: 'questions.typeStarRating',
  },
  {
    value: GLOBAL_QUESTION_TYPE.Smiles,
    labelKey: 'questions.typeSmiles',
  },
  {
    value: GLOBAL_QUESTION_TYPE.Complain,
    labelKey: 'questions.typeComplain',
  },
  {
    value: GLOBAL_QUESTION_TYPE.Voice,
    labelKey: 'questions.typeVoice',
  },
  {
    value: GLOBAL_QUESTION_TYPE.Image,
    labelKey: 'questions.typeImage',
  },
];

export interface GlobalQuestionOptionPayload {
  textEn: string;
  textAr?: string | null;
  order: number;
  value: AnswerScaleValue;
}

export interface UpdateGlobalQuestionOptionPayload extends GlobalQuestionOptionPayload {
  optionId?: string | null;
}

export interface CreateGlobalQuestionRequest {
  groupId: string;
  textEn: string;
  textAr?: string | null;
  type: GlobalQuestionType;
  options: readonly GlobalQuestionOptionPayload[];
}

export interface UpdateGlobalQuestionRequest extends Omit<CreateGlobalQuestionRequest, 'options'> {
  options: readonly UpdateGlobalQuestionOptionPayload[];
}

export interface GlobalQuestionListItem extends EditableScopeState {
  questionId: string;
  branchId: null;
  groupId: string;
  groupBranchId: null;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: GlobalQuestionType;
  typeName: string;
  isActive: boolean;
  createdOnUtc: string;
  options: readonly QuestionAnswerOption[];
}

export interface GlobalQuestionsFilter {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  groupId: string;
  orderSort: string;
  isActive: boolean | null;
}

export interface GlobalQuestionsPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly GlobalQuestionListItem[];
}

export interface GlobalQuestionApiResponse extends EditableScopeApiFields {
  questionId?: string | number;
  branchId?: string | number | null;
  groupId?: string | number;
  groupBranchId?: string | number | null;
  groupNameEn?: string;
  groupNameAr?: string | null;
  textEn?: string;
  textAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  isActive?: boolean;
  createdOnUtc?: string;
  options?: readonly QuestionAnswerOptionApiResponse[];
}

export interface GlobalQuestionsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  data?: readonly GlobalQuestionApiResponse[];
}

export function toGlobalQuestionType(
  value: string | number | null | undefined,
): GlobalQuestionType | null {
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isInteger(numericValue)) {
      return toGlobalQuestionType(numericValue);
    }

    const normalized = value.replace(/[\s_-]/g, '').toLowerCase();
    if (normalized === 'singlechoice' || normalized === 'multichoice' || normalized === 'multiplechoice') {
      return GLOBAL_QUESTION_TYPE.SingleChoice;
    }
    if (normalized === 'starrating' || normalized === 'rating') {
      return GLOBAL_QUESTION_TYPE.StarRating;
    }
    if (normalized === 'smiles' || normalized === 'smile') {
      return GLOBAL_QUESTION_TYPE.Smiles;
    }
    if (
      normalized === 'complain' ||
      normalized === 'complaint' ||
      normalized === 'freetext' ||
      normalized === 'textarea'
    ) {
      return GLOBAL_QUESTION_TYPE.Complain;
    }
    if (normalized === 'voice') {
      return GLOBAL_QUESTION_TYPE.Voice;
    }
    if (normalized === 'image' || normalized === 'photo' || normalized === 'picture') {
      return GLOBAL_QUESTION_TYPE.Image;
    }

    return null;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;

  if (
    numericValue === GLOBAL_QUESTION_TYPE.SingleChoice ||
    numericValue === GLOBAL_QUESTION_TYPE.StarRating ||
    numericValue === GLOBAL_QUESTION_TYPE.Smiles ||
    numericValue === GLOBAL_QUESTION_TYPE.Complain ||
    numericValue === GLOBAL_QUESTION_TYPE.Voice ||
    numericValue === GLOBAL_QUESTION_TYPE.Image
  ) {
    return numericValue;
  }

  return null;
}
