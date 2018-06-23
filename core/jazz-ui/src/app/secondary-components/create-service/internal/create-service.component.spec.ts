import { ComponentFixture, inject } from '@angular/core/testing';
// import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { NO_ERRORS_SCHEMA, Component, Input, OnInit, Output, EventEmitter, NgModule } from '@angular/core';


import { ServiceFormData, RateExpression, CronObject, EventExpression } from './../service-form-data';
import { FocusDirective } from './../focus.directive';
import { fakeAsync } from '@angular/core/testing';
import { ToasterService } from 'angular2-toaster';
import { tick } from '@angular/core/testing';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { ServicesListComponent } from '../../../pages/services-list/services-list.component';
import { CreateServiceComponent } from './create-service.component';
import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from '../../../app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MomentModule } from 'angular2-moment';

import { ChartsModule } from 'ng2-charts';
import { APP_BASE_HREF } from '@angular/common';
import { APP_INITIALIZER } from '@angular/core';
import { DropdownModule } from "ng2-dropdown";

import { LandingComponent } from '../../../pages/landing/landing.component';
import { CronParserService } from '../../../core/helpers';
import { SharedService } from "../../../SharedService.service";
import { ConfigService, ConfigLoader } from '../../../app.config';
import { ServicesComponent } from '../../../pages/services/services.component';

import { SideTileFixedComponent } from '../../../secondary-components/side-tile-fixed/side-tile-fixed.component';
import { DropdownComponent } from '../../../primary-components/dropdown/dropdown.component';
import { MyFilterPipe } from '../../../primary-components/custom-filter';
import { TabsComponent } from '../../../primary-components/tabs/tabs.component';
import { OnlyNumber } from '../../../secondary-components/create-service/onlyNumbers';
import { SidebarComponent } from '../../../secondary-components/sidebar/sidebar.component';

import { LoginComponent } from '../../../pages/login/internal/login.component';
import { ServiceOverviewComponent } from '../../../pages/service-overview/service-overview.component';
import { InputComponent } from '../../../primary-components/input/input.component';
import { BtnPrimaryWithIconComponent } from '../../../primary-components/btn-primary-with-icon/btn-primary-with-icon.component';
import { NavigationBarComponent } from '../../../secondary-components/navigation-bar/navigation-bar.component';
import { ServiceLogsComponent } from '../../../pages/service-logs/service-logs.component';
import { ServiceDetailComponent } from '../../../pages/service-detail/service-detail.component';
import { ServiceAccessControlComponent } from '../../../pages/service-access-control/service-access-control.component';
import { EnvironmentDetailComponent } from '../../../pages/environment-detail/environment-detail.component';
import { EnvAssetsSectionComponent } from '../../../pages/environment-assets/env-assets-section.component';
import { EnvDeploymentsSectionComponent } from '../../../pages/environment-deployment/env-deployments-section.component';
import { EnvCodequalitySectionComponent } from '../../../pages/environment-codequality/env-codequality-section.component';
import { EnvLogsSectionComponent } from '../../../pages/environment-logs/env-logs-section.component';
import { EnvOverviewSectionComponent } from '../../../pages/environment-overview/env-overview-section.component';
import { ServiceCostComponent } from '../../../pages/service-cost/service-cost.component';
import { BarGraphComponent } from '../../../secondary-components/bar-graph/bar-graph.component';
import { AmountComponent } from '../../../primary-components/amount/amount.component';
import { FiltersComponent } from '../../../secondary-components/filters/filters.component';
import { FilterTagsComponent } from '../../../secondary-components/filter-tags/filter-tags.component';
import { FilterTagsServicesComponent } from '../../../secondary-components/filter-tags-services/filter-tags-services.component';
import { TableTemplateComponent } from '../../../secondary-components/table-template/table-template.component';
import { SearchBoxComponent } from '../../../primary-components/search-box/search-box.component';
import { DaterangePickerComponent } from '../../../primary-components/daterange-picker/daterange-picker.component';
import { MobileSecondaryTabComponent } from '../../../secondary-components/mobile-secondary-tab/mobile-secondary-tab.component';

import { ToasterModule } from 'angular2-toaster';
import { LineGraphComponent } from '../../../secondary-components/line-graph/line-graph.component';
import { ServiceMetricsComponent } from '../../../pages/service-metrics/service-metrics.component';

