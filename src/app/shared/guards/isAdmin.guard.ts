import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { UserRole } from '../enums/user-role.enum';

export const isAdminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.user$.pipe(
    map((currentUser) => {
      if (!currentUser) {
        router.navigate(['/home']);
        return false;
      }
      if (currentUser.role !== UserRole.ADMIN) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    })
  );
};
