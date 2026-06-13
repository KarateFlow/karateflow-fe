import { Routes } from '@angular/router';

export const ATHLETES_ROUTES: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./feature/athlete-list/athlete-list.page').then((m) => m.AthleteListPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./feature/athlete-create/athlete-create.page').then((m) => m.AthleteCreatePage),
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];
