import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnvLogsSectionComponent } from '../pages/environment-logs/env-logs-section.component';
import { EnvironmentDetailComponent } from '../pages/environment-detail/environment-detail.component';
import { EnvAssetsSectionComponent } from '../pages/environment-assets/env-assets-section.component';
import { EnvDeploymentsSectionComponent } from '../pages/environment-deployment/env-deployments-section.component';
import { EnvCodequalitySectionComponent } from '../pages/environment-codequality/env-codequality-section.component';
import { EnvOverviewSectionComponent } from '../pages/environment-overview/env-overview-section.component';
import { PopoverModule } from 'ng2-popover';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'ng2-dropdown';
import { DatePickerModule } from '../primary-components/daterange-picker/ng2-datepicker';
import { MomentModule } from 'angular2-moment';
import { IonRangeSliderModule } from 'ng2-ion-range-slider';
import { SharedModule } from '../shared-module/shared.module';
import { RouterModule } from '@angular/router';
import { routes } from './environment.route';
import { AdvancedFilterService } from '../advanced-filter.service';
import {ChartsModule} from "ng2-charts";
import {EnvTryServiceSidebarComponent} from '../secondary-components/env-try-service-sidebar/env-try-service-sidebar.component';
import {SessionStorageService} from "../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../core/helpers/relaxed-json.service";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    DropdownModule,
    DatePickerModule,
    MomentModule,
    PopoverModule,
    ChartsModule,
    IonRangeSliderModule,
    SharedModule,
  ],
  declarations: [
    EnvironmentDetailComponent,
    EnvAssetsSectionComponent,
    EnvDeploymentsSectionComponent,
    EnvCodequalitySectionComponent,
    EnvLogsSectionComponent,
    EnvOverviewSectionComponent,
    EnvTryServiceSidebarComponent
  ],
  providers: [
    AdvancedFilterService,
    SessionStorageService,
    RelaxedJsonService,
  ]
})

export class EnvironmentModule {
  constructor(){
  }
}