import { JenkinsStatusComponent } from '../../../pages/jenkins-status/jenkins-status.component';
import { TestApiComponent } from '../../../pages/testapi/test-api.component';
import { FooterComponent } from '../../../secondary-components/footer/footer.component';
import { Error404Component } from '../../../pages/error404/error404.component';
import { PopoverModule } from 'ng2-popover';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule , BaseRequestOptions, Connection} from '@angular/http';
import { AuthenticationService, RouteGuard, DataCacheService, RequestService, MessageService } from '../../../core/services';
import { RouterModule, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { IonRangeSliderModule } from 'ng2-ion-range-slider';
import { environment } from '../../../../environments/environment';
import { Http, Headers, Response, RequestOptions,ResponseOptions } from '@angular/http';
import {  } from '@angular/http'
import{MockBackend} from '@angular/http/testing'
import { Router } from '@angular/router';
import { ServiceList } from '../../../../app/pages/services-list/service-list';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';


class MockAuthService {
  // constructor(private http: Http, private configService: MockConfigService,  private router:Router){
  //   super(http, configService, router);
  // }

  isAuthenticated() {
    return 'Mocked';
  }
  getToken() {

  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}
class MockConfigService extends ConfigService {
  getConfiguration() {
    return { "baseurl": environment.baseurl }
  }

}

class RequestServiceMock {

}

describe('CreateServiceComponent', () => {
  let component: CreateServiceComponent;
  let describeScope = this;
  let fixture: ComponentFixture<CreateServiceComponent>;
  let element: HTMLElement;
  let testBedService: AuthenticationService;
  let componentService: AuthenticationService;
  let testBedRequestService: RequestService;
  let router: MockRouter;
  let testBedConfigService: ConfigService;
  let componentConfigService: ConfigService;
  let de: DebugElement;
  let backend: MockBackend;
  beforeEach(async(() => {
    TestBed.overrideComponent(
      LoginComponent,
      { set: { providers: [{ provide: AuthenticationService, useClass: MockAuthService }] } }
    );
    TestBed.configureTestingModule({
      declarations: [CreateServiceComponent, MyFilterPipe, ServicesListComponent],
      imports: [FormsModule, ReactiveFormsModule, BrowserModule, DropdownModule, PopoverModule, HttpModule],
      providers: [
        ToasterService, CronParserService, DataCacheService,
        MockBackend,BaseRequestOptions,
        { provide: Router, useClass: MockRouter },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: RequestService, useClass: RequestServiceMock },
        { provide: AuthenticationService, useClass: MockAuthService }, 
        {provide:Http,
         useFactory: (backend,options)=> new Http(backend,options),
         deps:[MockBackend,BaseRequestOptions]
        },
        SharedService
        , MessageService, ServicesListComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
    
      backend = TestBed.get(MockBackend); 
  }));

  beforeEach(() => {
    router = new MockRouter();
    // authenticationservice = new AuthService();

    fixture = TestBed.createComponent(CreateServiceComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    testBedConfigService = TestBed.get(ConfigService);
    testBedService = TestBed.get(AuthenticationService);
    // AuthService provided by Component, (should return MockAuthService)
    componentService = fixture.debugElement.injector.get(AuthenticationService);
    componentConfigService = fixture.debugElement.injector.get(ConfigService);
    testBedRequestService = TestBed.get(RequestService);
    // let spy = spyOn(component, "validateServiceName").and.callFake(() => {
    //   if (component.model.domainName === "true-domain" && component.model.serviceName === "true-service") {
    //     component.serviceAvailable = true;
    //     component.serviceNotAvailable = false;
    //     component.isDomainDefined = false;
    //   }
    // }
    // );
    let spy2 = spyOn(component, "toast_pop").and.callFake(() => { });

  });

  it ('ValidateNameService should be called for valid (Servicename - Namespace) pair when the user navigates out of Service name input ', async(() => {
    let spy = spyOn(component, "validateServiceName").and.callFake(() => {
      if (component.model.domainName === "true-domain" && component.model.serviceName === "true-service") {
        component.serviceAvailable = true;
        component.serviceNotAvailable = false;
        component.isDomainDefined = false;
      }
    }
    );
    let serviceInput;
    let namespaceInput;
    component.changeServiceType('api');
    fixture.autoDetectChanges();
    component.model.serviceName = "true-service";
    component.invalidServiceName = false;
    component.model.domainName = "true-domain"
    component.invalidDomainName = false;
    fixture.detectChanges();
    serviceInput = fixture.debugElement.query(By.css('.each-step-wrap.service-name')).nativeElement;
    namespaceInput = fixture.debugElement.query(By.css('.each-step-wrap.domain-name input')).nativeElement;
    serviceInput.querySelector('input').focus();
    serviceInput.querySelector('input').blur();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges()
      expect(component.validateServiceName).toHaveBeenCalled();
      expect(serviceInput.querySelector('.termsConditions').textContent).toContain('Service name is available');

    })
  }));
  it  ('Submit button should get enabled for right Service,Namespace,Autoriser set ', async(() => {
    let spy = spyOn(component, "validateServiceName").and.callFake(() => {
      if (component.model.domainName === "true-domain" && component.model.serviceName === "true-service") {
        component.serviceAvailable = true;
        component.serviceNotAvailable = false;
        component.isDomainDefined = false;
      }
    }
    );
    let serviceInput;
    let namespaceInput;
    let approverInput;
    let submitButton;
    component.changeServiceType('api');
    fixture.autoDetectChanges();
    component.model.serviceName = "true-service";
    component.invalidServiceName = false;
    component.model.domainName = "true-domain"
    component.invalidDomainName = false;
    fixture.detectChanges();
    serviceInput = fixture.debugElement.query(By.css('.each-step-wrap.service-name')).nativeElement;
    namespaceInput = fixture.debugElement.query(By.css('.each-step-wrap.domain-name input')).nativeElement;
    submitButton = fixture.debugElement.query(By.css('.submit-form button')).nativeElement;

    serviceInput.querySelector('input').focus();
    serviceInput.querySelector('input').blur();
    fixture.detectChanges()
    component.approversList = [
      {
        displayName: "Approver1",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        displayName: "Approver3",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      }
    ];
    approverInput = fixture.debugElement.query(By.css('.each-step-wrap.approvers')).nativeElement;
    component.approverName = "App";
    let tempElement: HTMLElement;
    tempElement = approverInput.querySelector('input');
    tempElement.click();
    var event = document.createEvent('Event');

    event.initEvent('keydown', true, true);
    tempElement.dispatchEvent(event);
    component.onApproverChange(true);
    fixture.whenStable().then(() => {
      approverInput.querySelector('.approvers-list-wrap .approvers-dets div').click();
      fixture.detectChanges();
      expect(submitButton.disabled).toBe(false);
    });
  }));
  it('Submit button should  not get enabled for invalid Service name even with valid (Namespace,Autoriser) set ', async(() => {
    let serviceInput;
    let namespaceInput;
    let approverInput;
    let submitButton;
    component.changeServiceType('api');
    fixture.autoDetectChanges();
    component.model.serviceName = "not-true-service";
    component.invalidServiceName = false;
    component.model.domainName = "true-domain"
    component.invalidDomainName = false;
    fixture.detectChanges();
    serviceInput = fixture.debugElement.query(By.css('.each-step-wrap.service-name')).nativeElement;
    namespaceInput = fixture.debugElement.query(By.css('.each-step-wrap.domain-name input')).nativeElement;
    submitButton = fixture.debugElement.query(By.css('.submit-form button')).nativeElement;

    serviceInput.querySelector('input').focus();
    serviceInput.querySelector('input').blur();
    fixture.detectChanges()
    component.approversList = [
      {
        displayName: "Approver1",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        displayName: "Approver3",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      }
    ];
    approverInput = fixture.debugElement.query(By.css('.each-step-wrap.approvers')).nativeElement;
    component.approverName = "App";
    let tempElement: HTMLElement;
    tempElement = approverInput.querySelector('input');
    tempElement.click();
    var event = document.createEvent('Event');

    event.initEvent('keydown', true, true);
    tempElement.dispatchEvent(event);
    component.onApproverChange(true);
    fixture.whenStable().then(() => {
      approverInput.querySelector('.approvers-list-wrap .approvers-dets div').click();
      fixture.detectChanges();
      expect(submitButton.disabled).toBe(true);
    });
  }));
  it('Submit button should  not get enabled for invalid NameSpace even with valid (Service name,Autoriser) set ', async(() => {
    let serviceInput;
    let namespaceInput;
    let approverInput;
    let submitButton;
    component.changeServiceType('api');
    fixture.autoDetectChanges();
    component.model.serviceName = "true-service";
    component.invalidServiceName = false;
    component.model.domainName = "not-true-domain"
    component.invalidDomainName = false;
    fixture.detectChanges();
    serviceInput = fixture.debugElement.query(By.css('.each-step-wrap.service-name')).nativeElement;
    namespaceInput = fixture.debugElement.query(By.css('.each-step-wrap.domain-name input')).nativeElement;
    submitButton = fixture.debugElement.query(By.css('.submit-form button')).nativeElement;

    serviceInput.querySelector('input').focus();
    serviceInput.querySelector('input').blur();
    fixture.detectChanges()
    component.approversList = [
      {
        displayName: "Approver1",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        displayName: "Approver3",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      }
    ];
    //expect(component.validateServiceName).toHaveBeenCalled();
    //expect(serviceInput.querySelector('.termsConditions').textContent).toContain('Service name is available');
    approverInput = fixture.debugElement.query(By.css('.each-step-wrap.approvers')).nativeElement;
    component.approverName = "App";
    let tempElement: HTMLElement;
    tempElement = approverInput.querySelector('input');
    tempElement.click();
    var event = document.createEvent('Event');

    event.initEvent('keydown', true, true);
    tempElement.dispatchEvent(event);
    component.onApproverChange(true);
    fixture.whenStable().then(() => {
      approverInput.querySelector('.approvers-list-wrap .approvers-dets div').click();
      fixture.detectChanges();
      expect(submitButton.disabled).toBe(true);
    });
  }));
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('Should be same service with injector', () => {
    inject([AuthenticationService], (injectService: AuthenticationService) => {
      expect(injectService).toBe(testBedService);
    })
  });
  it('TestServiceNameValidity', () => {
    de = fixture.debugElement.query(By.css('h1'));
  });


  // TEST CASE UT001
  it('API should show Specific Field Runtime', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.run-time'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Choose your runtime'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("NodeJs".toLowerCase());
    expect(elementText).toContain("Java".toLocaleLowerCase());
    expect(elementText).toContain("Python".toLocaleLowerCase());
  });
  it('API should show Specific Field Accessiblity ', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.Internal-access'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Accessibility'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("The API should be publicly accessible".toLowerCase());
  });
  it('API should show Specific Field Access Restriction ', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.Internal-access'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Access Restriction'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain('Does your service require access to internal T-Mobile network and resources?'.toLowerCase());
  });
  it('API should show Specific Field Cache Time To Live', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.cache-ttl-integration'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Cache Time-to-Live'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }

    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("Yes, enable caching for my API".toLowerCase());
  });
  // TEST CASE UT001 - COMPLETED 



  it('API Specific Field runtime should not be present in website', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let runtime = fixture.debugElement.query(By.css('.each-step-wrap.run-time'));
    expect(runtime).toBeNull;
  });
  it('API Specific Field accesiblity should not be present in website', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let accessiblity = fixture.debugElement.query(By.css('.each-step-wrap.Internal-access'));
    expect(accessiblity).toBeNull;
  });


  // TEST CASE UT003 - START
  it('ValidateNameService should be called for valid (Servicename - Namespace) pair when the user navigates out of Namespace input ', async(() => {
    let spy = spyOn(component, "validateServiceName").and.callFake(() => {
      if (component.model.domainName === "true-domain" && component.model.serviceName === "true-service") {
        component.serviceAvailable = true;
        component.serviceNotAvailable = false;
        component.isDomainDefined = false;
      }
    }
    );
    let serviceInput;
    let namespaceInput;
    component.changeServiceType('api');
    fixture.autoDetectChanges();
    component.model.serviceName = "true-service";
    component.invalidServiceName = false;
    component.model.domainName = "true-domain"
    component.invalidDomainName = false;
    serviceInput = fixture.debugElement.query(By.css('.each-step-wrap.service-name')).nativeElement;
    namespaceInput = fixture.debugElement.query(By.css('.each-step-wrap.domain-name input')).nativeElement;
    namespaceInput.focus();
    namespaceInput.blur();
    fixture.whenStable().then(() => {
      fixture.detectChanges()
      expect(component.validateServiceName).toHaveBeenCalled();
      expect(serviceInput.querySelector('.termsConditions').textContent).toContain('Service name is available');

    })

  }));
 
  // TEST CASES FOR LAMBDA FUNCTIONS 

  it('Lambda Function section should show Specific Field Runtime', () => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.run-time'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Choose your runtime'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("NodeJs".toLowerCase());
    expect(elementText).toContain("Java".toLocaleLowerCase());
    expect(elementText).toContain("Python".toLocaleLowerCase());

  });
  it('Lambda Function section should show Specific Field Event Shedule', () => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.event-schedule'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Event Schedule'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("None".toLowerCase());
    expect(elementText).toContain("Fixed Rate of".toLocaleLowerCase());
    expect(elementText).toContain("Cron Expression".toLocaleLowerCase());

  });
  it('Lambda Function section should show Specific Field AWS Events', () => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('AWS Events'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).toContain("None".toLowerCase());
    expect(elementText).toContain("DynamoDB".toLocaleLowerCase());
    expect(elementText).toContain("Kinesis".toLocaleLowerCase());
    expect(elementText).toContain("s3".toLocaleLowerCase());

  })
  it('User should be able to choose none from The subsection on Event schedule ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    spyOn(component, "onEventScheduleChange");

    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.event-schedule .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('None'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    contextElement.query(By.css('input')).nativeElement.click();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(component.onEventScheduleChange).toHaveBeenCalled();

    expect(contextElement).not.toBeNull();
  }));

  //Needs Review -----------------------
  it('User should be able to choose fixed rate  from The subsection on Event schedule ', () => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.event-schedule .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Fixed Rate of'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    contextElement.query(By.css('#fixedRate')).nativeElement.click();
    fixture.detectChanges();
    checkElement = fixture.debugElement.query(By.css('.event-schedule-fields .rate-field input'));
    expect(checkElement).not.toBeNull()
  });

  it('Error warning is shown when user input for fixed rate field is null ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    component.rateExpression.duration = "";
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.event-schedule .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Fixed Rate of'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#fixedRate')).nativeElement.click();
    fixture.detectChanges();
    tick()
    contextElement = fixture.debugElement.query(By.css('.rate-field input'));
    contextElement.nativeElement.Value = component.rateExpression.duration;
    contextElement.nativeElement.click()
    component.generateExpression(component.rateExpression)
    fixture.detectChanges();
    checkElement = fixture.debugElement.query(By.css('.event-schedule-fields .form-error')).nativeElement;
    expect(checkElement.textContent.toLowerCase()).toContain('Please enter a valid duration'.toLowerCase());
  }));

  it('User should be able to choose cron Expression from The subsection on Event schedule ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let checkElement = null;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.event-schedule .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Cron Expression'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    contextElement.query(By.css('#cron')).nativeElement.click();
    fixture.detectChanges();
    //checkElement = contextElement.query(By.css('.event-schedule-fields .cron-fields input')).nativeElement;
    //expect(checkElement).not.toBeNull;
    checkElement = fixture.debugElement.query(By.css('.cron-fields.arrow_box')).nativeElement;
    expect(checkElement).not.toBeNull()
  }));


  //Needs Review 

  it('User should be able to choose none for the AWS event field ', () => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('None'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('input')).nativeElement.click();
    fixture.detectChanges();
    expect(contextElement).not.toBeNull();
  });
  it('User should be able to choose DynamoDB form the AWS event field  ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    spyOn(component, "onAWSEventChange");

    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('DynamoDB'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#dynamodb')).nativeElement.click();
    fixture.detectChanges();
    tick()
    expect(component.onAWSEventChange).toHaveBeenCalled();

    expect(contextElement).not.toBeNull();
  }));


  it('User should be able to input Value to TableARN subsection under DynamoDB  ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('DynamoDB'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#dynamodb')).nativeElement.click();
    component.eventExpression.dynamoTable = "New Value";
    fixture.detectChanges();
    tick();
    checkElement = fixture.debugElement.query(By.css('#dynamoTable')).nativeElement;
    checkElement.click();
    checkElement.blur();
    fixture.detectChanges
    expect(checkElement).not.toBeNull();
    expect(checkElement.value).toBe("New Value");
  }));


  it('User should be able to choose Kinesis form the AWS event field  ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    spyOn(component, "onAWSEventChange");

    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Kinesis'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#kinesis')).nativeElement.click();
    fixture.detectChanges();
    tick()
    expect(component.onAWSEventChange).toHaveBeenCalled();
    expect(contextElement).not.toBeNull();
  }));



  it('User should be able to input Value to Stream ARN subsection under Kinesis ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Kinesis'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#kinesis')).nativeElement.click();
    component.eventExpression.streamARN = "New Value";
    fixture.detectChanges();
    tick();
    checkElement = fixture.debugElement.query(By.css('#streamARN')).nativeElement;
    checkElement.click();
    checkElement.blur();
    fixture.detectChanges
    expect(checkElement).not.toBeNull();
    expect(checkElement.value).toBe("New Value");
  }));

  it('User should be able to choose S3 form the AWS event field', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    spyOn(component, "onAWSEventChange");
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('S3'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#s3')).nativeElement.click();
    fixture.detectChanges();
    tick()
    expect(component.onAWSEventChange).toHaveBeenCalled();
    expect(contextElement).not.toBeNull();
  }));

  it('User should be able to input Value to Bucket ARN subsection under S3 ', <any>fakeAsync(() => {
    component.changeServiceType('function');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let checkElement = undefined;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.aws-events .radio-container'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('S3'.toLowerCase()) != -1) {
        contextElement = elementList[i];
      }
    }
    contextElement.query(By.css('#s3')).nativeElement.click();
    component.eventExpression.S3BucketName = 'New Value';
    fixture.detectChanges();
    tick()
    checkElement = fixture.debugElement.query(By.css('#S3BucketName')).nativeElement;
    checkElement.click();
    checkElement.blur();
    fixture.detectChanges
    expect(checkElement).not.toBeNull();
    expect(checkElement.value).toContain("New Value");
  }));
  // TEST CASE UT005 - STARTED 
  it('Clone field is not present for API & Function', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let cloneapi = fixture.debugElement.query(By.css('#checkbox-gitclone'));
    component.changeServiceType('function');
    fixture.detectChanges();
    let clonefunction = fixture.debugElement.query(By.css('#checkbox-gitclone'));
    expect(cloneapi).toBeNull;
    expect(clonefunction).toBeNull;
  });
  it('CDN field is not present for API & Function', () => {
    component.changeServiceType('api');
    fixture.detectChanges();
    let cdnapi = fixture.debugElement.query(By.css('#checkbox-cdnconfig'));
    component.changeServiceType('function');
    fixture.detectChanges();
    let cdnfunction = fixture.debugElement.query(By.css('#checkbox-cdnconfig'));
    expect(cdnapi).toBeNull;
    expect(cdnfunction).toBeNull;
  });
  it('Website should show specific field Clone from repository and CDN ', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    let elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.cloudfront-url'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('CDN configuration'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(elementText).not.toBeNull;

    elementList = fixture.debugElement.queryAll(By.css('.each-step-wrap.cloudfront-url'));
    for (let i = 0; i < elementList.length; i++) {
      if (elementList[i].nativeElement.textContent.toLowerCase().search('Clone Repository from Git'.toLowerCase()) != -1) {
        contextElement = elementList[i];
        passed = true;
      }
    }
    elementText = contextElement.nativeElement.textContent.toLowerCase()
    expect(passed).toBe(true);
    expect(contextElement).not.toBeNull;
  });
  it('User should be able to check/uncheck CDN configuration', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    checkElement = fixture.debugElement.query(By.css('#checkbox-cdnconfig')).nativeElement;
    checkElement.click();
    fixture.detectChanges();
    expect(contextElement).not.toBeNull();
  });
  it('User should be able to check/uncheck Clone Repository from git ', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    checkElement = fixture.debugElement.query(By.css('#checkbox-gitclone')).nativeElement;
    checkElement.click();
    fixture.detectChanges();
    expect(contextElement).not.toBeNull();
  });
  it('The url entered under Clone Repository from git must be validated', () => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let spy = spyOn(component, "validateGIT")
    let passed = false;
    checkElement = fixture.debugElement.query(By.css('#checkbox-gitclone')).nativeElement;
    checkElement.click();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      component.gitRepo = "some repo";
      checkElement = fixture.debugElement.query(By.css('#giturl')).nativeElement;
      fixture.detectChanges();
      checkElement.click();
      var event = document.createEvent('Event');
      event.initEvent('blur', true, true);
      checkElement.dispatchEvent(event);
      fixture.detectChanges()
      expect(component.validateGIT).toHaveBeenCalled();
    });
    fixture.detectChanges();

  });

  it('The url entered under Clone Repository from git must be validated  and error must be displayed  for invalid URL', <any>fakeAsync(() => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    checkElement = fixture.debugElement.query(By.css('#checkbox-gitclone')).nativeElement;
    checkElement.click();
    fixture.detectChanges();

    component.gitRepo = "some repo";
    checkElement = fixture.debugElement.query(By.css('#giturl')).nativeElement;
    fixture.detectChanges();
    checkElement.click();
    var event = document.createEvent('Event');
    event.initEvent('blur', true, true);
    checkElement.dispatchEvent(event);
    fixture.detectChanges();

    checkElement = fixture.debugElement.query(By.css('.git-error')).nativeElement;
    expect(checkElement.textContent.toLowerCase()).toContain("Invalid Git Url".toLowerCase());
    fixture.detectChanges();
  }));

  it('User Should be able to check/uncheck "is this a private repository " checkbox ', <any>fakeAsync(() => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    checkElement = fixture.debugElement.query(By.css('#checkbox-gitclone')).nativeElement;
    checkElement.click();
    fixture.detectChanges();
    tick();
    fixture.debugElement.query(By.css('#checkbox-gitprivate')).nativeElement.click();
    fixture.detectChanges();
    tick();
    debugger
    checkElement = fixture.debugElement.query(By.css('#gitusername')).nativeElement;
    expect(checkElement.textContent).not.toBeNull()
    expect(checkElement).not.toBeNull;
    checkElement = fixture.debugElement.query(By.css('#gituserpwd')).nativeElement;
    expect(checkElement).not.toBeNull()
    tick();
    fixture.detectChanges();
  }));

  it('User must be able to select slack channel integration  ', <any>fakeAsync(() => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    spyOn(component, "slackFunction")
    checkElement = fixture.debugElement.query(By.css('#checkbox-slack')).nativeElement;
    checkElement.click();
    expect(component.slackFunction).toHaveBeenCalled();
  }));
  it('User Must be able to enter slack channel url ', <any>fakeAsync(() => {
    component.changeServiceType('website');
    fixture.detectChanges();
    let checkElement: HTMLElement;
    let contextElement: DebugElement;
    let elementText: String;
    let passed = false;
    spyOn(component, "checkSlackNameAvailability").and.callFake(() => {
      if (component.model.slackName === "https://www.slack.com/123") {
        component.createSlackModel.name = component.model.slackName;
        component.slackAvailble = true;
        component.slackNotAvailble = false;
      }
      else {
        component.createSlackModel.name = component.model.slackName;
        component.serviceAvailable = true;
        component.slackAvailble = false;
        component.slackNotAvailble = false;

      }
    });
    checkElement = fixture.debugElement.query(By.css('#checkbox-slack')).nativeElement;
    checkElement.click();
    fixture.detectChanges();
    tick();
    checkElement = fixture.debugElement.query(By.css('#channelname')).nativeElement;
    component.model.slackName = "https://www.slack.com/123";
    component.onSlackChange()
    component.checkSlackNameAvailability();
    tick();
    fixture.detectChanges();
    tick();

  }));
