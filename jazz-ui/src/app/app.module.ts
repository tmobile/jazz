import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { APP_INITIALIZER } from '@angular/core';

import {MomentModule} from 'angular2-moment';
import { DatePickerModule } from 'ng2-datepicker';
import { ChartsModule } from 'ng2-charts';

import {ToasterModule } from 'angular2-toaster';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';

import { RouterModule, Routes } from '@angular/router';
import { AuthenticationService, RouteGuard, DataCacheService, RequestService, MessageService } from './core/services';
import { SharedService } from "./SharedService.service";
import { CronParserService } from './core/helpers';
import { DropdownModule } from "ng2-dropdown";
import { PopoverModule } from 'ng2-popover';
import { AppComponent } from './app.component';
import { ConfigService, ConfigLoader } from './app.config';
import { IonRangeSliderModule } from 'ng2-ion-range-slider';
import * as $ from 'jquery';

import { BtnJazzPrimaryComponent } from './primary-components/btn-jazz-primary/btn-jazz-primary.component';
import { BtnJazzSecondaryComponent } from './primary-components/btn-jazz-secondary/btn-jazz-secondary.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ServicesComponent } from './pages/services/services.component';
import { JazzTableComponent } from './secondary-components/jazz-table/jazz-table.component';
import { SideTileFixedComponent } from './secondary-components/side-tile-fixed/side-tile-fixed.component';
import { DropdownComponent } from './primary-components/dropdown/dropdown.component';
import { MyFilterPipe } from './primary-components/custom-filter';
import { TabsComponent } from './primary-components/tabs/tabs.component';
import { FocusDirective} from './secondary-components/create-service/focus.directive';
import { CreateServiceComponent } from './secondary-components/create-service/create-service.component';
import { OnlyNumber } from './secondary-components/create-service/onlyNumbers';
import { SidebarComponent } from './secondary-components/sidebar/sidebar.component';
import { JazzHeaderComponent } from './secondary-components/jazz-header/jazz-header.component';
import { ClickOutsideDirective } from './secondary-components/jazz-header/outside-click';
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
import { EnvDeploymentsSectionComponent } from './pages/environment-detail/env-deployments-section.component';
import { EnvCodequalitySectionComponent } from './pages/environment-detail/env-codequality-section.component';
import { EnvLogsSectionComponent } from './pages/environment-detail/env-logs-section.component';
import { EnvOverviewSectionComponent } from './pages/environment-detail/env-overview-section.component';
import { ServiceCostComponent } from './pages/service-cost/service-cost.component';
import { BarGraphComponent } from './secondary-components/bar-graph/bar-graph.component';
import { AmountComponent } from './primary-components/amount/amount.component';
import { FiltersComponent } from './secondary-components/filters/filters.component';
import { TableTemplateComponent } from './secondary-components/table-template/table-template.component';
import { SearchBoxComponent } from './primary-components/search-box/search-box.component';

import { DaterangePickerComponent } from './primary-components/daterange-picker/daterange-picker.component';
import { MobileSecondaryTabComponent } from './secondary-components/mobile-secondary-tab/mobile-secondary-tab.component';
import { JazzMobHeaderComponent } from './secondary-components/jazz-mob-header/jazz-mob-header.component';

import { LineGraphComponent } from './secondary-components/line-graph/line-graph.component';
import { ServiceMetricsComponent } from './pages/service-metrics/service-metrics.component';

import { JazzToasterComponent } from './secondary-components/jazz-toaster/jazz-toaster.component';
import { JenkinsStatusComponent } from './pages/jenkins-status/jenkins-status.component';
import { FooterComponent } from './secondary-components/footer/footer.component';
import { Error404Component } from './pages/error404/error404.component';
import { RegisteredComponent } from './secondary-components/registered/registered.component';


const appRoutes: Routes = [
  {
    path : '',
    component : LandingComponent
  },
  {
    path: 'landing',
    component: LandingComponent
  },
  {
    path: '404',
    component: Error404Component
  },
  {
    path: 'registered',
    component: RegisteredComponent
  },
  {
    path: 'approval',
    component: JenkinsStatusComponent
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
  { path: ':',
    redirectTo: '404',
    pathMatch: 'full'
  }
];


@NgModule({
  declarations: [
    AppComponent,
    BtnJazzPrimaryComponent,
    BtnJazzSecondaryComponent,
    LandingComponent,
    JazzHeaderComponent,
    ServicesComponent,
    JazzTableComponent,
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
    FocusDirective,
    OnlyNumber,
    ServiceLogsComponent,
    ServiceDetailComponent,
    ClickOutsideDirective,
    ServiceAccessControlComponent,
    EnvironmentDetailComponent,
    EnvAssetsSectionComponent,
    EnvDeploymentsSectionComponent,
    EnvCodequalitySectionComponent,
    EnvLogsSectionComponent,
    EnvOverviewSectionComponent,
    ServiceCostComponent,
    AmountComponent,
    FiltersComponent,
    TableTemplateComponent,
    SearchBoxComponent,
    LineGraphComponent,
    BarGraphComponent,
    ServiceMetricsComponent,
    MobileSecondaryTabComponent,
    JazzMobHeaderComponent,
    JazzToasterComponent,
    DaterangePickerComponent,
    JenkinsStatusComponent,
    Error404Component,
    FooterComponent,
    RegisteredComponent,
    
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    FormsModule,
    DropdownModule,
    HttpModule,
    DatePickerModule,
    MomentModule,
    ToasterModule,
    NgIdleKeepaliveModule.forRoot(),
    PopoverModule,
    ChartsModule,
    IonRangeSliderModule
  ],
  providers: [
    AuthenticationService,
    CronParserService,
    SharedService,
    RouteGuard,
    DataCacheService,
    RequestService,
    MessageService,
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

//redirectTo: is redirecting to landing page