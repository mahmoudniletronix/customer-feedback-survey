export interface BranchContext {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
}

export interface BranchContextApiResponse {
  id?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  branchName?: string;
  branchNameEn?: string;
  branchNameAr?: string | null;
  code?: string;
  branchCode?: string;
  branch?: BranchContextApiResponse | null;
  templates?: readonly BranchContextApiResponse[];
}
