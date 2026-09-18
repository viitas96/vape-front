import { Route } from '@angular/router';
import { NavItem } from '../../layouts/full/sidebar/nav-item/nav-item';

export type AppRole = 'ADMIN' | 'DIRECTOR' | 'SELLER' | 'ACCOUNTANT' | 'OPERATOR' | 'CUSTOMER';

export interface AppFeatureRouteDefinition {
  path: string;
  title: string;
  roles: readonly AppRole[];
  loadComponent: NonNullable<Route['loadComponent']>;
  sidebar?: {
    label: string;
    iconName: string;
    bgcolor: string;
  };
}

export const APP_ROLE_HOME_PATHS: ReadonlyArray<readonly [AppRole, string]> = [
  ['ADMIN', '/products'],
  ['DIRECTOR', '/admin'],
  ['SELLER', '/seller'],
  ['ACCOUNTANT', '/accountant'],
  ['OPERATOR', '/products'],
  ['CUSTOMER', '/customer'],
] as const;

export const APP_FEATURE_ROUTE_DEFINITIONS: readonly AppFeatureRouteDefinition[] = [
  {
    path: 'admin',
    title: 'Admin Dashboard',
    roles: ['ADMIN', 'DIRECTOR'],
    loadComponent: () => import('../../features/dashboard/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'seller',
    title: 'Seller Workspace',
    roles: ['SELLER'],
    loadComponent: () => import('../../features/dashboard/seller/seller-dashboard.component').then((m) => m.SellerDashboardComponent),
  },
  {
    path: 'accountant',
    title: 'Accountant Dashboard',
    roles: ['ACCOUNTANT'],
    loadComponent: () => import('../../features/dashboard/accountant/accountant-dashboard.component').then((m) => m.AccountantDashboardComponent),
  },
  {
    path: 'customer',
    title: 'Customer Dashboard',
    roles: ['CUSTOMER'],
    loadComponent: () => import('../../features/dashboard/customer/customer-dashboard.component').then((m) => m.CustomerDashboardComponent),
  },
  {
    path: 'products',
    title: 'Products',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR', 'SELLER'],
    sidebar: { label: 'Products', iconName: 'package', bgcolor: 'success' },
    loadComponent: () => import('../../features/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'product-gammas',
    title: 'Gammas',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
    sidebar: { label: 'Gammas', iconName: 'tags', bgcolor: 'success' },
    loadComponent: () => import('../../features/product-gammas/product-gammas.component').then((m) => m.ProductGammasComponent),
  },
  {
    path: 'product-group-categories',
    title: 'Categories',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
    sidebar: { label: 'Categories', iconName: 'category', bgcolor: 'primary' },
    loadComponent: () => import('../../features/product-group-categories/product-group-categories.component').then((m) => m.ProductGroupCategoriesComponent),
  },
  {
    path: 'product-groups',
    title: 'Product Groups',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
    sidebar: { label: 'Product Groups', iconName: 'layout-grid', bgcolor: 'warning' },
    loadComponent: () => import('../../features/product-groups/product-groups.component').then((m) => m.ProductGroupsComponent),
  },
  {
    path: 'users',
    title: 'Users',
    roles: ['ADMIN', 'DIRECTOR'],
    sidebar: { label: 'Users', iconName: 'users', bgcolor: 'primary' },
    loadComponent: () => import('../../features/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'orders',
    title: 'Orders',
    roles: ['ADMIN', 'DIRECTOR', 'SELLER', 'ACCOUNTANT'],
    sidebar: { label: 'Orders', iconName: 'shopping-cart', bgcolor: 'error' },
    loadComponent: () => import('../../features/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'settings',
    title: 'Settings',
    roles: ['ADMIN', 'DIRECTOR'],
    sidebar: { label: 'Settings', iconName: 'settings', bgcolor: 'primary' },
    loadComponent: () => import('../../features/settings/settings.component').then((m) => m.SettingsComponent),
  },
] as const;

export function getRoleHomePath(roles: readonly string[]): string {
  for (const [role, path] of APP_ROLE_HOME_PATHS) {
    if (roles.includes(role)) {
      return path;
    }
  }

  return '/products';
}

export function buildSidebarNavItems(roles: readonly string[]): NavItem[] {
  const items = APP_FEATURE_ROUTE_DEFINITIONS
    .filter((route) => route.sidebar && route.roles.some((role) => roles.includes(role)))
    .map((route) => ({
      displayName: route.sidebar!.label,
      iconName: route.sidebar!.iconName,
      route: `/${route.path}`,
      bgcolor: route.sidebar!.bgcolor,
    }));

  return items.length ? [{ navCap: 'Workspace' }, ...items] : [];
}
