import { Routes } from '@angular/router';

export const ATHLETES_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./feature/athlete-create/athlete-create.page').then((m) => m.AthleteCreatePage),
  },
  {
    path: '',
    redirectTo: 'new',
    pathMatch: 'full',
  },
];
