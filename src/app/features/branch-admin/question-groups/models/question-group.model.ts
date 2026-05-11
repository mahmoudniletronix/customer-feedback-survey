export interface QuestionGroupListItem {
  groupId: string;
  branchId: string;
  nameEn: string;
  nameAr: string | null;
  isActive: boolean;
  questionsCount: number;
  createdOnUtc: string;
}

export interface QuestionGroupSelectionItem {
  id: string;
  nameEn: string;
  nameAr: string | null;
}

export interface CreateQuestionGroupRequest {
  nameEn: string;
  nameAr?: string | null;
}

export interface UpdateQuestionGroupRequest {
  nameEn: string;
  nameAr?: string | null;
}

export interface QuestionGroupsFilter {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  orderSort: string;
  isActive: boolean | null;
}

export interface QuestionGroupsPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly QuestionGroupListItem[];
}

export interface QuestionGroupApiResponse {
  groupId?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  questionsCount?: number;
  createdOnUtc?: string;
}

export interface QuestionGroupSelectionApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string | null;
}

export interface QuestionGroupsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  data?: readonly QuestionGroupApiResponse[];
}
