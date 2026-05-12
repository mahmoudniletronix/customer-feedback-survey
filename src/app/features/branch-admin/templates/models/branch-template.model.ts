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

export interface BranchTemplateQuestionSelection {
  templateId: string;
  branchId: string;
  templateNameEn: string;
  templateNameAr: string;
  status: BranchTemplateStatus;
  isActive: boolean;
  groups: readonly BranchTemplateQuestionGroupSelection[];
}

export interface BranchTemplateQuestionGroupSelection {
  groupId: string;
  nameEn: string;
  nameAr: string;
  questions: readonly BranchTemplateQuestionSelectionItem[];
}

export interface BranchTemplateQuestionSelectionItem {
  questionId: string;
  textEn: string;
  textAr: string;
  type: string;
  isSelected: boolean;
  order: number | null;
}

export interface UpdateBranchTemplateQuestionsPayload {
  questionIds: readonly string[];
}

export interface UpdateBranchTemplateQuestionsResult {
  templateId: string;
  branchId: string;
  questionsCount: number;
  questions: readonly UpdatedBranchTemplateQuestion[];
}

export interface UpdatedBranchTemplateQuestion {
  questionId: string;
  order: number;
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

export interface BranchTemplateQuestionSelectionApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  templateNameEn?: string;
  templateNameAr?: string | null;
  status?: BranchTemplateStatus;
  isActive?: boolean;
  groups?: readonly BranchTemplateQuestionGroupSelectionApiResponse[];
}

export interface BranchTemplateQuestionGroupSelectionApiResponse {
  groupId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  questions?: readonly BranchTemplateQuestionSelectionItemApiResponse[];
}

export interface BranchTemplateQuestionSelectionItemApiResponse {
  questionId?: string | number;
  textEn?: string;
  textAr?: string | null;
  type?: string | number | null;
  isSelected?: boolean;
  order?: number | null;
}

export interface UpdateBranchTemplateQuestionsApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  questionsCount?: number;
  questions?: readonly UpdatedBranchTemplateQuestionApiResponse[];
}

export interface UpdatedBranchTemplateQuestionApiResponse {
  questionId?: string | number;
  order?: number;
}
