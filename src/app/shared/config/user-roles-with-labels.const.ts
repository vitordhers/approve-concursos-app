import { UserRole } from '../enums/user-role.enum';

export const USER_ROLES_WITH_LABELS = [
  {
    label: 'Usuário não verificado',
    value: UserRole.NON_VALIDATED_USER,
  },
  {
    label: 'Usuário verificado',
    value: UserRole.VALIDATED_USER,
  },
  {
    label: 'Usuário Pagante',
    value: UserRole.PAID_USER,
  },
  {
    label: 'Admin',
    value: UserRole.ADMIN,
  },
];
