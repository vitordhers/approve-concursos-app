import { Entity } from '../shared/enums/entity.enum';
import { BaseEntity, BaseEntityInterface } from './base-entity.model';

export class Board extends BaseEntity implements BaseBoard {
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

export interface BaseBoard extends BaseEntityInterface {
  id: string;
  entityId: Entity;
  createdAt: number;
  updatedAt: number;
  name: string;
  img?: string;
  thumb?: string;
}
