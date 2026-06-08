import { Role } from '../../../../shared/models/role.model';

export interface ManagedUser {
  id: string;
  name: string;
  role: Role;
  scope: string;
  status: 'ACTIVE' | 'INVITED';
}

export interface CreateSuperAdminPayload {
  nameEn: string;
  nameAr: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface CreateSuperAdminResponse {
  applicationUserId?: string;
  superAdminId?: string;
  nameEn?: string;
  nameAr?: string | null;
  userName?: string;
  email?: string;
  phoneNumber?: string | null;
  isActive?: boolean;
}
