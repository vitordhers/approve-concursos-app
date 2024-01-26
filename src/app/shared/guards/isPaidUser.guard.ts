import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { inject } from '@angular/core';
import { UserRole } from '../enums/user-role.enum';
import { cloneDeep } from 'lodash';
import { map } from 'rxjs';

export const isPaidUserGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.user$.pipe(
    map((currentUser) => {
      if (!currentUser) {
        router.navigate(['/home']);
        return false;
      }

      if (!userService.isPaidUser()) {
        router.navigate(['/painel'], { fragment: 'desempenho' });
        return false;
      }
      return true;
    })
  );
};
