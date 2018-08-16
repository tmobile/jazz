import { Directive, ViewContainerRef, TemplateRef, Input } from '@angular/core';

@Directive({
  selector: '[adv-filters]',
})
export class AdvFilters {
  constructor(public viewContainerRef: ViewContainerRef) { }  
}