/*
********************************* Integeration test *******************************
*/
 it("New Approver must be added to selectedApprover when selectApprover is called ",()=>{
  component.approversList = [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
let approver =  {
  displayName: "Approver1",
  givenName: "Approver1",
  userId: "AP1",
  userEmail: "ap1@moonraft.com"
};
component.selectApprovers(approver);
expect(component.selectedApprovers).toContain(approver);
expect(component.approversList).not.toContain(approver);

 });
 it ("New Approver should  be added the selected Approvers list2 ",()=>{
  component.approversList2 = [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
let approver =  {
  displayName: "Approver1",
  givenName: "Approver1",
  userId: "AP1",
  userEmail: "ap1@moonraft.com"
};
component.selectApprovers2(approver);
expect(component.selectedApprovers2).toContain(approver);
expect(component.approversList).not.toContain(approver);

 });

 it ("New Approver should  be added the selected Approvers list2 ",()=>{
  component.approversList2 = [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
let approver =  {
  displayName: "Approver1",
  givenName: "Approver1",
  userId: "AP1",
  userEmail: "ap1@moonraft.com"
};
component.selectApprovers2(approver);
expect(component.selectedApprovers2).toContain(approver);
expect(component.approversList).not.toContain(approver);

 });
 it ('Selected Approver must be Removed from selected Approvers ', <any>fakeAsync(() => {

  let approverInput;

  component.changeServiceType('api');
 
  fixture.detectChanges();

  component.approversList = [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
  approverInput = fixture.debugElement.query(By.css('.each-step-wrap.approvers')).nativeElement;
  component.approverName = "App";
  let tempElement: HTMLElement;
  tempElement = approverInput.querySelector('input');
  tempElement.click();
  var event = document.createEvent('Event');
  event.initEvent('keydown', true, true);
  tempElement.dispatchEvent(event);
  component.onApproverChange(true);
  fixture.detectChanges()
  tick();
  approverInput.querySelector('.approvers-list-wrap .approvers-dets div').click();
  fixture.detectChanges();
  tick();
  approverInput.querySelector('.selected-approvers .icon-icon-close').click();
  fixture.detectChanges();
  tick();
  expect( approverInput.querySelector('.selected-approvers li')).toBeNull();

}));

it ("Selected Approvers must be Removed Selected Approvers2 ",()=>{
  component.approversList2 = [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
let approver =  {
  displayName: "Approver1",
  givenName: "Approver1",
  userId: "AP1",
  userEmail: "ap1@moonraft.com"
};
component.selectedApprovers2.push();
component.removeApprover2(approver,0);
expect(component.selectedApprovers2).not.toContain(approver);
expect(component.approversList2).toContain(approver);
 });
 it ("disable function should return false for valid case ",()=>{
   //initialization 
  component.git_err = false;
  component.changeServiceType('api');
  component.selectedApprovers =[{
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  }]

  component.serviceAvailable = true;
  component.rateExpression.error = undefined;
  component.eventExpression.type =  undefined;
  component.invalidDomainName =false;
  component.invalidServiceName=false;
  component.approverName = "";
  
  expect(component.disableForm()).toBe(false);
 });
 it ("disable function should return error when called with git Error true",()=>{
  //initialization 
 component.git_err = true;
 component.changeServiceType('api');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = true;
 component.rateExpression.error = undefined;
 component.eventExpression.type =  undefined;
 component.invalidDomainName =false;
 component.invalidServiceName=false;
 component.approverName = "";
 
 expect(component.disableForm()).toBe(true);
});
it ("disable function should return false when called with service Available false",()=>{
  //initialization 
 component.git_err = false;
 component.changeServiceType('api');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = false;
 component.rateExpression.error = undefined;
 component.eventExpression.type =  undefined;
 component.invalidDomainName =false;
 component.invalidServiceName=false;
 component.approverName = "";
 
 expect(component.disableForm()).toBe(true);
});
it ("rate Expression error is defined and rate Expression type is not none then disable form should return true ",()=>{
  //initialization 
 component.git_err = false;
 component.changeServiceType('function');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = true;
 component.rateExpression.error = "SomeError";
 component.rateExpression.type= "cron"
 component.eventExpression.type =  undefined;
 component.invalidDomainName =false;
 component.invalidServiceName=false;
 component.approverName = "";
 
 expect(component.disableForm()).toBe(true);
});
it ("if EventExpressiontye is dynamoDb and DynamoDb is not defined then it should return true  ",()=>{
  //initialization 
 component.git_err = false;
 component.changeServiceType('function');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = true;
 component.rateExpression.error = undefined;
 component.eventExpression.type =  "dynamodb";
 component.invalidDomainName =false;
 component.invalidServiceName=false;
 component.approverName = "";
 
 expect(component.disableForm()).toBe(true);
});
it ("disable function should return true if Servicename is invalid  ",()=>{
  //initialization 
 component.git_err = false;
 component.changeServiceType('api');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = true;
 component.rateExpression.error = undefined;
 component.eventExpression.type =  undefined;
 component.invalidDomainName =false;
 component.invalidServiceName=true;
 component.approverName = "";
 
 expect(component.disableForm()).toBe(true);
});
 
it ("disable function should return true for invalid Domain name",()=>{
  //initialization 
 component.git_err = false;
 component.changeServiceType('api');
 component.selectedApprovers =[{
   displayName: "Approver1",
   givenName: "Approver1",
   userId: "AP1",
   userEmail: "ap1@moonraft.com"
 }]

 component.serviceAvailable = true;
 component.rateExpression.error = undefined;
 component.eventExpression.type =  undefined;
 component.invalidDomainName =true;
 component.invalidServiceName=false;
 component.approverName = "";

 
 expect(component.disableForm()).toBe(true);
});
// ---------------__Dhanush_----------------------
it('change platform type', () => {
  component.disablePlatform = false;
  component.changePlatformType("aws");
  expect(component.typeOfPlatform).toEqual("aws");
  });
  
  it('change selection', () => {
  component.onSelectionChange("node");
  expect(component.runtime).toEqual("node");
  });
  it ('Validate Service name should give true if servicename is available', <any> fakeAsync(() => {
    component.serviceAvailable = false;
    component.model.serviceName = "testing";
    component.model.domainName = "jazz";
    let fakeResponse = {
      data: {
        available:true
      }
    }
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Response(<ResponseOptions>{
        body: JSON.stringify(fakeResponse)
      }));
    });
    
    component.validateServiceName(); 
    tick()
    expect(component.serviceAvailable).toBe(true);
    expect(component.serviceNotAvailable).toBe(false);

  })); 
  it ('Validate Service name should give false if servicename is notavailable', <any> fakeAsync(() => {
    component.serviceAvailable = false;
    component.model.serviceName = "testing";
    component.model.domainName = "jazz";
    let fakeResponse = {
      data: {
        available:false
      }
    }
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Response(<ResponseOptions>{
        body: JSON.stringify(fakeResponse)
      }));
    });
    
    component.validateServiceName(); 
    tick()
    expect(component.serviceAvailable).toBe(false);
    expect(component.serviceNotAvailable).toBe(true);

  })); 

  it ('Validate Service name should give false if servicename availablity is not defined ', <any> fakeAsync(() => {
    component.serviceAvailable = false;
    component.model.serviceName = "testing";
    component.model.domainName = "jazz";
    let fakeResponse = {
      data: {
        available:undefined
      }
    }
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Response(<ResponseOptions>{
        body: JSON.stringify(fakeResponse)
      }));
    });
    
    component.validateServiceName(); 
    tick()
    expect(component.serviceAvailable).toBe(false);
    expect(component.serviceNotAvailable).toBe(false);

  })); 
  it ('Validate Service name should handle Http Error scenario', <any> fakeAsync(() => {
    component.serviceAvailable = false;
    component.model.serviceName = "testing";
    component.model.domainName = "jazz";
    let fakeResponse = {
      data: {
        available:true
      }
    }
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Error("Sample Error"));
    });
    
    component.validateServiceName(); 
    tick()
    expect(component.serviceAvailable).toBe(false);
    expect(component.serviceNotAvailable).toBe(false);
    expect(component.showLoader).toBe(false);

  })); 
  it("closeCreateservice Should emit the output event onClose",()=>{
    spyOn(component.onClose,"emit")
    component.closeCreateService(false);
    expect(component.onClose.emit).toHaveBeenCalled();
    expect(component.serviceRequested).toBe(false);
    expect(component.serviceRequestFailure).toBe(false);
    expect(component.serviceRequestSuccess).toBe(false);
    
  })  
 
 
  it("OnSubmit should call create service  and should reset the values to default ",()=>{
    spyOn(component,"createService")
    component.onSubmit();
    expect(component.createService).toHaveBeenCalled();
    expect(component.vpcSelected).toBe(false);
    expect(component.publicSelected).toBe(false);
    expect(component.cdnConfigSelected).toBe(false);
    expect(component.gitprivateSelected).toBe(false);
    expect(component.gitCloneSelected).toBe(false);
  })
  it("Generate Expression should rate Expression error to undefined if rate Expression is NOT undefined ",()=>{
    component.generateExpression(component.rateExpression)
    expect(component.rateExpression.error).toBeUndefined
  })
  it("Generate Expression should change rateExpression.isvalid to undefined if function called with undefined rate expression or if rateexpression.type is none",()=>{
    component.generateExpression(undefined);
    expect(component.rateExpression.isValid).toBeUndefined;
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.isValid= true;
    component.rateExpression.isValid = false;
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBeUndefined
  });
  it("GenerateExpression should change rateExpression.isvalid to false and rateExpression.error to error message if rateExpression.type is rate and duration is not defined",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration=undefined;
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(false)
    expect(component.rateExpression.error).toContain("Please enter a valid duration");
  } )
  it("GenerateExpression should change rateExpression.isvalid to false and rateExpression.error to error message if rateExpression.type is rate and duration is null",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration=null;
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(false)
    expect(component.rateExpression.error).toContain("Please enter a valid duration");
  } )
  it("GenerateExpression should change rateExpression.isvalid to false and rateExpression.error to error message if rateExpression.type is rate and duration is less than zero",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration= "-1";
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(false)
    expect(component.rateExpression.error).toContain("Please enter a valid duration");
  } )
  it("GenerateExpression should create cron object and change rateExpression.isvalid to true if duration is valid and interval is set to minutes",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration= "5";
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(true)
    expect(component.cronObj).toBeDefined;
    expect(component.rateExpression.cronStr).not.toBeUndefined;
   
  })
  it("GenerateExpression should create cron object and change rateExpression.isvalid to true if duration is valid and interval is set to Hours",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration= "5";
    temp.interval='Hours';
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(true)
    expect(component.cronObj).toBeDefined;
    expect(component.rateExpression.cronStr).not.toBeUndefined;
   
  })
  it("GenerateExpression should create cron object and change rateExpression.isvalid to true if duration is valid and interval is set to days",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "rate";
    temp.duration= "5";
    temp.interval='Days';
    component.generateExpression(temp);
    expect(component.rateExpression.isValid).toBe(true)
    expect(component.cronObj).toBeDefined;
    expect(component.rateExpression.cronStr).not.toBeUndefined;
   
  })
  it("GetExpression should create cron string if rateexpression.type is cron ",()=>{
    let temp = new RateExpression(undefined, undefined, 'none', '5', "Minutes", '');
    temp.type= "cron";
    temp.duration= "5";
    temp.interval='Days';
    component.cronObj = new CronObject(('0/' + 5),'*','*','*','?','*');
    component.generateExpression(temp);
    console.log("cron error : ", component.rateExpression.cronStr);
  })
