import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ToasterModule } from 'angular2-toaster';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { RouterModule } from '@angular/router';
import { DropdownModule } from 'ng2-dropdown';

import { AppComponent } from './app.component';
import { appProviders, appDeclarations } from './app.include';
import { ConfigService, ConfigLoader } from './app.config';
import { SharedModule } from './shared-module/shared.module';
import { routes } from './app.route';

@NgModule({
  declarations: [
    AppComponent,
    ...appDeclarations
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    DropdownModule,
    ToasterModule,
    SharedModule,
    RouterModule.forRoot(routes),
    NgIdleKeepaliveModule.forRoot()
  ],
  providers: [
    ConfigService,
    ...appProviders,
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
export class AppModule { }
