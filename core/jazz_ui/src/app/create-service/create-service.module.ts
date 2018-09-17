import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CreateServiceRowComponent} from './create-service-row/create-service-row.component';
import {DropdownModule} from "ng2-dropdown";
import {MomentModule} from "angular2-moment";
import {FormsModule} from "@angular/forms";
import {SharedModule} from "../shared-module/shared.module";
import {CreateServiceComponent} from "./create-service/create-service.component";
import {RadioPanelsComponent} from './radio-panels/radio-panels.component';
import {CreateServiceEventScheduleComponent} from './create-service-event-schedule/create-service-event-schedule.component';
import {CreateServiceAwsEventsComponent} from './create-service-aws-events/create-service-aws-events.component';
import {CreateServiceUtilsService} from "./create-service-utils.service";
import {CreateServiceFormCustomComponent} from './create-service-form-custom/create-service-form-custom.component';
import {CreateServiceCustomService} from "./create-service-custom.service";

@NgModule({
  imports: [
    CommonModule,
    DropdownModule,
    MomentModule,
    FormsModule,
    SharedModule
  ],
  declarations: [
    CreateServiceComponent,
    CreateServiceRowComponent,
    CreateServiceEventScheduleComponent,
    CreateServiceAwsEventsComponent,
    RadioPanelsComponent,
    CreateServiceFormCustomComponent
  ],
  providers: [
    CreateServiceUtilsService,
    CreateServiceCustomService
  ],
  exports: [
    CreateServiceComponent,
    CreateServiceRowComponent,
    CreateServiceEventScheduleComponent,
    CreateServiceAwsEventsComponent,
    RadioPanelsComponent,
    CreateServiceFormCustomComponent
  ]
})
export class CreateServiceModule {
}