// KeyPress 
  it("KeyPress with arrowdown button should increment the focus index by 1",()=>{
    component.typeOfService ='api';
    let hash =  {key:'ArrowDown'};
    component.focusindex = 2;
    component.keypress(hash);
    expect(component.focusindex).toBe(3);
  })
  it("KeyPress with arrowUp button should decrement the focus index by 1",()=>{
    component.typeOfService ='api';
    let hash =  {key:'ArrowUp'};
    component.focusindex = 2;
    component.keypress(hash);
    expect(component.focusindex).toBe(1);
  })
  it("KeyPress with arrowUp button should not decrement the focus index by 1 if the focus index is -1",()=>{
    component.typeOfService ='api';
    let hash =  {key:'ArrowUp'};
    component.focusindex = -1;
    component.keypress(hash);
    expect(component.focusindex).toBe(-1);
  })
// KEYPRESS 2 
it("KeyPress with arrowdown button should increment the focus index by 1",()=>{
  component.typeOfService ='api';
  let hash =  {key:'ArrowDown'};
  component.focusindex = 2;
  component.keypress2(hash);
  expect(component.focusindex).toBe(0);
})
it("KeyPress with arrowUp button should decrement the focus index by 1",()=>{
  component.typeOfService ='api';
  let hash =  {key:'ArrowUp'};
  component.focusindex = 2;
  component.keypress2(hash);
  expect(component.focusindex).toBe(1);
})
it("KeyPress with arrowUp button should not decrement the focus index by 1 if the focus index is -1",()=>{
  component.typeOfService ='api';
  let hash =  {key:'ArrowUp'};
  component.focusindex = -1;
  component.keypress2(hash);
  expect(component.focusindex).toBe(-1);
})

  it('user must be able to change platform type', () => {
    component.disablePlatform = false;
    component.changePlatformType("aws");
    expect(component.typeOfPlatform).toEqual("aws");
  });

  it('user must be able to change selection', () => {
    component.onSelectionChange("node");
    expect(component.runtime).toEqual("node");
  });

  it('checking if the domain name is entered', () => {
    component.checkdomainName();
    if(component.model.domainName == "jazz"){
      expect(component.isDomainDefined).toBe(true);
    }else if(component.model.domainName == undefined){
      expect(component.isDomainDefined).toBe(true);
    }
});


