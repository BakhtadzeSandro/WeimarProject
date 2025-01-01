import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { OrderComponent } from './pages/order/order.component';
import { OrdersSummaryComponent } from './pages/orders-summary/orders-summary.component';
import { anonymGuard } from './guards/anonym.guard';
import { authGuard } from './guards/auth.guard';
import { AllOrdersComponent } from './pages/all-orders/all-orders.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [anonymGuard],
  },
  {
    path: 'order',
    component: OrderComponent,
    canActivate: [authGuard],
  },
  {
    path: 'all-order',
    component: AllOrdersComponent,
    canActivate: [authGuard],
  },
  {
    path: 'orders-summary',
    component: OrdersSummaryComponent,
    canActivate: [authGuard],
  },
];
