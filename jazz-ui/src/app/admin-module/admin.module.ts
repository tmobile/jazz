import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {SharedModule} from "../shared-module/shared.module";
import {RouterModule} from "@angular/router";
import {routes} from "./admin.route";
import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import { AdminComponent } from './pages/admin/admin.component';
import {AdminUtilsService} from "./services/admin-utils.service";
import {TJsonViewerModule} from 't-json-viewer';
import { AgmJsonViewerModule } from 'agm-json-viewer';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    TJsonViewerModule,
    AgmJsonViewerModule
  ],
  providers: [
    AdminUtilsService
  ],
  bootstrap: []
})

export class AdminModule {
  constructor() {}
}