import { Role } from '../../../../shared/models/role.model';

export interface ManagedUser {
  id: string;
  name: string;
  role: Role;
  scope: string;
  status: 'ACTIVE' | 'INVITED';
}
