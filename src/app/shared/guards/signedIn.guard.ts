import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { inject } from '@angular/core';

export const signedInGuard: CanActivateFn = (route, state) => {
  if (!inject(UserService).isLoggedIn()) {
    inject(Router).navigate(['/home']);
    return false;
  }
  return true;
};
