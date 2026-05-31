import { Routes } from '@angular/router';

export const sellerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./seller-layout/seller-layout.component').then(m => m.SellerLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./product-inventory/product-inventory.component').then(m => m.ProductInventoryComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./order-processing/order-processing.component').then(m => m.OrderProcessingComponent),
      },
      {
        path: 'earnings',
        loadComponent: () => import('./earnings/earnings.component').then(m => m.EarningsComponent),
      },
      {
        path: 'setup',
        loadComponent: () => import('./seller-onboarding/seller-onboarding.component').then(m => m.SellerOnboardingComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
