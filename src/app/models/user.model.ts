import { Entity } from '../shared/enums/entity.enum';
import { LoginProvider } from '../shared/enums/login-provider.enum';
import { UserRole } from '../shared/enums/user-role.enum';
import { BaseEntity } from './base-entity.model';

export class User extends BaseEntity implements BaseUser {
  constructor(
    id: string,
    entityId: Entity,
    createdAt: number,
    updatedAt: number,
    public name: string,
    public email: string,
    public role: UserRole,
    public loginProviders: LoginProvider[],
    public cpf?: string
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}

export interface BaseUser extends BaseEntity {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  loginProviders: LoginProvider[];
  cpf?: string;
}
