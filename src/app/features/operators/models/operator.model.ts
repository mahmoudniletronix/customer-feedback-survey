export interface OperatorListItem {
  operatorId: string;
  applicationUserId: string;
  departmentId: string;
  departmentNameEn: string;
  departmentNameAr: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  createdOnUtc: string;
}

export interface CreateOperatorPayload {
  departmentId?: string;
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface CreateOperatorResponse {
  applicationUserId: string;
  operatorId: string;
  departmentId: string;
  nameEn: string;
  userName: string;
  email: string;
}

export interface UpdateOperatorPayload {
  nameEn: string;
  nameAr: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateOperatorResponse {
  operatorId: string;
  applicationUserId: string;
  departmentId: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phoneNumber: string;
}

export interface OperatorsQuery {
  pageNumber: number;
  pageSize: number;
  searchText: string;
  departmentId: string;
}

export interface OperatorsPageResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  data: readonly OperatorListItem[];
}

export interface OperatorDepartmentSelection {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface OperatorActiveTemplateSelection {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
}

export interface OperatorTemplateQuestionSelectionItem {
  templateQuestionId: string;
  questionId: string;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  isActive: boolean;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
}

export interface OperatorTemplateSelectionItem {
  templateId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
  questionsCount: number;
  questions: readonly OperatorTemplateQuestionSelectionItem[];
}

export interface OperatorTemplatesSelection {
  operatorId: string;
  selectedTemplatesCount: number;
  availableTemplatesCount: number;
  selectedTemplates: readonly OperatorTemplateSelectionItem[];
  availableTemplates: readonly OperatorTemplateSelectionItem[];
}

export interface UpdateOperatorTemplatesPayload {
  templateIds: readonly string[];
}

export interface OperatorApiResponse {
  operatorId?: string | number;
  applicationUserId?: string | number;
  departmentId?: string | number;
  departmentNameEn?: string;
  departmentNameAr?: string | null;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  createdOnUtc?: string;
}

export interface CreateOperatorApiResponse {
  applicationUserId?: string | number;
  operatorId?: string | number;
  departmentId?: string | number;
  nameEn?: string;
  userName?: string;
  email?: string;
}

export interface UpdateOperatorApiResponse {
  operatorId?: string | number;
  applicationUserId?: string | number;
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  email?: string;
  phoneNumber?: string | null;
}

export interface OperatorsPageApiResponse {
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  data?: readonly OperatorApiResponse[];
}

export interface OperatorDepartmentSelectionApiResponse {
  id?: string | number;
  departmentId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
}

export interface OperatorActiveTemplateSelectionApiResponse {
  id?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string | null;
}

export interface OperatorTemplateQuestionSelectionApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string;
  isActive?: boolean;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
}

export interface OperatorTemplateSelectionApiResponse {
  templateId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string | null;
  questionsCount?: number;
  questions?: readonly OperatorTemplateQuestionSelectionApiResponse[];
}

export interface OperatorTemplatesSelectionApiResponse {
  operatorId?: string | number;
  selectedTemplatesCount?: number;
  availableTemplatesCount?: number;
  selectedTemplates?: readonly OperatorTemplateSelectionApiResponse[];
  availableTemplates?: readonly OperatorTemplateSelectionApiResponse[];
}
