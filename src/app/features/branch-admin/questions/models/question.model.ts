import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
  QuestionAnswerOptionPayload,
  QuestionAnswerType,
  UpdateQuestionAnswerOptionPayload,
} from '../../../../shared/models/question-answer.model';

export interface QuestionListItem {
  questionId: string;
  branchId: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: QuestionAnswerType;
  typeName: string;
  isActive: boolean;
  createdOnUtc: string;
  options: readonly QuestionAnswerOption[];
}

export interface CreateQuestionRequest {
  groupId: string;
  textEn: string;
  textAr?: string | null;
  type: QuestionAnswerType;
  options: readonly QuestionAnswerOptionPayload[];
}

export interface UpdateQuestionRequest extends Omit<CreateQuestionRequest, 'options'> {
  options: readonly UpdateQuestionAnswerOptionPayload[];
}

export interface QuestionsFilter {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  orderSort: string;
  isActive: boolean | null;
}

export interface QuestionsPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly QuestionListItem[];
}

export interface QuestionTypeOption {
  value: QuestionAnswerType;
  labelKey: string;
}

export interface QuestionApiResponse {
  questionId?: string | number;
  branchId?: string | number;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
  textEn?: string;
  textAr?: string | null;
  type?: number;
  typeName?: string | null;
  isActive?: boolean;
  createdOnUtc?: string;
  options?: readonly QuestionAnswerOptionApiResponse[];
}

export interface QuestionsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  data?: readonly QuestionApiResponse[];
}
