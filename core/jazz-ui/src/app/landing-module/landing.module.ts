import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SharedModule} from "../shared-module/shared.module";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {LandingCarouselComponent} from "./landing-carousel/landing-carousel.component";
import {routes} from "./landing.route";
import {LandingComponent} from "./landing/landing.component";
import {LandingService} from "./landing.service";

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    FormsModule,
    SharedModule,
    CommonModule
  ],
  providers: [
    LandingService
  ],
  declarations: [
    LandingComponent,
    LandingCarouselComponent
  ]
})
export class LandingModule { }
