import { NgModule } from '@angular/core';
import { SlimScrollDirective } from './src/directives/slimscroll.directive';

export * from './src/classes/slimscroll-options.class';

@NgModule({
  declarations: [
    SlimScrollDirective
  ],
  exports: [
    SlimScrollDirective
  ]
})
export class SlimScrollModule { }

