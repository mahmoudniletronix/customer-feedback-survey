import { CreatedByUser, CreatedByUserApiResponse } from '../../../../shared/models/audit.model';

export type SuperAdminTemplateKind = 'Authorized' | 'Anonymous';
export type SuperAdminTemplateCatalogKind = SuperAdminTemplateKind | 'AuthorizeAndAnonymous';

export interface SuperAdminTemplatesQuery {
  pageNumber: number;
  pageSize: number;
  branchId: string;
  templateKind: SuperAdminTemplateCatalogKind | '';
  isActive: boolean | null;
  searchText: string;
  orderSort: string;
}

export interface SuperAdminTemplateListItem {
  templateId: string;
  branchId: string;
  branchNameEn: string | null;
  branchNameAr: string | null;
  templateKind: SuperAdminTemplateKind;
  templateKindName: string;
  nameEn: string | null;
  nameAr: string | null;
  description: string | null;
  status: string;
  statusName: string;
  isActive: boolean;
  questionsCount: number;
  customInputsCount: number;
  publicUrl: string | null;
  qrCode: string | null;
  createdByApplicationUserId: string | null;
  createdBy: CreatedByUser | null;
  createdOnUtc: string | null;
  activeFrom: string | null;
  expireTo: string | null;
}

export interface SuperAdminTemplatesPageResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: readonly SuperAdminTemplateListItem[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CopySuperAdminTemplateToBranchPayload {
  templateId: string;
  branchId: string;
}

export interface SuperAdminTemplateCopyResult {
  templateId: string;
  branchId: string;
  templateKind: SuperAdminTemplateKind;
  templateKindName: string;
  nameEn: string | null;
  nameAr: string | null;
  publicUrl: string | null;
  qrCode: string | null;
}

export interface SuperAdminTemplateApiResponse {
  templateId?: string | null;
  branchId?: string | null;
  branchNameEn?: string | null;
  branchNameAr?: string | null;
  templateKind?: string | null;
  templateKindName?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  description?: string | null;
  status?: string | null;
  statusName?: string | null;
  isActive?: boolean | null;
  questionsCount?: number | null;
  customInputsCount?: number | null;
  publicUrl?: string | null;
  qrCode?: string | null;
  createdByApplicationUserId?: string | null;
  createdBy?: CreatedByUserApiResponse | null;
  createdOnUtc?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
}

export interface SuperAdminTemplateCopyApiResponse {
  id?: string | number | null;
  templateId?: string | number | null;
  newTemplateId?: string | number | null;
  copiedTemplateId?: string | number | null;
  branchTemplateId?: string | number | null;
  anonymousTemplateId?: string | number | null;
  branchId?: string | number | null;
  templateKind?: string | number | null;
  templateKindName?: string | null;
  kind?: string | number | null;
  nameEn?: string | null;
  nameAr?: string | null;
  publicUrl?: string | null;
  qrCode?: string | null;
}

export interface SuperAdminTemplatesPageApiResponse {
  currentPage?: number | null;
  pageSize?: number | null;
  totalPages?: number | null;
  totalItems?: number | null;
  data?: readonly SuperAdminTemplateApiResponse[] | null;
  hasPreviousPage?: boolean | null;
  hasNextPage?: boolean | null;
}
