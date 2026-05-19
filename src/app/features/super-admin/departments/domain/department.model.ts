import {
  CreatedByUser,
  CreatedByUserApiResponse,
} from '../../../../shared/models/audit.model';

export interface Department {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  createdBy: CreatedByUser | null;
  createdOnUtc: string;
}

export interface CreateDepartmentPayload {
  nameEn: string;
  nameAr: string;
}

export interface UpdateDepartmentPayload {
  nameEn: string;
  nameAr: string;
}

export interface CreateDepartmentApiResponse {
  departmentId: string;
  nameEn: string;
  nameAr?: string | null;
  isActive?: boolean;
}

export interface UpdateDepartmentApiResponse {
  departmentId?: string | number;
  id?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
}

export interface DeleteDepartmentApiResponse {
  departmentId?: string | number;
  id?: string | number;
  isActive?: boolean;
}

export interface DepartmentListQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
}

export interface DepartmentPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly Department[];
}

export interface DepartmentSelection {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface DepartmentDetails {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  createdOnUtc: string;
  summary: DepartmentDetailsSummary;
  departmentAdmins: readonly DepartmentDetailsUser[];
  operators: readonly DepartmentDetailsUser[];
}

export interface DepartmentDetailsSummary {
  departmentAdminsCount: number;
  operatorsCount: number;
}

export interface DepartmentDetailsUser {
  departmentAdminId?: string;
  operatorId?: string;
  applicationUserId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
}

export interface DepartmentApiResponse {
  id?: string | number;
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string;
}

export interface DepartmentPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly DepartmentApiResponse[];
}

export interface DepartmentSelectionApiResponse {
  id?: string | number;
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
}

export interface DepartmentDetailsApiResponse extends DepartmentApiResponse {
  summary?: DepartmentDetailsSummaryApiResponse;
  departmentAdmins?: readonly DepartmentDetailsUserApiResponse[];
  operators?: readonly DepartmentDetailsUserApiResponse[];
}

export interface DepartmentDetailsSummaryApiResponse {
  departmentAdminsCount?: number;
  operatorsCount?: number;
}

export interface DepartmentDetailsUserApiResponse {
  departmentAdminId?: string | number;
  operatorId?: string | number;
  applicationUserId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
}
