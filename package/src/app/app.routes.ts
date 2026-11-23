import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { APP_FEATURE_ROUTE_DEFINITIONS, AppFeatureRouteDefinition } from './core/routing/app-feature.routes';
import { guestGuard } from './guards/guest.guard';
import { homeRedirectGuard } from './guards/home-redirect.guard';
import { roleGuard } from './guards/role.guard';

function toFeatureRoutes(layout: 'full' | 'blank'): Routes {
  return APP_FEATURE_ROUTE_DEFINITIONS
    .filter((definition: AppFeatureRouteDefinition) => (definition.layout ?? 'full') === layout)
    .map((definition) => ({
      path: definition.path,
      canActivate: [roleGuard],
      data: {
        title: definition.title,
        roles: definition.roles,
      },
      loadComponent: definition.loadComponent,
    }));
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [homeRedirectGuard],
    loadComponent: () => import('./shared/page/route-placeholder.component').then((m) => m.RoutePlaceholderComponent),
  },
  {
    path: 'authentication',
    component: BlankComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AuthenticationRoutes),
  },
  {
    path: 'card/register',
    pathMatch: 'full',
    redirectTo: 'authentication/register',
  },
  {
    path: '',
    component: BlankComponent,
    children: toFeatureRoutes('blank'),
  },
  {
    path: '',
    component: FullComponent,
    children: toFeatureRoutes('full'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
