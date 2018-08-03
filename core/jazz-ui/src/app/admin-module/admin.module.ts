
import {SharedModule} from "../shared-module/shared.module";
import {RouterModule} from "@angular/router";
import {routes} from "./admin.route";
import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {JsonViewerComponent} from "../primary-components/json-viewer/json-viewer.component";
import {AdminComponent} from '../pages/admin/admin.component';
import {AdminUtilsService} from '../core/services/admin-utils.service';
import {AdminDashboardComponent} from '../pages/admin-dashboard/admin-dashboard.component';

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
  ]
})

export class AdminModule {
  constructor() {}
}
