
import { UserRole } from '../../../../shared/enums/user-role.enum';

export interface AddUserDto {
  name: string;
  email: string;
  cpf?: string;
  password: string;
  role: UserRole;
}
