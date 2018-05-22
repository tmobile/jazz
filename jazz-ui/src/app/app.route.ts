import {Routes} from '@angular/router';
import {JenkinsStatusComponent} from './pages/jenkins-status/jenkins-status.component';
import {Error404Component} from './pages/error404/error404.component';
import {LandingComponent} from './pages/landing/landing.component';
import {TestApiComponent} from './pages/testapi/test-api.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'landing',
    component: LandingComponent
  },
  {
    path: 'admin',
    loadChildren: 'app/admin-modules/admin.module#AdminModule'
  },
  {
    path: '404',
    component: Error404Component
  },
  {
    path: 'approval',
    component: JenkinsStatusComponent
  },
  {
    path: 'test-api',
    component: TestApiComponent
  },
  {
    path: 'services',
    loadChildren: 'app/service-module/service.module#ServiceModule'
  },
  {
    path: ':',
    redirectTo: '404',
    pathMatch: 'full'
  }
];
