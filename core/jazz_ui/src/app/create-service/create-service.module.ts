import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateServiceRowComponent } from './create-service-row/create-service-row.component';
import {DropdownModule} from "ng2-dropdown";
import {MomentModule} from "angular2-moment";
import {FormsModule} from "@angular/forms";
import {SharedModule} from "../shared-module/shared.module";
import {CreateServiceComponent} from "./create-service/create-service.component";
import {CreateServiceCustomFormComponent} from "./create-service-custom-form/create-service-custom-form.component";
import { RadioPanelsComponent } from './radio-panels/radio-panels.component';
import { CreateServiceEventScheduleComponent } from './create-service-event-schedule/create-service-event-schedule.component';
import { CreateServiceAwsEventsComponent } from './create-service-aws-events/create-service-aws-events.component';
import {CreateServiceUtilsService} from "./create-service-utils.service";

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
    CreateServiceCustomFormComponent,
    CreateServiceRowComponent,
    CreateServiceEventScheduleComponent,
    CreateServiceAwsEventsComponent,
    RadioPanelsComponent
  ],
  providers: [
    CreateServiceUtilsService
  ],
  exports: [
    CreateServiceComponent,
    CreateServiceCustomFormComponent,
    CreateServiceRowComponent,
    CreateServiceEventScheduleComponent,
    CreateServiceAwsEventsComponent,
    RadioPanelsComponent
  ]
})
export class CreateServiceModule { }
