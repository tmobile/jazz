import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {RouteGuard} from "../core/services";
import {Routes} from "@angular/router";


export const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent
  }
];