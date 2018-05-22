import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {SharedModule} from "../shared-module/shared.module";
import {FormsModule} from "@angular/forms";
import {DropdownModule} from "ng2-dropdown";
import {RouterModule} from "@angular/router";
import {routes} from "./admin.route";
import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";

@NgModule({
  declarations: [
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    DropdownModule
  ],
  providers: [],
  bootstrap: []
})

export class AdminModule {
  constructor() {}
}