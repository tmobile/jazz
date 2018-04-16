import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {EnvLogsSectionComponent} from '../pages/environment-logs/env-logs-section.component';
import {EnvironmentDetailComponent} from '../pages/environment-detail/environment-detail.component';
import {EnvAssetsSectionComponent} from '../pages/environment-assets/env-assets-section.component';
import {EnvDeploymentsSectionComponent} from '../pages/environment-deployment/env-deployments-section.component';
import {EnvCodequalitySectionComponent} from '../pages/environment-codequality/env-codequality-section.component';
import {EnvOverviewSectionComponent} from '../pages/environment-overview/env-overview-section.component';
import {BrowserModule} from '@angular/platform-browser';
import {PopoverModule} from 'ng2-popover';
import {ChartsModule} from 'ng2-charts';
import {FormsModule} from '@angular/forms';
import {DropdownModule} from 'ng2-dropdown';

// import {ToasterModule} from 'angular2-toaster';
import {DatePickerModule} from '../primary-components/daterange-picker/ng2-datepicker';
import {MomentModule} from 'angular2-moment';
import {IonRangeSliderModule} from 'ng2-ion-range-slider';
import {SharedModule} from '../shared-module/shared.module';
// import {ServiceModule} from '../service-module/service.module';
import {RouterModule} from '@angular/router';
import {routes} from './environment.route';
// import {AdvancedFiltersComponentOSS} from '../secondary-components/advanced-filters/OSS/advanced-filters.component';
// import {AdvancedFiltersComponent} from '../secondary-components/advanced-filters/advanced-filters.component';




@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    DropdownModule,
    DatePickerModule,
    MomentModule,
    // ToasterModule,
    PopoverModule,
    ChartsModule,
    IonRangeSliderModule,
    SharedModule,
 
    // ServiceModule
  ],
  declarations: [
    EnvironmentDetailComponent,
    EnvAssetsSectionComponent,
    EnvDeploymentsSectionComponent,
    EnvCodequalitySectionComponent,
    EnvLogsSectionComponent,
    EnvOverviewSectionComponent,
  ]
    
    // SharedModule
  
})
export class EnvironmentModule { }
