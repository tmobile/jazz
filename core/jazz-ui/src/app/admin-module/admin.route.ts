import {Routes} from "@angular/router";
import {AdminComponent} from '../pages/admin/admin.component';
import {AdminDashboardComponent} from '../pages/admin-dashboard/admin-dashboard.component';



export const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'dash',
        pathMatch: 'full'
      },
      {
        path: 'dash',
        component: AdminDashboardComponent
      }
    ]
  }
];
