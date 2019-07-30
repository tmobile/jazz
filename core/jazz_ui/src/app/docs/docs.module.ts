import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared-module/shared.module';
import { DocsComponent } from './docs.component';
import { DocsRoutes } from './docs.route';


@NgModule({
  declarations: [
    DocsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(DocsRoutes),
  ],
  exports: [
    DocsComponent,
  ]
})
export class DocsModule {}
