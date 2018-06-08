import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {SharedModule} from "../shared-module/shared.module";
import {RouterModule} from "@angular/router";
import {routes} from "./admin.route";
import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import { AdminComponent } from './pages/admin/admin.component';
import {AdminUtilsService} from "./services/admin-utils.service";
import {JsonViewerComponent} from "../primary-components/json-viewer/json-viewer.component";

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminComponent,
    JsonViewerComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  providers: [
    AdminUtilsService
  ],
  bootstrap: []
})

export class AdminModule {
  constructor() {}
}
