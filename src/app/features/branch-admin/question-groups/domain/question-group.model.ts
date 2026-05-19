import {
  EditableScopeApiFields,
  EditableScopeState,
  SelectableScopeApiFields,
  SelectableScopeState,
} from '../../../../shared/models/resource-scope.model';
import {
  CreatedByUser,
  CreatedByUserApiResponse,
} from '../../../../shared/models/audit.model';

export interface QuestionGroupListItem extends EditableScopeState {
  groupId: string;
  branchId: string | null;
  nameEn: string;
  nameAr: string | null;
  isActive: boolean;
  questionsCount: number;
  createdBy: CreatedByUser | null;
  createdOnUtc: string;
}

export interface QuestionGroupSelectionItem extends SelectableScopeState {
  id: string;
  branchId: string | null;
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

export interface QuestionGroupApiResponse extends EditableScopeApiFields {
  groupId?: string | number;
  branchId?: string | number | null;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  questionsCount?: number;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string;
}

export interface QuestionGroupSelectionApiResponse extends SelectableScopeApiFields {
  id?: string | number;
  branchId?: string | number | null;
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
