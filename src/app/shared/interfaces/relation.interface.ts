import { Entity } from '../enums/entity.enum';

export interface Relation<T> {
  records: T[];
  entity: Entity;
}
