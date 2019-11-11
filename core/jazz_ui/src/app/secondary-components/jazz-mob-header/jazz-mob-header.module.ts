import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JazzMobHeaderComponent } from './jazz-mob-header.component';


@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    JazzMobHeaderComponent,
  ],
  exports: [
    JazzMobHeaderComponent,
  ]
})
export class JazzMobHeaderModule {}
