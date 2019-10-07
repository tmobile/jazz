import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ToasterModule } from 'angular2-toaster';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationService, RouteGuard, DataCacheService, RequestService, MessageService } from './core/services';
import { SharedService } from './SharedService.service';
import { CronParserService } from './core/helpers';
import { DropdownModule } from 'ngx-dropdown';
import { AppComponent } from './app.component';
import { ConfigService, ConfigLoader } from './app.config';
import { LandingComponent } from './pages/landing/landing.component';
import { TestApiComponent } from './pages/testapi/test-api.component';
import { Error404Component } from './pages/error404/error404.component';
import { SharedModule } from './shared-module/shared.module';
import { routes } from './app.route';
import {UserJourneyComponent} from "./pages/user-journey/user-journey.component";
import {UtilsService} from './core/services/utils.service';
import { RenameFieldService } from './core/services/rename-field.service';
import { AngularFontAwesomeModule } from 'angular-font-awesome/angular-font-awesome';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    Error404Component,
    TestApiComponent,
    UserJourneyComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    DropdownModule,
    HttpModule,
    ToasterModule,
    RouterModule.forRoot(routes),
    NgIdleKeepaliveModule.forRoot(),
    SharedModule,
    AngularFontAwesomeModule
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
    UtilsService,
    RenameFieldService,
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [ConfigService],
      multi: true
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {
}
