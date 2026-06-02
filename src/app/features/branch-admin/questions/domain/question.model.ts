import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
  QuestionAnswerOptionPayload,
  QuestionAnswerType,
  UpdateQuestionAnswerOptionPayload,
} from '../../../../shared/models/question-answer.model';
import {
  EditableScopeApiFields,
  EditableScopeState,
} from '../../../../shared/models/resource-scope.model';
import {
  CreatedByUser,
  CreatedByUserApiResponse,
} from '../../../../shared/models/audit.model';

export interface QuestionListItem extends EditableScopeState {
  questionId: string;
  branchId: string | null;
  groupId: string;
  groupBranchId: string | null;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: QuestionAnswerType;
  typeName: string;
  isActive: boolean;
  createdBy: CreatedByUser | null;
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

export interface QuestionApiResponse extends EditableScopeApiFields {
  id?: string | number;
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
  createdBy?: CreatedByUserApiResponse | null;
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
