import { Route } from '@angular/router';
import { NavItem } from '../../layouts/full/sidebar/nav-item/nav-item';

export type AppRole = 'ADMIN' | 'SELLER' | 'ACCOUNTANT' | 'OPERATOR' | 'CUSTOMER';

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
  ['SELLER', '/orders'],
  ['ACCOUNTANT', '/reports'],
  ['OPERATOR', '/products'],
  ['CUSTOMER', '/customer'],
] as const;

export const APP_FEATURE_ROUTE_DEFINITIONS: readonly AppFeatureRouteDefinition[] = [
  {
    path: 'admin',
    title: 'Admin Dashboard',
    roles: ['ADMIN'],
    loadComponent: () => import('../../features/dashboard/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'customer',
    title: 'Customer Dashboard',
    roles: ['CUSTOMER'],
    loadComponent: () => import('../../features/dashboard/customer/customer-dashboard.component').then((m) => m.CustomerDashboardComponent),
  },
  {
    path: 'product-group-categories',
    title: 'Categories',
    roles: ['ADMIN', 'OPERATOR'],
    sidebar: { label: 'Categories', iconName: 'category', bgcolor: 'primary' },
    loadComponent: () => import('../../features/product-group-categories/product-group-categories.component').then((m) => m.ProductGroupCategoriesComponent),
  },
  {
    path: 'product-gammas',
    title: 'Gammas',
    roles: ['ADMIN', 'OPERATOR'],
    sidebar: { label: 'Gammas', iconName: 'tags', bgcolor: 'success' },
    loadComponent: () => import('../../features/product-gammas/product-gammas.component').then((m) => m.ProductGammasComponent),
  },
  {
    path: 'brands',
    title: 'Brands',
    roles: ['ADMIN', 'OPERATOR'],
    sidebar: { label: 'Brands', iconName: 'bookmark', bgcolor: 'primary' },
    loadComponent: () => import('../../features/brands/brands.component').then((m) => m.BrandsComponent),
  },
  {
    path: 'products',
    title: 'Products',
    roles: ['ADMIN', 'OPERATOR', 'SELLER'],
    sidebar: { label: 'Products', iconName: 'package', bgcolor: 'success' },
    loadComponent: () => import('../../features/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'orders',
    title: 'Orders',
    roles: ['ADMIN', 'SELLER', 'ACCOUNTANT'],
    sidebar: { label: 'Orders', iconName: 'shopping-cart', bgcolor: 'error' },
    loadComponent: () => import('../../features/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'seller',
    title: 'POS',
    roles: ['SELLER'],
    sidebar: { label: 'Cash Register', iconName: 'cash-register', bgcolor: 'warning' },
    loadComponent: () => import('../../features/dashboard/seller/seller-dashboard.component').then((m) => m.SellerDashboardComponent),
  },
  {
    path: 'customers',
    title: 'Customers',
    roles: ['ADMIN', 'SELLER'],
    sidebar: { label: 'Customers', iconName: 'user-heart', bgcolor: 'success' },
    loadComponent: () => import('../../features/customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'users',
    title: 'Users',
    roles: ['ADMIN'],
    sidebar: { label: 'Users', iconName: 'users', bgcolor: 'primary' },
    loadComponent: () => import('../../features/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'shifts',
    title: 'Shifts',
    roles: ['ADMIN', 'ACCOUNTANT'],
    sidebar: { label: 'Shifts', iconName: 'report-money', bgcolor: 'warning' },
    loadComponent: () => import('../../features/shifts/shifts.component').then((m) => m.ShiftsComponent),
  },
  {
    path: 'reports',
    title: 'Reports',
    roles: ['ADMIN', 'ACCOUNTANT'],
    sidebar: { label: 'Reports', iconName: 'chart-bar', bgcolor: 'success' },
    loadComponent: () => import('../../features/reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'settings',
    title: 'Settings',
    roles: ['ADMIN'],
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