it ('checking if the entered service name is valid', async(() => {
    component.serviceAvailable = false;
    if(component.model.serviceName == "testing" && component.model.domainName == "jazz"){
    component.validateServiceName(); 
    fixture.detectChanges();
    fixture.whenStable().then(()=>{
    expect(component.serviceAvailable).toBe(false)
    });
  }else if(component.model.serviceName == "assets" && component.model.domainName == "platform"){
    component.validateServiceName(); 
    fixture.detectChanges();
    fixture.whenStable().then(()=>{
    expect(component.serviceAvailable).toBe(false)
    });
  }
  })); 

it('checking if the slack channel is available  for valid input', <any> fakeAsync(() => {
    component.slackAvailble = false;
    let fakeResponse = {
      data: {
        is_available:true
      }
    }
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Response(<ResponseOptions>{
        body: JSON.stringify(fakeResponse)
      }));
    });
    component.model.serviceName == "myslack"
    component.validateChannelName();
    tick();
    expect(component.slackAvailble).toBe(true) ;
    expect(component.slackNotAvailble).toBe(false);
  
}));
it('checking if the slack channel is available  for invalid input', <any> fakeAsync(() => {
  component.slackAvailble = false;
  let fakeResponse = {
    data: {
      is_available:false
    }
  }
  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fakeResponse)
    }));
  });
  component.model.serviceName == "myslack"
  component.validateChannelName();
  tick();
  expect(component.slackAvailble).toBe(false) ;
  expect(component.slackNotAvailble).toBe(true);
}));
it('checking if the slack channel is available is not defined ', <any> fakeAsync(() => {
  component.slackAvailble = false;
  let fakeResponse = {
    data: {
      is_available:undefined
    }
  }
  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fakeResponse)
    }));
  });
  component.model.serviceName == "myslack"
  component.validateChannelName();
  tick();
  expect(component.slackAvailble).toBe(false) ;
  expect(component.slackNotAvailble).toBe(false);
}));
it('ValidateChannel  name should handle Http error scenario', <any> fakeAsync(() => {
  component.slackAvailble = false;
  let fakeResponse = {
    data: {
      is_available:false
    }
  }
  backend.connections.subscribe(connection => {
    connection.mockRespond(new Error(
      "Sample Error"
    )
  )});
  component.model.serviceName == "myslack"
  component.validateChannelName();
  tick();
  expect(component.slackChannelLoader ).toBe(false) ;

}));
it("Get Data function should update the approver list ",<any> fakeAsync(()=>{
  let fresponse ={
   data:  {
    values: [
    {
      displayName: "Approver1",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ]}
};
spyOn(component, "getUserDetails");
  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fresponse)
    }));
  });
  component.getData();
  tick();
  expect(component.approversList).toContain({
    displayName: "Approver3",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  })
  }));

  it("Get Data function should update the approver list ",<any> fakeAsync(()=>{
    let fresponse ={
     data:  {
      values: [
      {
        displayName: "Approver1",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      },
      {
        displayName: "Approver3",
        givenName: "Approver1",
        userId: "AP1",
        userEmail: "ap1@moonraft.com"
      }
    ]}
  };
  spyOn(component, "getUserDetails");
    backend.connections.subscribe(connection => {
      connection.mockRespond(new Error());
    });
    component.getData();
    expect(component.resMessage).toBeDefined;
  }));

