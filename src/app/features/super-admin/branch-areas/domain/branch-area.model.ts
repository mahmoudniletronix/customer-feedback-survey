export type BranchAreaOrderSort = 'Newest' | 'Oldest';

export interface BranchAreaListQuery {
  searchText: string;
  pageNumber: number;
  pageSize: number;
  orderSort: BranchAreaOrderSort;
}

export interface BranchAreaBranch {
  id: string;
  nameEn: string;
  nameAr: string | null;
  code: string;
}

export interface BranchAreaListItem {
  branchAreaId: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string | null;
  userName: string;
  email: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdOnUtc: string;
  branches: readonly BranchAreaBranch[];
}

export interface BranchAreaDetails extends BranchAreaListItem {}

export interface CreateBranchAreaPayload {
  nameEn: string;
  nameAr: string | null;
  userName: string;
  email: string;
  phoneNumber: string | null;
  password: string;
  branchIds: readonly string[];
}

export interface UpdateBranchAreaPayload {
  nameEn: string;
  nameAr: string | null;
  email: string;
  phoneNumber: string | null;
}

export interface AssignBranchAreaBranchesPayload {
  branchIds: readonly string[];
}

export interface AssignBranchAreaBranchesResult {
  branchAreaId: string;
  branches: readonly BranchAreaBranch[];
}

export interface DeactivateBranchAreaResult {
  branchAreaId: string;
  applicationUserId: string;
  isActive: boolean;
}

export interface RestoreBranchAreaResult extends DeactivateBranchAreaResult {}

export interface BranchAreasPageResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: readonly BranchAreaListItem[];
}

export interface BranchAreasPageApiResponse {
  currentPage?: number | null;
  pageSize?: number | null;
  totalPages?: number | null;
  totalItems?: number | null;
  hasPreviousPage?: boolean | null;
  hasNextPage?: boolean | null;
  data?: readonly BranchAreaListItemApiResponse[];
}

export interface BranchAreaListItemApiResponse {
  branchAreaId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string | null;
  nameAr?: string | null;
  userName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean | null;
  createdOnUtc?: string | null;
  branches?: readonly BranchAreaBranchApiResponse[];
}

export interface BranchAreaDetailsApiResponse extends BranchAreaListItemApiResponse {}

export interface CreateBranchAreaApiResponse extends BranchAreaListItemApiResponse {}

export interface UpdateBranchAreaApiResponse extends BranchAreaListItemApiResponse {}

export interface AssignBranchAreaBranchesApiResponse {
  branchAreaId?: string | number;
  branches?: readonly BranchAreaBranchApiResponse[];
}

export interface DeactivateBranchAreaApiResponse {
  branchAreaId?: string | number;
  applicationUserId?: string | number;
  isActive?: boolean | null;
}

export interface RestoreBranchAreaApiResponse extends DeactivateBranchAreaApiResponse {}

export interface BranchAreaBranchApiResponse {
  id?: string | number;
  branchId?: string | number;
  nameEn?: string | null;
  nameAr?: string | null;
  branchNameEn?: string | null;
  branchNameAr?: string | null;
  code?: string | null;
  branchCode?: string | null;
}
