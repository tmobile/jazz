import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {routes} from './service.route';
import {AdvancedFilterService} from '../advanced-filter.service';
import {CreateServiceComponent} from '../secondary-components/create-service/oss/create-service.component';
import {ServiceOverviewComponent} from '../pages/service-overview/service-overview.component';
import {BarGraphComponent} from '../secondary-components/bar-graph/bar-graph.component';
import {AmountComponent} from '../primary-components/amount/amount.component';
import {ServicesComponent} from '../pages/services/services.component';
import {ServicesListComponent} from '../pages/services-list/services-list.component';
import {ServiceLogsComponent} from '../pages/service-logs/service-logs.component';
import {ServiceCostComponent} from '../pages/service-cost/service-cost.component';
import {ServiceAccessControlComponent} from '../pages/service-access-control/service-access-control.component';
import {ServiceDetailComponent} from '../pages/service-detail/service-detail.component';
import {ServiceOverviewMultienvComponent} from '../secondary-components/service-overview-multienv/service-overview-multienv.component';
import {ServiceOverviewNonMultienvComponent} from '../secondary-components/service-overview-non-multienv/service-overview-non-multienv.component';
import {CommonModule} from '@angular/common';
import {PopoverModule} from 'ngx-popover';
import {ChartsModule} from 'ng2-charts';
import {DropdownModule} from 'ngx-dropdown';
import {DatePickerModule} from '../primary-components/daterange-picker/ng2-datepicker';
import {MomentModule} from 'angular2-moment';
import {SharedModule} from '../shared-module/shared.module';
import {FormsModule} from '@angular/forms';
import {EnvironmentModule } from '../environment-module/environment.module';
import {JazzMobHeaderModule} from '../secondary-components/jazz-mob-header/jazz-mob-header.module';

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    PopoverModule,
    ChartsModule,
    DropdownModule,
    DatePickerModule,
    MomentModule,
    SharedModule,
    FormsModule,
    EnvironmentModule,
    JazzMobHeaderModule,

  ],
  providers:[AdvancedFilterService],
  declarations: [
    CreateServiceComponent,
    BarGraphComponent,
    AmountComponent,
    ServicesComponent,
    ServicesListComponent,
    ServiceOverviewComponent,
    ServiceLogsComponent,
    ServiceCostComponent,
    ServiceAccessControlComponent,
    ServiceDetailComponent,
    ServiceOverviewMultienvComponent,
    ServiceOverviewNonMultienvComponent,
  ],
  exports: [
    CreateServiceComponent,
    BarGraphComponent,
    AmountComponent,
    ServicesComponent,
    ServicesListComponent,
    ServiceOverviewComponent,
    ServiceLogsComponent,
    ServiceCostComponent,
    ServiceAccessControlComponent,
    ServiceDetailComponent,
    ServiceOverviewMultienvComponent,
    ServiceOverviewNonMultienvComponent,
  ]
})
export class ServiceModule {
  constructor(){
  }
}
