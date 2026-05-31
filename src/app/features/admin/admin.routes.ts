import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'products', loadComponent: () => import('./product-crud/product-crud.component').then(m => m.ProductCrudComponent) },
      { path: 'categories', loadComponent: () => import('./category-management/category-management.component').then(m => m.CategoryManagementComponent) },
      { path: 'orders', loadComponent: () => import('./order-management/order-management.component').then(m => m.OrderManagementComponent) },
      { path: 'banners', loadComponent: () => import('./banner-management/banner-management.component').then(m => m.BannerManagementComponent) },
      { path: 'newsletter', loadComponent: () => import('./newsletter-page/newsletter-page.component').then(m => m.NewsletterPageComponent) },
      { path: 'promo-codes', loadComponent: () => import('./promo-code-management/promo-code-management.component').then(m => m.PromoCodeManagementComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
];
