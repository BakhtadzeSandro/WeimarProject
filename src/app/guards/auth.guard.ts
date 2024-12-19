import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.getCurrentUser().pipe(
    map((user) => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
