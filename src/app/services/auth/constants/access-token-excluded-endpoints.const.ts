import { environment } from '../../../../environments/environment';

export const ACCESS_TOKEN_EXCLUDED_ENDPOINTS = [
  `${environment.apiUrl}/auth`,
  `${environment.apiUrl}/users`,
];
