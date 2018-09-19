import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CreateServiceCustomService} from "./create-service-custom.service";
import {CreateServiceFormCustomComponent} from "./create-service-form-custom/create-service-form-custom.component";
import {FormsModule} from "@angular/forms";
import {DropdownModule} from "ng2-dropdown";
import {SharedModule} from "../../shared-module/shared.module";
import {MomentModule} from "angular2-moment";

@NgModule({
  imports: [
    CommonModule,
    DropdownModule,
    MomentModule,
    FormsModule,
    SharedModule
  ],
  providers: [
    CreateServiceCustomService
  ],
  declarations: [
    CreateServiceFormCustomComponent
  ],
  exports: [
    CreateServiceFormCustomComponent
  ]
})
export class CreateServiceCustomModule {
}
