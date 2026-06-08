export interface UpdateBranchAdminPayload {
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
}

export interface BranchAdminStateChangeResult {
  branchAdminId: string;
  applicationUserId: string;
  isActive: boolean;
}

export interface BranchAdminStateChangeApiResponse {
  branchAdminId?: string | number;
  applicationUserId?: string | number;
  isActive?: boolean | null;
}

