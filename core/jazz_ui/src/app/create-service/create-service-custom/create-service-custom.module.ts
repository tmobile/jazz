import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from "@angular/forms";
import {DropdownModule} from "ng2-dropdown";
import {SharedModule} from "../../shared-module/shared.module";
import {MomentModule} from "angular2-moment";
import {CreateServiceCustomService} from "./create-service-custom.service";

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
  declarations: [],
  exports: []
})
export class CreateServiceCustomModule {
}
