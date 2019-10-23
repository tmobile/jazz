import {Routes} from '@angular/router';
import {JenkinsStatusComponent} from './pages/jenkins-status/jenkins-status.component';
import {Error404Component} from './pages/error404/error404.component';
import {LandingComponent} from './pages/landing/landing.component';
import {TestApiComponent} from './pages/testapi/test-api.component';
import {UserJourneyComponent} from "./pages/user-journey/user-journey.component";

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
    path: 'admin',
    loadChildren: 'app/admin-module/admin.module#AdminModule'
  },
  {
    path: 'services',
    loadChildren: 'app/service-module/service.module#ServiceModule'
  },
  {
    path: 'docs/api',
    loadChildren: 'app/docs/docs.module#DocsModule'
  },
  {
    path: 'user-journey',
    component: UserJourneyComponent
  },
  {
    path: ':',
    redirectTo: '404',
    pathMatch: 'full'
  }
];
