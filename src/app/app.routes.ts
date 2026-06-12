import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'athletes',
    loadChildren: () =>
      import('./features/athletes/athletes.routes').then((m) => m.ATHLETES_ROUTES),
  },
  {
    path: '',
    redirectTo: 'athletes',
    pathMatch: 'full',
  },
];
