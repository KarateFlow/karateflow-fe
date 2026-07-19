import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
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
        loadComponent: () =>
          import('./features/dashboard/feature/dashboard.page').then((m) => m.DashboardPage),
        pathMatch: 'full',
      },
    ]
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/ui/not-found.page').then((m) => m.NotFoundPageComponent),
  },
];
