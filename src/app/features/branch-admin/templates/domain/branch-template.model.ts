import {
  QuestionAnswerOption,
  QuestionAnswerOptionApiResponse,
} from '../../../../shared/models/question-answer.model';
import {
  QuestionCondition,
  QuestionConditionApiResponse,
  UpdateQuestionConditionsPayload,
} from '../../../../shared/models/question-condition.model';
import {
  EditableScopeApiFields,
  EditableScopeState,
  ScopeApiFields,
  ScopeState,
  SelectableEditableScopeApiFields,
  SelectableEditableScopeState,
  SelectableScopeApiFields,
  SelectableScopeState,
} from '../../../../shared/models/resource-scope.model';
import { CreatedByUser, CreatedByUserApiResponse } from '../../../../shared/models/audit.model';

export type BranchTemplateStatus = 'Draft' | 'Published' | 'Archived' | string;

export interface BranchTemplate {
  templateId: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string | null;
  branchCode: string;
  nameEn: string;
  nameAr: string;
  description: string;
  activeFrom: string;
  expireTo: string | null;
  status: BranchTemplateStatus;
  isActive: boolean;
  questionsCount: number;
  groupsCount: number;
  customInputsCount: number;
  createdBy: CreatedByUser | null;
  createdOnUtc: string;
  customInputs: readonly BranchTemplateCustomInput[];
  questions: readonly BranchTemplateDetailsQuestion[];
  questionConditions: readonly QuestionCondition[];
}

export type BranchTemplateCustomInputType = 1 | 2;

export interface BranchTemplateCustomInput {
  customInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: BranchTemplateCustomInputType;
  typeName: string;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  startWith: string | null;
  order: number;
  isActive: boolean;
}

export interface BranchTemplateDetailsQuestion extends EditableScopeState {
  templateQuestionId: string;
  questionId: string;
  questionBranchId: string | null;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  typeName: string;
  isActive: boolean;
  groupId: string;
  groupBranchId: string | null;
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

export interface BranchTemplateQuestionGroupSelection extends SelectableScopeState {
  groupId: string;
  branchId: string | null;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  questions: readonly BranchTemplateQuestionSelectionItem[];
}

export interface BranchTemplateQuestionSelectionItem extends SelectableEditableScopeState {
  questionId: string;
  templateQuestionId: string | null;
  branchId: string | null;
  groupId: string;
  textEn: string;
  textAr: string;
  type: string;
  typeName: string;
  isSelected: boolean;
  isActive: boolean;
  order: number | null;
  options: readonly QuestionAnswerOption[];
}

export interface UpdateBranchTemplateQuestionPayload {
  questionId: string;
  order: number;
}

export interface UpdateBranchTemplateQuestionsPayload {
  questions: readonly UpdateBranchTemplateQuestionPayload[];
}

export type UpdateBranchTemplateQuestionConditionsPayload = UpdateQuestionConditionsPayload;

export interface UpdateBranchTemplateQuestionsResult {
  templateId: string;
  branchId: string;
  questionsCount: number;
  questions: readonly UpdatedBranchTemplateQuestion[];
}

export interface UpdatedBranchTemplateQuestion extends ScopeState {
  templateQuestionId: string;
  questionId: string;
  questionBranchId: string | null;
  groupId: string;
  order: number;
}

export interface CreateBranchTemplatePayload {
  nameEn: string;
  nameAr: string;
  description: string;
  activeFrom: string;
  expireTo: string | null;
  customInputs: readonly CreateBranchTemplateCustomInputPayload[];
}

export interface UpdateBranchTemplatePayload {
  nameEn: string;
  nameAr: string;
  description: string;
  activeFrom: string;
  expireTo: string | null;
  customInputs: readonly UpdateBranchTemplateCustomInputPayload[];
}

export interface CreateBranchTemplateCustomInputPayload {
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: BranchTemplateCustomInputType;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  startWith: string | null;
  order: number;
}

export interface UpdateBranchTemplateCustomInputPayload extends CreateBranchTemplateCustomInputPayload {
  customInputId: string | null;
}

export interface BranchTemplateApiResponse {
  templateId?: string | number;
  branchId?: string | number;
  branchNameEn?: string | null;
  branchNameAr?: string | null;
  branchCode?: string | null;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
  status?: BranchTemplateStatus;
  statusName?: BranchTemplateStatus;
  isActive?: boolean;
  questionsCount?: number;
  customInputsCount?: number;
  summary?: BranchTemplateSummaryApiResponse | null;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string;
  customInputs?: readonly BranchTemplateCustomInputApiResponse[];
  questions?: readonly BranchTemplateDetailsQuestionApiResponse[];
  questionConditions?: readonly QuestionConditionApiResponse[];
}

export interface BranchTemplateCustomInputApiResponse {
  customInputId?: string | number;
  name?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  isRequired?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  startWith?: string | null;
  order?: number | null;
  isActive?: boolean;
}

export interface BranchTemplateSummaryApiResponse {
  questionsCount?: number | null;
  groupsCount?: number | null;
  customInputsCount?: number | null;
}

export interface BranchTemplateDetailsQuestionApiResponse extends EditableScopeApiFields {
  templateQuestionId?: string | number;
  questionId?: string | number;
  questionBranchId?: string | number | null;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | number | null;
  typeName?: string | null;
  isActive?: boolean;
  groupId?: string | number;
  groupBranchId?: string | number | null;
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

export interface BranchTemplateQuestionGroupSelectionApiResponse extends SelectableScopeApiFields {
  groupId?: string | number;
  branchId?: string | number | null;
  nameEn?: string;
  nameAr?: string | null;
  isActive?: boolean;
  questions?: readonly BranchTemplateQuestionSelectionItemApiResponse[];
}

export interface BranchTemplateQuestionSelectionItemApiResponse extends SelectableEditableScopeApiFields {
  questionId?: string | number;
  templateQuestionId?: string | number | null;
  branchId?: string | number | null;
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

export interface UpdatedBranchTemplateQuestionApiResponse extends ScopeApiFields {
  templateQuestionId?: string | number;
  questionId?: string | number;
  questionBranchId?: string | number | null;
  groupId?: string | number;
  order?: number;
}