it("Create service should create Service for valid input set for api",<any> fakeAsync(()=>{
  component.selectedApprovers =  [{
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  },
  {
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  }];
  let fakeResponse ={
    "data": {
    "message": "Service creation is triggered successfully, your code will be available shortly!",
    "request_id": "4bb7a117-4e7e-431b-950a-53fb78518fa6"
    },
    "input": {
    "service_type": "api",
    "service_name": "testing-service",
    "approvers": ["VBansal1"],
    "domain": "jazztest",
    "description": "",
    "runtime": "nodejs",
    "require_internal_access": false,
    "is_public_endpoint": false
    }
    };
  component.typeOfService =  'api';
  component.model.serviceName = 'sampleService';
  component.model.domainName = 'sampleDomain';
  component.model.serviceDescription =  "sampleDescription";
  component.runtime = 'nodejs';
  component.vpcSelected = false;
  component.publicSelected = true;

  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fakeResponse)
    }));
  });
  component.createService();
  tick()
  expect(component.serviceRequested).toBe(true);
  expect(component.serviceRequestSuccess).toBe(true);
  expect(component.serviceRequestFailure).toBe(false);
  expect(component.isLoading).toBe(false);

}));

it("Create service should create Service for valid input set for functions",<any> fakeAsync(()=>{
  component.selectedApprovers =  [{
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  },
  {
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  }];
  let fakeResponse ={
    "data": {
    "message": "Service creation is triggered successfully, your code will be available shortly!",
    "request_id": "4bb7a117-4e7e-431b-950a-53fb78518fa6"
    },
    "input": {
    "service_type": "api",
    "service_name": "testing-service",
    "approvers": ["VBansal1"],
    "domain": "jazztest",
    "description": "",
    "runtime": "nodejs",
    "require_internal_access": false,
    "is_public_endpoint": false
    }
    };
  component.typeOfService =  'function';
  component.rateExpression.type = 'none';
  component.eventExpression.type='awsEventsNone';
  component.model.serviceName = 'sampleService';
  component.model.domainName = 'sampleDomain';
  component.model.serviceDescription =  "sampleDescription";
  component.runtime = 'nodejs';
  component.vpcSelected = false;
  component.publicSelected = true;

  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fakeResponse)
    }));
  });
  component.createService();
  tick()
  expect(component.serviceRequested).toBe(true);
  expect(component.serviceRequestSuccess).toBe(true);
  expect(component.serviceRequestFailure).toBe(false);
  expect(component.isLoading).toBe(false);
}));

