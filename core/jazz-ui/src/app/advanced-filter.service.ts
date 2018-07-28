import { Injectable , ComponentFactoryResolver, ReflectiveInjector} from '@angular/core';
import { Component, OnInit, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';
import {AdvancedFiltersComponent} from './secondary-components/advanced-filters/internal/advanced-filters.component';
import {AdvancedFiltersComponentOSS} from './secondary-components/advanced-filters/OSS/advanced-filters.component';
import {environment} from './../environments/environment';
@Injectable()
export class AdvancedFilterService {
  @ViewChild('adv_filters') adv_filters: AdvancedFiltersComponent;
  factoryResolver:ComponentFactoryResolver ;
  rootViewContainer;
  component : Component
  environ:string = environment.envName;
  constructor(@Inject(ComponentFactoryResolver) factoryResolver) { 
    this.factoryResolver = factoryResolver;
  }

  setRootViewContainerRef(viewContainerRef) {
    this.rootViewContainer = viewContainerRef
  }
  addDynamicComponent(obj) {
    if(this.environ == 'oss'){
      return  {"component" : AdvancedFiltersComponentOSS,obj};
    }
    else{
      return  {"component" : AdvancedFiltersComponent,obj};
    }
   
  }
  

  
  
}
