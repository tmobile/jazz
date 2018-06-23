import {EnvironmentDetailComponent} from '../pages/environment-detail/environment-detail.component';
import {RouteGuard} from '../core/services';
import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: ':id/:env',
    component: EnvironmentDetailComponent,
    canActivate: [RouteGuard]
  }
];
