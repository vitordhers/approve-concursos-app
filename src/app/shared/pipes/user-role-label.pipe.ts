import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../enums/user-role.enum';
import { USER_ROLES_WITH_LABELS } from '../config/user-roles-with-labels.const';

@Pipe({
  name: 'userRoleLabel',
  standalone: true,
  pure: true,
})
export class UserRoleLabelPipe implements PipeTransform {
  transform(userRole: UserRole): string {
    return USER_ROLES_WITH_LABELS[userRole].label;
  }
}
