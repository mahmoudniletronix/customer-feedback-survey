export type BranchTemplateStatus = 'Draft' | 'Published' | 'Archived' | string;

export interface BranchTemplate {
  templateId: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  status: BranchTemplateStatus;
  isActive: boolean;
  questionsCount: number;
  createdOnUtc: string;
}

export interface BranchTemplatesQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  isActive: boolean | null;
  orderSort: string;
}

export interface BranchTemplatesPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly BranchTemplate[];
}

export interface BranchTemplateSelection {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
}

export interface CreateBranchTemplatePayload {
  nameEn: string;
  nameAr: string;
  description: string;
}

export interface UpdateBranchTemplatePayload extends CreateBranchTemplatePayload {}

export interface BranchTemplateApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  status?: BranchTemplateStatus;
  isActive?: boolean;
  questionsCount?: number;
  createdOnUtc?: string;
}

export interface BranchTemplatesPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly BranchTemplateApiResponse[];
}

export interface BranchTemplateSelectionApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string;
}
