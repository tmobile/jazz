/**
 * @type Component
 * @desc create service component
 * @author
 */
import {Http, Headers, Response} from '@angular/http';
import {Component, Input, OnInit, Output, EventEmitter, NgModule, ViewChild} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ServiceFormData, RateExpression, CronObject, EventExpression} from './service-form-data';
import {FocusDirective} from './focus.directive';
import {CronParserService} from '../../core/helpers';
import {ToasterService} from 'angular2-toaster';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Rx';
import {ServicesListComponent} from "../../pages/services-list/services-list.component";
import {environment as env_oss} from '../../../environments/environment.oss';
import {AuthenticationService, DataCacheService, MessageService, RequestService} from "../../core/services";
import {UtilsService} from "../../core/services/utils.service";
import {CreateServiceUtilsService} from "../create-service-utils.service";
import {environment} from '../../../environments/environment';

@Component({
  selector: 'create-service',
  templateUrl: './create-service.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./create-service.component.scss']
})


export class CreateServiceComponent implements OnInit {

  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('eventSchedule') eventSchedule;
  @ViewChild('awsEvents') awsEvents;
  @ViewChild('customForm') customForm;
  public environment = environment;
  public serviceTypeOptions;
  public platformOptions;
  public runtimeOptions;
  public eventScheduleOptions;
  public awsEventsOptions;
  public createServiceForm: any;
  public createServiceFormValid: boolean;
  public createServiceState: string;
  public submittedMessage: string;
  public namespaceMessage: string;
  public serviceNameMessage: string;
  public slackChannelMessage: string;
  public toastmessage;
  public isLoading: boolean = false;
  public availabilityLoader = false;
  public availabilityLoaderSlack = false;
  public toast;

  public allowSlackIntegration = false;
  public allowCacheTTL = false;
  public allowCDN = false;
  public allowAWSEvents = false;

  private specialCharRegex = new RegExp(/^[A-Za-z0-9\-]+$/);
  private doubleHyphenRegex = new RegExp('--', 'g');
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', '30', '');

  constructor(
    private toasterService: ToasterService,
    private cronParserService: CronParserService,
    private http: RequestService,
    private cache: DataCacheService,
    private messageservice: MessageService,
    private servicelist: ServicesListComponent,
    private authenticationservice: AuthenticationService,
    private utils: UtilsService,
    private createServiceUtils: CreateServiceUtilsService
  ) {
    this.initializeForm();
    this.toastmessage = messageservice;
  }

  initializeForm() {
    this.serviceTypeOptions = this.createServiceUtils.defineServiceTypesRadio();
    this.platformOptions = this.createServiceUtils.definePlatformsRadio();
    this.runtimeOptions = this.createServiceUtils.defineRuntimeRadio();
    this.eventScheduleOptions = this.createServiceUtils.defineEventScheduleRadio();
    this.awsEventsOptions = this.createServiceUtils.defineAWSEventsRadio();
    this.createServiceForm = {
      type: 'api',
      platform: 'aws',
      runtime: 'nodejs',
      serviceName: '',
      namespace: '',
      enableSlack: false,
      slackChannelName: '',
      eventSchedule: 'none',
      enableCaching: false,
      cacheTTL: 3600,
      cdnConfigured: false,
      rateExpression: '',
      rateExpressionType: 'none',
      awsEventsType: 'awsEventsNone',
      events: undefined
    };

    this.namespaceMessage = '';
    this.serviceNameMessage = '';
    this.slackChannelMessage = '';
    this.availabilityLoader = false;
    this.createServiceFormValid = false;
    this.createServiceState = 'form';
    this.submittedMessage = '';
    this.isLoading = false;
  }

  validateServiceName(blurEvent?) {
    let service = this.createServiceForm.serviceName;
    this.serviceNameMessage = '';
    if (!service) {
      this.serviceNameMessage = 'error-empty';
    } else if (!service.match(this.specialCharRegex)) {
      this.serviceNameMessage = 'error-characters';
    } else if (service.match(this.doubleHyphenRegex)) {
      this.serviceNameMessage = 'error-characters';
    } else if (service[0] === '-' || service[service.length - 1] === '-') {
      this.serviceNameMessage = 'error-characters'
    } else {
      this.serviceNameMessage = 'valid';
    }

    if (~this.namespaceMessage.indexOf('valid') && ~this.serviceNameMessage.indexOf('valid')) {
      return this.checkServiceNameAvailability();
    }
  }

