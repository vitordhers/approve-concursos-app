import { Entity } from '../shared/enums/entity.enum';
import { BaseEntity, BaseEntityInterface } from './base-entity.model';

export class Institution extends BaseEntity implements BaseInstitution {
  constructor(
    id: string,
    entityId: Entity,
    createdAt: number,
    updatedAt: number,
    public name: string,
    public img?: string,
    public thumb?: string
  ) {
    super(id, entityId, createdAt, updatedAt);
  }
}

export interface BaseInstitution extends BaseEntityInterface {
  id: string;
  entityId: Entity;
  createdAt: number;
  updatedAt: number;
  name: string;
  img?: string;
  thumb?: string;
}
