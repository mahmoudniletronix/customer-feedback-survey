import {
  EditableScopeApiFields,
  EditableScopeState,
  SelectableScopeApiFields,
  SelectableScopeState,
} from '../../../../shared/models/resource-scope.model';

export interface GlobalQuestionGroupListItem extends EditableScopeState {
  groupId: string;
  branchId: null;
  nameEn: string;
  nameAr: string | null;
  isActive: boolean;
  questionsCount: number;
  createdOnUtc: string;
}

export interface GlobalQuestionGroupSelectionItem extends SelectableScopeState {
  groupId: string;
  branchId: null;
  nameEn: string;
  nameAr: string | null;
}

export interface GlobalQuestionGroupsFilter {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  orderSort: string;
  isActive: boolean | null;
}

export interface UpdateGlobalQuestionGroupRequest {
  nameEn: string;
  nameAr?: string | null;
}

export interface CreateGlobalQuestionGroupRequest extends UpdateGlobalQuestionGroupRequest {}

export interface GlobalQuestionGroupsPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly GlobalQuestionGroupListItem[];
}

export interface GlobalQuestionGroupApiResponse extends EditableScopeApiFields {
  groupId?: string | number;
  branchId?: string | number | null;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  questionsCount?: number;
  createdOnUtc?: string;
}

export interface GlobalQuestionGroupSelectionApiResponse extends SelectableScopeApiFields {
  id?: string | number;
  branchId?: string | number | null;
  nameEn?: string;
  nameAr?: string | null;
}

export interface GlobalQuestionGroupsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  data?: readonly GlobalQuestionGroupApiResponse[];
}