it("Create service should create Service for valid input set for website",<any> fakeAsync(()=>{
  component.selectedApprovers =  [{
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  },
  {
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  }];
  let fakeResponse ={
    "data": {
    "message": "Service creation is triggered successfully, your code will be available shortly!",
    "request_id": "4bb7a117-4e7e-431b-950a-53fb78518fa6"
    },
    "input": {
    "service_type": "website",
    "service_name": "testing-service",
    "approvers": ["VBansal1"],
    "domain": "jazztest",
    "description": "",
    "runtime": "nodejs",
    "require_internal_access": false,
    "is_public_endpoint": false
    }
    };
  component.typeOfService =  'website';
  component.gitCloneSelected = true;
  component.git_url ='sample Url'
  component.git_private = true;
  component.gitusername = "sampleUser";
  component.gituserpwd ="samplePwd";
  component.model.serviceName = 'sampleService';
  component.model.domainName = 'sampleDomain';
  component.model.serviceDescription =  "sampleDescription";
  component.runtime = 'nodejs';
  component.vpcSelected = false;
  component.publicSelected = true;

  backend.connections.subscribe(connection => {
    connection.mockRespond(new Response(<ResponseOptions>{
      body: JSON.stringify(fakeResponse)
    }));
  });
  component.createService();
  tick()
  expect(component.serviceRequested).toBe(true);
  expect(component.serviceRequestSuccess).toBe(true);
  expect(component.serviceRequestFailure).toBe(false);
  expect(component.isLoading).toBe(false);
}));



