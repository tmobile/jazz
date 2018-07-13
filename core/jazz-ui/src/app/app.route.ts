import {Routes} from '@angular/router';
import {JenkinsStatusComponent} from './pages/jenkins-status/jenkins-status.component';
import {Error404Component} from './pages/error404/error404.component';
import {UserJourneyComponent} from "./pages/user-journey/user-journey.component";

export const routes: Routes = [
  {
    path: 'landing',
    loadChildren: 'app/landing-module/landing.module#LandingModule'
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
    path: 'services',
    loadChildren: 'app/service-module/service.module#ServiceModule'
  },
  {
    path: 'user-journey',
    component: UserJourneyComponent
  },
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: ':',
    redirectTo: '404',
    pathMatch: 'full'
  }
];
