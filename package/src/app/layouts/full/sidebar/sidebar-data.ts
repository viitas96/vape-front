import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Management',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR', 'SELLER', 'ACCOUNTANT'],
  },
  {
    displayName: 'Products',
    iconName: 'package',
    route: '/products',
    bgcolor: 'success',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR', 'SELLER'],
  },
  {
    displayName: 'Gammas',
    iconName: 'tags',
    route: '/product-gammas',
    bgcolor: 'success',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
  },
  {
    displayName: 'Categories',
    iconName: 'category',
    route: '/product-group-categories',
    bgcolor: 'primary',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
  },
  {
    displayName: 'Product Groups',
    iconName: 'layout-grid',
    route: '/product-groups',
    bgcolor: 'warning',
    roles: ['ADMIN', 'DIRECTOR', 'OPERATOR'],
  },
  {
    displayName: 'Users',
    iconName: 'users',
    route: '/users',
    bgcolor: 'primary',
    roles: ['ADMIN', 'DIRECTOR'],
  },
  {
    displayName: 'Orders',
    iconName: 'shopping-cart',
    route: '/orders',
    bgcolor: 'error',
    roles: ['ADMIN', 'DIRECTOR', 'SELLER', 'ACCOUNTANT'],
  },
  {
    displayName: 'Settings',
    iconName: 'settings',
    route: '/settings',
    bgcolor: 'primary',
    roles: ['ADMIN', 'DIRECTOR'],
  },
];
