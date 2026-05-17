import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
} from '../../../../shared/models/question-answer.model';
import {
  QuestionCondition,
  QuestionConditionApiResponse,
  UpdateQuestionConditionsPayload,
} from '../../../../shared/models/question-condition.model';

export type BranchTemplateStatus = 'Draft' | 'Published' | 'Archived' | string;

export interface BranchTemplate {
  templateId: string;
  branchId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  activeFrom: string;
  expireTo: string | null;
  status: BranchTemplateStatus;
  isActive: boolean;
  questionsCount: number;
  createdOnUtc: string;
  questions: readonly BranchTemplateDetailsQuestion[];
  questionConditions: readonly QuestionCondition[];
}

export interface BranchTemplateDetailsQuestion {
  templateQuestionId: string;
  questionId: string;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  typeName: string;
  isActive: boolean;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  options: readonly QuestionAnswerOption[];
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
  activeFrom: string;
  expireTo: string | null;
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
  questionConditions: readonly QuestionCondition[];
}

export interface BranchTemplateQuestionGroupSelection {
  groupId: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  questions: readonly BranchTemplateQuestionSelectionItem[];
}

export interface BranchTemplateQuestionSelectionItem {
  questionId: string;
  templateQuestionId: string | null;
  textEn: string;
  textAr: string;
  type: string;
  typeName: string;
  isSelected: boolean;
  isActive: boolean;
  order: number | null;
  options: readonly QuestionAnswerOption[];
}

export interface UpdateBranchTemplateQuestionsPayload {
  questionIds: readonly string[];
}

export type UpdateBranchTemplateQuestionConditionsPayload = UpdateQuestionConditionsPayload;

export interface UpdateBranchTemplateQuestionsResult {
  templateId: string;
  branchId: string;
  questionsCount: number;
  questions: readonly UpdatedBranchTemplateQuestion[];
}

export interface UpdatedBranchTemplateQuestion {
  templateQuestionId: string;
  questionId: string;
  order: number;
}

export interface CreateBranchTemplatePayload {
  nameEn: string;
  nameAr: string;
  description: string;
  activeFrom: string;
  expireTo: string | null;
}

export interface UpdateBranchTemplatePayload extends CreateBranchTemplatePayload {}

export interface BranchTemplateApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
  status?: BranchTemplateStatus;
  statusName?: BranchTemplateStatus;
  isActive?: boolean;
  questionsCount?: number;
  createdOnUtc?: string;
  questions?: readonly BranchTemplateDetailsQuestionApiResponse[];
  questionConditions?: readonly QuestionConditionApiResponse[];
}

export interface BranchTemplateDetailsQuestionApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | number | null;
  typeName?: string | null;
  isActive?: boolean;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
  options?: readonly QuestionAnswerOptionApiResponse[];
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
  activeFrom?: string | null;
  expireTo?: string | null;
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
  questions?: readonly BranchTemplateQuestionSelectionItemApiResponse[];
  questionConditions?: readonly QuestionConditionApiResponse[];
}

export interface BranchTemplateQuestionGroupSelectionApiResponse {
  groupId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  questions?: readonly BranchTemplateQuestionSelectionItemApiResponse[];
}

export interface BranchTemplateQuestionSelectionItemApiResponse {
  questionId?: string | number;
  templateQuestionId?: string | number | null;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | number | null;
  typeName?: string | null;
  isSelected?: boolean;
  isActive?: boolean;
  order?: number | null;
  options?: readonly QuestionAnswerOptionApiResponse[];
}

export interface UpdateBranchTemplateQuestionsApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  questionsCount?: number;
  questions?: readonly UpdatedBranchTemplateQuestionApiResponse[];
}

export interface UpdatedBranchTemplateQuestionApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  order?: number;
}
