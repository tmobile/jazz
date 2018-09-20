import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {environment} from '../../environments/environment';
import {routes} from './service.route';
import {AdvancedFilterService} from '../advanced-filter.service';
import {BarGraphComponent} from "../secondary-components/bar-graph/bar-graph.component";
import {AmountComponent} from "../primary-components/amount/amount.component";
import {ServicesComponent} from "../pages/services/services.component";
import {ServicesListComponent} from "../pages/services-list/services-list.component";
import {ServiceLogsComponent} from "../pages/service-logs/service-logs.component";
import {ServiceCostComponent} from "../pages/service-cost/service-cost.component";
import {ServiceAccessControlComponent} from "../pages/service-access-control/service-access-control.component";
import {ServiceDetailComponent} from "../pages/service-detail/service-detail.component";
import {ServiceOverviewComponent} from "../pages/service-overview/service-overview.component";
import {ServiceOverviewMultienvComponent} from "../secondary-components/service-overview-multienv/service-overview-multienv.component";
import {ServiceOverviewNonMultienvComponent} from "../secondary-components/service-overview-non-multienv/service-overview-non-multienv.component";
import {PopoverModule} from "ng2-popover";
import {ChartsModule} from "ng2-charts";
import {DropdownModule} from "ng2-dropdown";
import {DatePickerModule} from "../primary-components/daterange-picker/ng2-datepicker";
import {MomentModule} from "angular2-moment";
import {IonRangeSliderModule} from "ng2-ion-range-slider";
import {SharedModule} from "../shared-module/shared.module";
import {FormsModule} from "@angular/forms";
import {EnvironmentModule} from "../environment-module/environment.module";
import {CommonModule} from "@angular/common";
import {CreateServiceModule} from "../create-service/create-service.module";


@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    PopoverModule,
    ChartsModule,
    DropdownModule,
    DatePickerModule,
    MomentModule,
    IonRangeSliderModule,
    SharedModule,
    FormsModule,
    EnvironmentModule,
    CreateServiceModule
  ],
  providers: [AdvancedFilterService],
  declarations: [
    BarGraphComponent,
    AmountComponent,
    ServicesComponent,
    ServicesListComponent,
    ServiceLogsComponent,
    ServiceCostComponent,
    ServiceAccessControlComponent,
    ServiceDetailComponent,
    ServiceOverviewComponent,
    ServiceOverviewMultienvComponent,
    ServiceOverviewNonMultienvComponent,
    ServiceOverviewComponent,
  ],

})
export class ServiceModule {
  constructor() {
  }
}
