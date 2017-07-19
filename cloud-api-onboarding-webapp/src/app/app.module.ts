import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { APP_INITIALIZER } from '@angular/core';

import {MomentModule} from 'angular2-moment';
import { DatePickerModule } from './primary-components/daterange-picker/ng2-datepicker';

import {ToasterModule } from 'angular2-toaster';

import { RouterModule, Routes } from '@angular/router';
import { AuthenticationService, RouteGuard } from './core/services';
import { SharedService } from "./SharedService.service";
import { CronParserService } from './core/helpers';
import { DropdownModule } from "ng2-dropdown";
import { AppComponent } from './app.component';
import { ConfigService, ConfigLoader } from './app.config';
import * as $ from 'jquery';

import { BtnTmobilePrimaryComponent } from './primary-components/btn-tmobile-primary/btn-tmobile-primary.component';
import { BtnTmobileSecondaryComponent } from './primary-components/btn-tmobile-secondary/btn-tmobile-secondary.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ServicesComponent } from './pages/services/services.component';
import { TmobileTableComponent } from './secondary-components/tmobile-table/tmobile-table.component';
import { SideTileFixedComponent } from './secondary-components/side-tile-fixed/side-tile-fixed.component';
import { DropdownComponent } from './primary-components/dropdown/dropdown.component';
import { MyFilterPipe } from './primary-components/custom-filter';
import { TabsComponent } from './primary-components/tabs/tabs.component';
import { CreateServiceComponent } from './secondary-components/create-service/create-service.component';
import { OnlyNumber } from './secondary-components/create-service/onlyNumbers';
import { SidebarComponent } from './secondary-components/sidebar/sidebar.component';
import { TmobileHeaderComponent } from './secondary-components/tmobile-header/tmobile-header.component';
import { ClickOutsideDirective } from './secondary-components/tmobile-header/outside-click';
import { LoginComponent } from './pages/login/login.component';
import { ServiceOverviewComponent } from './pages/service-overview/service-overview.component';
import { InputComponent } from './primary-components/input/input.component';
import { BtnPrimaryWithIconComponent } from './primary-components/btn-primary-with-icon/btn-primary-with-icon.component';
import { ServicesListComponent } from './pages/services-list/services-list.component';
import { NavigationBarComponent } from './secondary-components/navigation-bar/navigation-bar.component';
import { ServiceLogsComponent } from './pages/service-logs/service-logs.component';
import { ServiceDetailComponent } from './pages/service-detail/service-detail.component';
import { ServiceAccessControlComponent } from './pages/service-access-control/service-access-control.component';
import { EnvironmentDetailComponent } from './pages/environment-detail/environment-detail.component';
import { EnvAssetsSectionComponent } from './pages/environment-detail/env-assets-section.component';
import { EnvLogsSectionComponent } from './pages/environment-detail/env-logs-section.component';
import { EnvDetailsSectionComponent } from './pages/environment-detail/env-details-section.component';
import { ServiceCostComponent } from './pages/service-cost/service-cost.component';
import { AmountComponent } from './primary-components/amount/amount.component';
import { FiltersComponent } from './secondary-components/filters/filters.component';
import { TableTemplateComponent } from './secondary-components/table-template/table-template.component';
import { SearchBoxComponent } from './primary-components/search-box/search-box.component';

import { DaterangePickerComponent } from './primary-components/daterange-picker/daterange-picker.component';
import { MobileSecondaryTabComponent } from './secondary-components/mobile-secondary-tab/mobile-secondary-tab.component';
import { TmobileMobHeaderComponent } from './secondary-components/tmobile-mob-header/tmobile-mob-header.component';

import { LineGraphComponent } from './secondary-components/line-graph/line-graph.component';
import { ServiceMetricsComponent } from './pages/service-metrics/service-metrics.component';

import { TmobileToasterComponent } from './secondary-components/tmobile-toaster/tmobile-toaster.component';

const appRoutes: Routes = [
  {
    path: 'landing',
    component: LandingComponent
  },
  {
    path: 'services',
    component: ServicesComponent,
    children: [
      {
        path: '',
        component: ServicesListComponent,
        canActivate: [RouteGuard]
      },
      {
        path: ':id',
        component: ServiceDetailComponent,
        canActivate: [RouteGuard]
      },
      {
        path: ':id/:env',
        component: EnvironmentDetailComponent,
        canActivate: [RouteGuard]
      }
    ]
  },
  { path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  }
];


@NgModule({
  declarations: [
    AppComponent,
    BtnTmobilePrimaryComponent,
    BtnTmobileSecondaryComponent,
    LandingComponent,
    TmobileHeaderComponent,
    ServicesComponent,
    TmobileTableComponent,
    SideTileFixedComponent,
    DropdownComponent,
    TabsComponent,
    CreateServiceComponent,
    SidebarComponent,
    LoginComponent,
    ServiceOverviewComponent,
    InputComponent,
    MyFilterPipe,
    BtnPrimaryWithIconComponent,
    ServicesListComponent,
    NavigationBarComponent,
    OnlyNumber,
    ServiceLogsComponent,
    ServiceDetailComponent,
    ClickOutsideDirective,
    ServiceAccessControlComponent,
    EnvironmentDetailComponent,
    EnvAssetsSectionComponent,
    EnvLogsSectionComponent,
    EnvDetailsSectionComponent,
    ServiceCostComponent,
    AmountComponent,
    FiltersComponent,
    TableTemplateComponent,
    SearchBoxComponent,
    LineGraphComponent,
    ServiceMetricsComponent,
    MobileSecondaryTabComponent,
    TmobileMobHeaderComponent,
    TmobileToasterComponent,
    DaterangePickerComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    FormsModule,
    DropdownModule,
    HttpModule,
    DatePickerModule,
    MomentModule,
    ToasterModule
  ],
  providers: [
    AuthenticationService,
    CronParserService,
    SharedService,
    RouteGuard,
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [ConfigService],
      multi:true
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }

// platformBrowserDynamic().bootstrapModule(AppModule);
