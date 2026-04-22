import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth-store';

// guard que protege todas las rutas del panel de administracion
// si el admin no esta logueado, redirige al login del admin
// es diferente del authGuard de la web app: este comprueba la sesion de admin,
// no la de usuario normal
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAdminLoggedIn()) {
    return true; // hay sesion de admin activa, puede acceder
  }

  // no hay sesion: mandamos al login del admin (no al del usuario)
  router.navigate(['/login']);
  return false;
};
