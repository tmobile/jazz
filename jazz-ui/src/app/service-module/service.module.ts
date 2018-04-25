import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {environment} from '../../environments/environment';
import {routes} from './service.route';

//End
// Importing The Required Modules via Barrel 
import * as CommonServiceModules from './service.module.imports.common'
import * as OssModules from './service.module.imports.oss'
import * as InternalModules from './service.module.imports.internal'
// End
// Importing The Required Components via Barrel
import * as CommonServiceComponents from './service.module.declarations.common';
import * as OssComponents from './service.module.declarations.oss';
import * as InternalComponents from './service.module.declarations.internal';

import { AdvFilters }            from '../adv-filter.directive';
import {AdvancedFilterService} from '../advanced-filter.service';

import { Symbol } from 'rxjs';

let routerRoutes:any;
let specificComponents:any;
let specificModules: any;
if(environment.envName == 'oss'){
  specificComponents = OssComponents;
  specificModules =  OssModules
}else  {
  specificComponents = InternalComponents;
  specificModules =  InternalModules;
}
let importsArray = [];
let declarationsArray=[];
for(let i in CommonServiceModules){
  importsArray.push(CommonServiceModules[i]);
}
for(let i in specificModules){
 importsArray.push(specificModules[i]);
}
for(let i in CommonServiceComponents){
  declarationsArray.push(CommonServiceComponents[i]);
}
for(let i in specificComponents){
 declarationsArray.push(specificComponents[i]);
}

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    ...importsArray
   
    
  ],
  providers:[AdvancedFilterService],
  declarations: [
    
    ...declarationsArray,
    // AdvFilters,
    
  ],
  
})
export class ServiceModule {
  constructor(){
  }
}
