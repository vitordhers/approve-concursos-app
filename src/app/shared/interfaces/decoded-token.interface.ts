import { JwtPayload } from 'jwt-decode';
import { UserRole } from '../enums/user-role.enum';

export interface DecodedJwt extends JwtPayload {
  exp: number;
  iat: number;
  id: string;
  role: UserRole;
}
