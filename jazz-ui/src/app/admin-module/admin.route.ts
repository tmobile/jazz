import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {RouteGuard} from "../core/services";
import {Routes} from "@angular/router";
import {AdminComponent} from "./pages/admin/admin.component";


export const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'dash',
        component: AdminDashboardComponent
      }
    ]
  }
];