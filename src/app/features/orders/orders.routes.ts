import { Routes } from '@angular/router';

export const ordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../orders/order-list/order-list.component').then(m => m.OrderListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('../../orders/order-details/order-details.component').then(m => m.OrderDetailsComponent),
  },
];