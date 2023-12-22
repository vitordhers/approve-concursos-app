import { Entity } from '../shared/enums/entity.enum';

export class BaseEntity implements BaseEntityInterface {
  createdDateTime: Date;
  updatedDateTime: Date;
  constructor(
    public id: string,
    public entityId: Entity,
    public createdAt: number,
    public updatedAt: number
  ) {
    this.createdDateTime = new Date(this.createdAt);
    this.updatedDateTime = new Date(this.updatedAt);
  }

  get createdDate() {
    return new Date(this.createdAt);
  }

  get updatedDate() {
    return new Date(this.updatedAt);
  }

  get dbId() {
    return `${this.entityId}:${this.id}`;
  }
}

export interface BaseEntityInterface {
  id?: string;
  entityId?: Entity;
  createdAt?: number;
  updatedAt?: number;
}
