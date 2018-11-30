import { LandingComponent, TestApiComponent, Error404Component, UserJourneyComponent } from './pages';

import { AuthenticationService, RouteGuard, DataCacheService, RequestService, MessageService, UtilsService } from './core/services';
import { SharedService } from './SharedService.service';
import { CronParserService } from './core/helpers';

export const appDeclarations = [
    LandingComponent,
    Error404Component,
    TestApiComponent,
    UserJourneyComponent
];

export const appProviders = [
    AuthenticationService,
    RouteGuard,
    DataCacheService,
    RequestService,
    MessageService,
    UtilsService,
    SharedService,
    CronParserService
];