it("Create Service should handle error  http call  ",<any> fakeAsync(()=>{
  component.selectedApprovers =  [{
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  },
  {
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  }];
  let fakeResponse ={
    "data": {
    "message": "Service creation is triggered successfully, your code will be available shortly!",
    "request_id": "4bb7a117-4e7e-431b-950a-53fb78518fa6"
    },
    "input": {
    "service_type": "website",
    "service_name": "testing-service",
    "approvers": ["VBansal1"],
    "domain": "jazztest",
    "description": "",
    "runtime": "nodejs",
    "require_internal_access": false,
    "is_public_endpoint": false
    }
    };
  component.typeOfService =  'website';
  component.gitCloneSelected = true;
  component.git_url ='sample Url'
  component.git_private = true;
  component.gitusername = "sampleUser";
  component.gituserpwd ="samplePwd";
  component.model.serviceName = 'sampleService';
  component.model.domainName = 'sampleDomain';
  component.model.serviceDescription =  "sampleDescription";
  component.runtime = 'nodejs';
  component.vpcSelected = false;
  component.publicSelected = true;

  backend.connections.subscribe(connection => {
    connection.mockRespond(new Error(
      "sample Error"
    ));
  });
  component.createService();
  tick();
  expect(component.serviceRequested).toBe(true);
  expect(component.serviceRequestSuccess).toBe(false);
  expect(component.serviceRequestFailure).toBe(true);
  expect(component.isLoading).toBe(false);
}));




it('validating onSelectedDr function', <any>fakeAsync(() => {
  component.onSelectedDr("Minutes");
  expect(component.generateExpression(this.rateExpression)).toHaveBeenCalled;
}));

it('validating onServiceChange function',() => {
  component.onServiceChange();
  expect(component.isDomainDefined).toBe(false);
  expect(component.serviceNameError).toBe(false);
  expect(component.serviceAvailable).toBe(false);
  expect(component.serviceNotAvailable).toBe(false);
});

it('validating onApproverChange function',() => {
  let newVal;
  if(newVal == "vban"){
  component.onApproverChange(newVal);
  expect(component.showApproversList).toBe(true);
  }else if(newVal == undefined){
    component.onApproverChange(newVal);
    expect(component.showApproversList).toBe(false);
  }
});

it('validating onApproverChange2 function',() => {
  let newVal;
  if(newVal == "vban"){
  component.onApproverChange2(newVal);
  expect(component.showApproversList2).toBe(true);
  }else if(newVal == undefined){
    component.onApproverChange2(newVal);
    expect(component.showApproversList2).toBe(false);
  }
});

it('validating checkSlackNameAvailability function',() => {
  component.model.slackName = "abcd";
  
  component.checkSlackNameAvailability();

  expect(component.validateChannelName()).toHaveBeenCalled;
});


it('validating onTTLChange function',() => {

  component.model.ttlValue = "100";
  component.onTTLChange();
  expect(component.invalidttl).toBe(false);
  
  component.model.ttlValue = "10000";
  component.onTTLChange();
  expect(component.invalidttl).toBe(true);
  
  component.model.ttlValue = undefined;
  component.onTTLChange();
  expect(component.invalidttl).toBe(true);
  
});

it('validating validateName function',() => {
  component.model.serviceName = "testing";
  component.validateName(true);
  expect(component.firstcharvalidation).toEqual("NaN");

  component.model.serviceName = "1testing";
  component.validateName(true);
  expect(component.invalidServiceName).toEqual(true);

  component.model.domainName = "testing";
  component.validateName(true);
  expect(component.firstcharvalidation).toEqual("NaN");

  component.model.domainName = "1testing";
  component.validateName(true);
  expect(component.invalidDomainName).toEqual(true);

  component.model.serviceName = "-testing-";
  component.validateName(true);
  expect(component.invalidServiceName).toEqual(true);

  component.model.domainName = "-testing-";
  component.validateName(true);
  expect(component.invalidDomainName).toEqual(true);
});

it("backtoCreate service should reset the values to inital stage ",()=>{
  component.approversList = [
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
  component.selApprover =   {
    displayName: "Approver1",
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  };
  component.backToCreateService();
  expect(component.approversList).toContain(component.selApprover);
  expect(component.serviceRequested).toBe(false);
  expect(component.serviceRequestSuccess).toBe(false);
  expect(component.serviceRequestFailure).toBe(false);
})
it("canclecreateslack should reset the values",()=>{
/*
this.createslackSelected = false;
    this.createSlackModel.name = '';
    this.createSlackModel.purpose = '';
    this.createSlackModel.invites = '';
    for (var i = 0; i < this.selectedApprovers2.length; i++) {
      this.approversList2.push(this.selectedApprovers2[i]);
    }
    this.selectedApprovers2 = [];
  }
  *///
  component.approversList2 = [];
  component.selectedApprovers2=[
    {
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    },
    {
      displayName: "Approver3",
      givenName: "Approver1",
      userId: "AP1",
      userEmail: "ap1@moonraft.com"
    }
  ];
  component.cancelCreateSlack()
  expect(component.createSlackModel.name).toBe('');
  expect(component.createSlackModel.purpose).toBe('');
  expect(component.createSlackModel.invites).toBe('');
  expect(component.approversList2).toContain({
    givenName: "Approver1",
    userId: "AP1",
    userEmail: "ap1@moonraft.com"
  });
  
});

});






