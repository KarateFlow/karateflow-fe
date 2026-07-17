import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'athletes',
    loadChildren: () =>
      import('./features/athletes/athletes.routes').then((m) => m.ATHLETES_ROUTES),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./features/tests/feature/templates-list/templates-list.page').then((m) => m.TemplatesListPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/feature/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: '',
    redirectTo: 'athletes',
    pathMatch: 'full',
  },
];
