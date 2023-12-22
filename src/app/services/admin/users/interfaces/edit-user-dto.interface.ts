
import { UserRole } from '../../../../shared/enums/user-role.enum';

export interface EditUserDto {
  name: string;
  email: string;
  cpf?: string;
  password?: string;
  role: UserRole;
}
