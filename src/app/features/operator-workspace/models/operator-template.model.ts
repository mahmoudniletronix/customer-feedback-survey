export interface OperatorMyTemplates {
  operatorId: string;
  departmentId: string;
  templatesCount: number;
  templates: readonly OperatorAssignedTemplate[];
}

export interface OperatorAssignedTemplate {
  templateId: string;
  nameEn: string;
  nameAr: string;
  description: string;
  branchId: string;
  branchNameEn: string;
  branchNameAr: string;
  branchCode: string;
  questionsCount: number;
  questions: readonly OperatorAssignedTemplateQuestion[];
}

export interface OperatorAssignedTemplateQuestion {
  templateQuestionId: string;
  questionId: string;
  order: number | null;
  textEn: string;
  textAr: string;
  type: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
}

export interface OperatorMyTemplatesApiResponse {
  operatorId?: string | number;
  departmentId?: string | number;
  templatesCount?: number;
  templates?: readonly OperatorAssignedTemplateApiResponse[];
}

export interface OperatorAssignedTemplateApiResponse {
  templateId?: string | number;
  nameEn?: string;
  nameAr?: string | null;
  description?: string | null;
  branchId?: string | number;
  branchNameEn?: string;
  branchNameAr?: string | null;
  branchCode?: string | null;
  questionsCount?: number;
  questions?: readonly OperatorAssignedTemplateQuestionApiResponse[];
}

export interface OperatorAssignedTemplateQuestionApiResponse {
  templateQuestionId?: string | number;
  questionId?: string | number;
  order?: number | null;
  textEn?: string;
  textAr?: string | null;
  type?: string | null;
  groupId?: string | number;
  groupNameEn?: string;
  groupNameAr?: string | null;
}
