export interface CreateDepartmentAdminPayload {
  departmentId: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface CreateDepartmentAdminResponse {
  applicationUserId: string;
  departmentAdminId: string;
  departmentId: string;
  nameEn: string;
  userName: string;
  email: string;
}
