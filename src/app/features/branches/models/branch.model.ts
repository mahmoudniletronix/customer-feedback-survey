export interface Branch {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
}

export interface CreateBranchPayload {
  nameEn: string;
  nameAr: string;
  code: string;
  address: string;
}

export interface CreateBranchAdminPayload {
  branchId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface BranchApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string;
  code?: string;
  address?: string;
}
