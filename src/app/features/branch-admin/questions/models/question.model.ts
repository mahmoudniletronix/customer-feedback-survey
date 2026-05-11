export interface QuestionListItem {
  questionId: string;
  branchId: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: number;
  typeName: string;
  isActive: boolean;
  createdOnUtc: string;
}

export interface CreateQuestionRequest {
  groupId: string;
  textEn: string;
  textAr?: string | null;
  type: number;
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {}

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
  value: number;
  label: string;
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
}

export interface QuestionsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  data?: readonly QuestionApiResponse[];
}