  validateNamespace(blurEvent?) {
    let namespace = this.createServiceForm.namespace;
    this.namespaceMessage = '';
    if (!namespace) {
      this.namespaceMessage = 'error-empty';
    } else if (!namespace.match(this.specialCharRegex)) {
      this.namespaceMessage = 'error-character'
    } else if (namespace.match(this.doubleHyphenRegex)) {
      this.namespaceMessage = 'error-character';
    } else if (namespace[0] === '-' || namespace[namespace.length - 1] === '-') {
      this.namespaceMessage = 'error-hyphens';
    } else {
      this.namespaceMessage = 'valid';
    }
    if (~this.namespaceMessage.indexOf('valid') && ~this.serviceNameMessage.indexOf('valid')) {
      return this.checkServiceNameAvailability();
    } else if (this.serviceNameMessage === 'success-valid-available') {
      this.serviceNameMessage = 'valid-available';
    }


  }

  checkServiceNameAvailability() {
    this.availabilityLoader = true;
    return this.createServiceUtils.validateServiceNameAvailable(this.createServiceForm.serviceName, this.createServiceForm.namespace)
      .then((available) => {
        this.availabilityLoader = false;
        this.serviceNameMessage = available ? 'success-valid-available' : 'error-valid-unavailable';
        this.namespaceMessage = available ? 'success-valid-available' : 'error-valid-unavailable';
      })
      .catch((error) => {
        this.availabilityLoader = false;
        this.serviceNameMessage = '';
        this.namespaceMessage = '';
        let message = this.toastmessage.errorMessage(error, 'serviceAvailability');
        this.toast_pop('error', 'Oops!', message);
      });
  }

  validateSlackChannel() {
    let channel = this.createServiceForm.slackChannelName;
    if (!channel) {
      this.slackChannelMessage = 'error-empty';
    } else if (!channel.match(this.specialCharRegex)) {
      this.slackChannelMessage = 'error-character'
    } else if (channel.match(this.doubleHyphenRegex)) {
      this.slackChannelMessage = 'error-validation';
    } else if (channel[0] === '-' || channel[channel.length - 1] === '-') {
      this.slackChannelMessage = 'error-hyphens';
    } else {
      this.availabilityLoaderSlack = true;
      return this.createServiceUtils.validateSlackChannelAvailable(this.createServiceForm.slackChannelName)
        .then((available) => {
          this.availabilityLoaderSlack = false;
          this.slackChannelMessage = available ? 'success-available' : 'error-unavailable';
        })
        .catch((error) => {
          this.availabilityLoaderSlack = false;
          this.slackChannelMessage = 'error-validation';
          let message = this.toastmessage.errorMessage(error, 'slackChannel');
          this.toast_pop('error', 'Oops!', message);
        });
    }
  }

  validateCreateServiceForm() {
    let isValid = true;
    if (this.serviceNameMessage !== 'success-valid-available' ||
      this.namespaceMessage !== 'success-valid-available') {
      isValid = isValid && false;
    }

    if (this.createServiceForm.enableSlack) {
      isValid = isValid && this.slackChannelMessage === 'success-available';
    }

    if (this.createServiceForm.rateExpressionType) {
      isValid = isValid && this.eventSchedule.isExpressionValid();
    }

    isValid = isValid && this.customForm.formIsValid();

    this.createServiceFormValid = isValid;
    return isValid;
  }

  submitCreateService() {
    this.isLoading = true;
    if (!this.createServiceFormValid) return;
    let createServiceForm = this.createServiceForm;
    let payload = {
      "approvers": [],
      "service_type": createServiceForm.type,
      "service_name": createServiceForm.serviceName,
      "domain": createServiceForm.namespace,
      "description": createServiceForm.description,
      "runtime": createServiceForm.runtime,
      "cache_ttl": (createServiceForm.enableCaching && createServiceForm.cacheTTL) || undefined,
      "create_cloudfront_url": createServiceForm.cdnConfigured || undefined,
      "slack_channel": createServiceForm.slack_channel || undefined,
      "events": createServiceForm.events || undefined,
      "rateExpression": (createServiceForm.rateExpressionType !== 'none') ? createServiceForm.rateExpression : undefined
    };
    this.customForm.applyFormFields(payload);

    return this.createServiceUtils.createServerlessService(payload)
      .then((response) => {
        this.isLoading = false;
        this.createServiceState = 'success';
        this.submittedMessage = this.toastmessage.successMessage(response, "createService");
      })
      .catch((error) => {
        this.isLoading = false;
        this.createServiceState = 'error';
        this.submittedMessage = this.toastmessage.errorMessage(error, 'createService');
      });
  }

  setEventSchedule(cronExpression) {
    this.createServiceForm.rateExpression = cronExpression;
  }

  setAWSEvents(event) {

    this.createServiceForm.events = [event];
  }

  closeCreateService(refreshList?) {
    this.initializeForm();
    this.onClose.emit(refreshList);
  }

  toast_pop(error, oops, errorMessage) {
    let tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toast = this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 6000);
  }

  ngOnInit() {
  };

}
