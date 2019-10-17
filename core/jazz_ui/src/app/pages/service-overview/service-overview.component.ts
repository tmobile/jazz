/**
 * @type Component
 * @desc Service overview page
 * @author
 */

import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from '../../core/services/index';
import { ToasterService } from 'angular2-toaster';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { ServiceDetailComponent } from '../service-detail/service-detail.component'
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';
import { environment as env_oss } from './../../../environments/environment.oss';
import { ServiceFormData, RateExpression, CronObject, EventExpression } from './../../secondary-components/create-service/service-form-data';
import { CronParserService } from '../../core/helpers';

declare var $: any;

@Component({
  selector: 'service-overview',
  templateUrl: './service-overview.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['../service-detail/service-detail.component.scss', './service-overview.component.scss']
})

export class ServiceOverviewComponent implements OnInit {
  @ViewChild('env') envComponent;

  @Output() onload: EventEmitter<any> = new EventEmitter<any>();
  @Output() onEnvGet: EventEmitter<any> = new EventEmitter<any>();
  @Output() open_sidebar: EventEmitter<any> = new EventEmitter<any>();

  flag: boolean = false;
  @Input() service: any = {};
  @Input() isLoadingService: boolean = false;
  @Input() isAdminAccess:boolean = false;
  @Input() provider: any;
  private subscription: any;

  multiENV: boolean = true;
  list_env = []
  list_inactive_env = [];
  copyLink: string = 'Copy Link';
  disp_edit: boolean = true;
  hide_email_error: boolean = true;
  hide_slack_error: boolean = true;
  service_error: boolean = true;
  disp_show: boolean = true;
  disp_show2: boolean = true;
  err404: boolean = false;
  disable_button: boolean = false;
  email_valid: boolean;
  slack_valid: boolean;
  response_json: any;
  show_loader: boolean = false;
  plc_hldr: boolean = true;
  status_empty: boolean;
  description_empty: boolean;
  approvers_empty: boolean;
  domain_empty: boolean;
  serviceType_empty: boolean;
  email_empty: boolean;
  slackChannel_empty: boolean;
  repository_empty: boolean;
  runtime_empty: boolean = false;
  tags_empty: boolean;
  ErrEnv: boolean = false;
  accounts = env_internal.urls.accounts;
  regions = env_internal.urls.regions;
  errMessage = ''
  tags_temp: string = '';
  desc_temp: string = '';
  bitbucketRepo: string = "";
  initialRateInterval: string = "";
  initialDuration: string = "";
  repositorylink: string = "";
  islink: boolean = false;
  showCancel: boolean = false;
  private toastmessage: any = '';
  private http: any;
  statusCompleted: boolean = false;
  serviceStatusCompleted: boolean = false;
  serviceStatusPermission: boolean = false;
  serviceStatusRepo: boolean = false;
  serviceStatusValidate: boolean = false;
  serviceStatusCompletedD: boolean = false;
  serviceStatusPermissionD: boolean = false;
  serviceStatusRepoD: boolean = false;
  serviceStatusValidateD: boolean = false;
  serviceStatusStarted: boolean = true;
  serviceStatusStartedD: boolean = false;
  statusFailed: boolean = false;
  rateData: any = ['minutes', 'hours', 'days', 'minute', 'hour', 'day'];
  statusInfo: string = 'Service Creation started';
  private intervalSubscription: Subscription;
  swaggerUrl: string = '';
  baseUrl: string = '';
  update_payload: any = {};
  payloag_tags = [];
  service_request_id: any;
  creation_status: string;
  statusprogress: number = 20;
  validrate: boolean = false;
  animatingDots: any;
  noStg: boolean = false;
  noProd: boolean = false;
  DelstatusInfo: string = 'Deletion Started';
  creating: boolean = false;
  deleting: boolean = false;
  showcanvas: boolean = false;
  errBody: any;
  parsedErrBody: any;
  errorTime: any;
  errorURL: any;
  errorAPI: any;
  errorRequest: any = {};
  errorResponse: any = {};
  errorUser: any;
  envList = ['prod', 'stg'];
  friendlist = ['prod', 'stg'];
  errorChecked: boolean = true;
  errorInclude: any = "";
  json: any = {};
  errorcase: boolean = false;
  Nerrorcase: boolean = true;
  reqJson: any = {};
  createloader: boolean = true;
  showbar: boolean = false;
  friendly_name: any;
  list: any = {};
  publicSelected: boolean = this.service.is_public_endpoint;
  publicInitial: boolean = this.service.is_public_endpoint;
  cdnConfigSelected: boolean = this.service.create_cloudfront_url;
  cdnConfigInitial: boolean = this.service.create_cloudfront_url;
  saveClicked: boolean = false;
  advancedSaveClicked: boolean = false;
  isSlackAvailable: boolean = true;
  isPUTLoading: boolean = false;
  PutPayload: any;
  isPayloadAvailable: boolean = false;
  selected: string = "minutes";
  eventSchedule: string = 'fixedRate';
  cronObj = new CronObject('0/5', '*', '*', '*', '?', '*')
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', this.selected, '', '');
  eventExpression = new EventExpression("awsEventsNone", undefined, undefined, undefined, undefined);
  viewMode: boolean = true;
  cronFieldValidity: any;
  showGeneralField: boolean = false;
  editEvents: boolean = false;
  generalAdvanceDisable: boolean = true;
  eventDisable  : boolean = true;
  accountName: any;
  previousInt: any;
  previousrate: any;
  previousRateVal: any;
  previouscron: any;
  previoustype: any;

  constructor(
    private router: Router,
    private request: RequestService,
    public messageservice: MessageService,
    private cronParserService: CronParserService,
    private cache: DataCacheService,
    private toasterService: ToasterService,
    private serviceDetail: ServiceDetailComponent,
    private authenticationservice: AuthenticationService
  ) {
    this.http = request;
    this.toastmessage = messageservice;
  }

  email_temp: string;
  isenvLoading: boolean = false;
  token: string;
  noSubEnv: boolean = false;
  noEnv: boolean = false;
  slackChannel_temp: string;
  slackChannel_link: string = '';
  edit_save: string = 'EDIT';
  activeEnv: string = 'dev';
  Environments = [];
  environ_arr = [];
  endpList: any;
  prodEnv: any;
  stgEnv: any;
  status: string = this.service.status;

  copy_link(id) {
    var element = null; // Should be <textarea> or <input>
    element = document.getElementById(id);
    element.select();
    try {
      document.execCommand("copy");
      this.copyLink = "Link Copied";
      setTimeout(() => {
        this.copyLink = "Copy Link";
      }, 3000);
    } finally {
      document.getSelection().removeAllRanges;
    }
  }
  openLink(link) {
    if (link) {
      window.open(link, "_blank");

    }
  }

  stageClicked(stg) {

    let url = '/services/' + this.service['id'] + '/' + stg
    this.router.navigateByUrl(url);

  }

  ValidURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    } else {
      return true;
    }
  }

  showService(s) {

  }

  loadPlaceholders() {
    if (this.service.tags != undefined) this.tags_temp = this.service.tags.join();
    this.desc_temp = this.service.description;
    this.email_temp = this.service.email;
    this.slackChannel_temp = this.service.slackChannel;
  }

  updateTags() {
    var payloag_tags;
    payloag_tags = this.tags_temp.split(',');
    payloag_tags.forEach(function (item, index) {
      payloag_tags[index] = item.trim();
    });
    this.update_payload.tags = payloag_tags;

  }

  shouldSaveEnable(){
    if(this.desc_temp != this.service.description)
      this.generalAdvanceDisable = false;
    else
      this.generalAdvanceDisable = true;
    if(!this.hide_slack_error){
        this.generalAdvanceDisable = true;
    }
  }

  onSelectedDr(selected) {
    this.rateExpression.interval = selected;
    this.generateExpression(this.rateExpression);
  }

  openSidebar() {
    this.open_sidebar.emit(true);
  }

  onEditGeneral(){
    if (this.isAdminAccess) {
      this.onCancelClick();
      this.showGeneralField = true;
    }
  }

  private isCronObjValid(cronObj) {
    var cronValidity = this.cronParserService.validateCron(cronObj);
    this.cronFieldValidity = cronValidity;
    if (cronValidity.isValid === true) {
      return true;
    }
    return false;
  };

  validRate(val,int){
    if (val === 1) {
      if (int.includes('s')) {
        this.validrate = false;
      }
      else {
        this.validrate = true;
      }
    }
    else if(val > 1)
    {
      if(int.includes('s')){
        this.validrate = true;
      }
      else{
        this.validrate = false;
      }
    }
  }

  generateExpression(rateExpression) {
    if (this.rateExpression !== undefined) {
      this.rateExpression.error = undefined;
    }
    if (rateExpression === undefined || rateExpression['type'] === 'none') {
      this.rateExpression.isValid = undefined;
    } else if (rateExpression['type'] == 'rate') {
      var duration, interval;
      duration = rateExpression['duration'];
      interval = rateExpression['interval'];
      this.validRate(duration, interval);
      this.rateExpression.rateStr = `${duration} ${interval}`

      if (duration === undefined || duration === null || duration <= 0 || this.validrate === false) {
        this.rateExpression.isValid = false;
        this.eventDisable = true;
        this.rateExpression.error = 'Please enter a valid rate expression';
      } else {
        this.eventDisable = false;
        this.rateExpression.isValid = true;
      }
    } else if (rateExpression['type'] == 'cron') {
      var cronExpression;
      var cronObj = this.cronObj;
      var cronObjFields = this.cronParserService.cronObjFields;
      var _isCronObjValid = this.isCronObjValid(cronObj)

      if (_isCronObjValid === false) {
        this.eventDisable = true;
        this.rateExpression.isValid = false;
        this.rateExpression.error = 'Please enter a valid cron expression';
      } else {
        this.eventDisable = false;
        this.rateExpression.isValid = true;
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
      }
    }
    if (this.rateExpression.type === 'cron') {
      this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
      let tempExp = `cron(${this.rateExpression.cronStr})`;
      if( tempExp == this.service.eventScheduleRate){
        this.eventDisable = true;
      }
    }
    else if(this.rateExpression.type === 'rate') {
      let tempExp = `rate(${this.rateExpression.duration} ${this.rateExpression.interval})`;
      if( tempExp == this.service.eventScheduleRate) {
        this.eventDisable = true;
      }
    }
    if (this.rateExpression.isValid === undefined) {
      return undefined;
    } else if (this.rateExpression.isValid === false) {
      return 'invalid';
    } else if (this.rateExpression.isValid === true  && this.rateExpression.type === 'cron') {
      return this.rateExpression.cronStr;
    } else if (this.rateExpression.isValid === true && this.rateExpression.type === 'rate') {
      return this.rateExpression.rateStr;
    }
  }

  onEditClick() {
    this.loadPlaceholders();
    this.showGeneralField = false;
    this.disp_show = false;
  }

  onEditClickAdvanced() {
    this.disp_show2 = false;
    this.showGeneralField = false;
    this.publicSelected = this.publicInitial;
    this.cdnConfigSelected = this.cdnConfigInitial;

  }
  outSidePopup(){
    this.showGeneralField = false;
    this.saveClicked = false;
    this.advancedSaveClicked = false;
    this.onCancelClick();

  }

  onCompleteClick() {
    this.isPUTLoading = true;
    if(this.rateExpression.type === "none"){
      this.rateExpression.duration = "5";
      this.rateExpression.interval = "minutes";
      this.cronObj.minutes = "0/5";
      this.cronObj.hours = "*";
      this.cronObj.dayOfMonth = "*";
      this.cronObj.month = "*";
      this.cronObj.dayOfWeek = "?";
      this.cronObj.year = "*";
    }
    this.http.put('/jazz/services/' + this.service.id, this.PutPayload, this.service.id)
      .subscribe(
        (Response) => {
          this.isPUTLoading = false;
          this.showGeneralField = false;
          this.disp_show = true;
          this.disp_show2 =true;
          this.isLoadingService = true;
          this.serviceDetail.onDataFetched(Response.data.updatedService);
          this.isLoadingService = false;
          this.loadPlaceholders()
          this.disp_show = true;
          this.saveClicked = false;
          this.editEvents = false;
          this.advancedSaveClicked = false;
          let successMessage = this.toastmessage.successMessage(Response, "updateService");
          this.toast_pop('success', "", "Data for service: " + this.service.name + " " + successMessage);
        },
        (Error) => {
          this.isLoadingService = false;
          this.isPUTLoading = false;
          this.disp_show = true;
          this.saveClicked = false;
          this.editEvents = false;
          this.advancedSaveClicked = false;
          this.edit_save = 'SAVE';
          let errorMessage = this.toastmessage.errorMessage(Error, "updateService");
          this.toast_pop('error', 'Oops!', errorMessage)
          // this.toast_pop('error','Oops!', "Data cannot be updated. Service Error.");
        });


  }

  onAdvancedSaveClick() {
    this.saveClicked = false;
    this.advancedSaveClicked = true;
    let payload = {};
    let eventObj = {};

    if (this.advancedSaveClicked) {
      if (this.rateExpression.type != 'none') {
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
        if (this.rateExpression.cronStr == 'invalid') {
          return;
        } else if (this.rateExpression.cronStr !== undefined && this.rateExpression.type === 'cron') {
          this.rateExpression.duration = this.previousrate;
          this.rateExpression.interval = this.previousInt;
          eventObj['eventScheduleRate'] = `cron(${this.rateExpression.cronStr})`;
          eventObj['eventScheduleEnable'] = true;
        }
        else if (this.rateExpression.duration !== undefined  && this.rateExpression.type === 'rate') {
          eventObj['eventScheduleRate'] = `rate(${this.rateExpression.duration} ${this.rateExpression.interval})`;
          eventObj['eventScheduleEnable'] = true;
          this.cronObj.minutes = "0/5";
          this.cronObj.hours = "*";
          this.cronObj.dayOfMonth = "*";
          this.cronObj.month = "*";
          this.cronObj.dayOfWeek = "?";
          this.cronObj.year = "*";
        }
      } else {
        eventObj['eventScheduleRate'] = null;
        eventObj['eventScheduleEnable'] = false;
      }
    }

    payload['metadata'] = eventObj;
    this.PutPayload = payload;
    if (Object.keys(this.PutPayload).length > 0) this.isPayloadAvailable = true
  }

  onSaveClick() {
    this.saveClicked = true;
    this.generalAdvanceDisable = true;
    this.advancedSaveClicked = false;

    let payload = {};
    if (this.saveClicked) {
      if (this.desc_temp != this.service.description) {
        payload["description"] = this.desc_temp;
      }
      if (this.slackChannel_temp != this.service.slackChannel) {
        payload["slack_channel"] = this.slackChannel_temp;
      }


    }
    this.PutPayload = payload;

    if (Object.keys(this.PutPayload).length > 0) {
      this.isPayloadAvailable = true
    }
    else {
      this.isPayloadAvailable = false
    }

  }

  descriptionChange(desc_temp){
    this.update_payload.description = desc_temp;
    this.shouldSaveEnable();
  }

  onAdvanceClick(){
    this.saveClicked = false;
    this.advancedSaveClicked = false;
    this.shouldSaveEnable()
  }

  onCancelClick() {
    if(this.service.serviceType === "function" && this.service.eventScheduleEnable !== undefined){
      if(this.service.eventScheduleEnable === false){
        this.rateExpression.type = "none"
      } else if(this.service.eventScheduleRate !== null && this.service.eventScheduleRate.includes('cron')){
        this.rateExpression.type = "cron"
        this.rateExpression.cronStr = this.service.eventScheduleRate;
      } else if(this.service.eventScheduleRate !== null && this.service.eventScheduleRate.includes('rate')){
        this.rateExpression.type = "rate";
        this.rateExpression.rateStr = this.service.eventScheduleRate;
        this.cronObj.minutes = "0/5";
        this.cronObj.hours = "*";
        this.cronObj.dayOfMonth = "*";
        this.cronObj.month = "*";
        this.cronObj.dayOfWeek = "?";
        this.cronObj.year = "*";
      }
    }
    this.rateExpression.duration = this.initialDuration;
    this.rateExpression.interval = this.initialRateInterval;
    this.eventDisable  = true;
    this.showGeneralField = false;
    this.editEvents = false;
    this.generalAdvanceDisable = true;
    this.update_payload = {};
    this.disp_show = true;
    this.slackChannel_temp = this.service.slackChannel;
    this.desc_temp = this.service.description;
    this.disp_show2 = true;
    this.edit_save = 'EDIT';
    this.showCancel = false;
    this.hide_email_error = true;
    this.hide_slack_error = true;
    if(this.rateExpression.type != 'none'){
      this.setEventScheduleRate();
    }
    this.isSlackAvailable = true;
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
    this.show_loader = false;
    this.disableSaveBtn();
  }

  setEventScheduleRate() {
    let cronValue;
    this.previousrate = this.rateExpression.duration;
    this.previousInt = this.rateExpression.interval;
    if (this.service.eventScheduleRate.includes('rate') && (this.service.eventScheduleRate !== this.rateExpression.rateStr)) {
      cronValue = this.rateExpression.rateStr;
    }
    else if (this.service.eventScheduleRate.includes('cron') && (this.service.eventScheduleRate !== this.rateExpression.cronStr)) {
      cronValue = this.rateExpression.cronStr;
    } else {
      cronValue = this.service.eventScheduleRate;
    }
      if(cronValue !== null){
          let localEvenSchedule = cronValue;
        !!localEvenSchedule &&
          (localEvenSchedule = localEvenSchedule.replace(/[\(\)']+/g, ' '));
        if(cronValue.includes('cron')){
          localEvenSchedule = localEvenSchedule.split(' ');
          this.rateExpression.type = localEvenSchedule[0];
          localEvenSchedule.shift();
        } else  if(cronValue.includes('rate')){
          localEvenSchedule = localEvenSchedule.split(' ');
          this.rateExpression.type = localEvenSchedule[0];
          localEvenSchedule.shift();
        }
        else {
          localEvenSchedule = localEvenSchedule.split(' ');
        }

        if(this.rateExpression.type === 'cron'){
          this.cronObj.minutes = localEvenSchedule[0];
            this.cronObj.hours = localEvenSchedule[1];
            this.cronObj.dayOfMonth = localEvenSchedule[2];
            this.cronObj.month = localEvenSchedule[3];
            this.cronObj.dayOfWeek = localEvenSchedule[4];
            this.cronObj.year = localEvenSchedule[5];
        }
        if(this.rateExpression.type === 'rate') {
          this.rateExpression.duration = localEvenSchedule[0];
          this.rateExpression.interval = localEvenSchedule[1];
        }
      }
    }


  onEventScheduleChange(val) {
    this.rateExpression.type = val;
    this.eventExpression.type = 'awsEventsNone';
    let tempExpCron = `cron(${this.rateExpression.cronStr})`;
    let tempExpRate = this.rateExpression.rateStr;
    if(this.service.eventScheduleRate === null){
      this.eventDisable = false;
    }
    else if (this.previoustype === this.rateExpression.type &&
      ((this.previouscron === tempExpCron) || (this.previousRateVal === tempExpRate))) {
      this.eventDisable = true;
    }
    else {
      this.eventDisable = false;
    }
    this.generateExpression(this.rateExpression)
  }
  onAWSEventChange(val) {
    this.eventExpression.type = val;
  }

  public focusDynamo = new EventEmitter<boolean>();
  public focusKinesis = new EventEmitter<boolean>();
  public focusS3 = new EventEmitter<boolean>();

  chkDynamodb() {
    this.focusDynamo.emit(true);
    return this.eventExpression.type === 'dynamodb';
  }

  chkfrKinesis() {
    this.focusKinesis.emit(true);
    return this.eventExpression.type === 'kinesis';
  }

  chkS3() {
    this.focusS3.emit(true);
    return this.eventExpression.type === 's3';
  }

  changeSlack() {
    this.generalAdvanceDisable = true;
    this.update_payload.slack_channel = this.slackChannel_temp;
  }

  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);
  }

  popup(state, id) {
    if (state == 'enter') {
      var ele = document.getElementById(id);
      ele.classList.add('endp-visible');
    }
    if (state == 'leave') {
      var ele = document.getElementById(id);
      ele.classList.remove('endp-visible');
    }

  }

  checkSlackNameAvailability() {
    this.advancedSaveClicked = false;
    this.validateChannelName();
    return;
  }

  check_email_valid() {
    var regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    if (this.email_temp == '' || this.email_temp == null || this.email_temp == undefined) {
      this.hide_email_error = true;
      this.service.email = this.email_temp;
    } else {
      if (!regex.test(this.email_temp)) //if it doesnt match with email pattern
      {
        this.hide_email_error = false;
        this.email_valid = false;
      } else {
        this.hide_email_error = true;

        this.email_valid = true;

      }
    }

  }

  public validateChannelName() {
    this.isSlackAvailable = false;
    this.show_loader = true;
    if (this.slackChannel_temp == '' || this.slackChannel_temp == null) {
      this.isSlackAvailable = true;
      this.hide_slack_error = true;
      this.show_loader = false;
      this.shouldSaveEnable();
    } else {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      this.subscription = this.http.get('/jazz/is-slack-channel-available?slack_channel=' + this.slackChannel_temp)
        .subscribe(
          (Response) => {
            let isAvailable = Response.data.is_available;
            this.isSlackAvailable = isAvailable;
            if (isAvailable) //if valid
            {
              this.hide_slack_error = true;

            } else {
              this.hide_slack_error = false;

            }
            this.show_loader = false;
            this.shouldSaveEnable();
          },
          (error) => {
            var err = error;
            // console.log(err);
            this.show_loader = false;
            this.shouldSaveEnable();

          }

        );
    }
  }

  disableSaveBtn() {

    if (!this.hide_slack_error) {
      return true;
    }
    if (!this.hide_email_error) {
      return true;
    }
    if (this.show_loader) {
      return true;
    }
    return false;
  }

  slack_link() {

    if (this.service.slackChannel == '' || this.service.slackChannel == undefined) {
      //do nothing
    } else {
      this.slackChannel_link = env_internal.urls.slack_messages + this.service.slackChannel;
      this.openLink(this.slackChannel_link);
    }
  }

  check_empty_fields() {
    if (this.service.description == undefined || this.service.description == null || this.service.description == '') {
      this.description_empty = true;
    } else {
      this.description_empty = false;
    }
    if (this.service.approvers == undefined || this.service.approvers == null || this.service.approvers == '') {
      this.approvers_empty = false;
    }
    if (this.service.domain == undefined || this.service.domain == null || this.service.domain == '') {
      this.domain_empty = true;
    }
    if (this.service.serviceType == undefined || this.service.serviceType == null || this.service.serviceType == '') {
      this.serviceType_empty = true;
    }
    if (this.service.email == undefined || this.service.email == null || this.service.email == '') {
      this.email_empty = true;
    } else {
      this.email_empty = false;
      this.email_temp = this.service.email
    }
    if (this.service.slackChannel == undefined || this.service.slackChannel == null || this.service.slackChannel == '') {
      this.slackChannel_empty = true;
    } else {
      this.slackChannel_empty = false;
      this.slackChannel_temp = this.service.slackChannel
    }
    if (this.service.repository == undefined || this.service.repository == null || this.service.repository == '') {
      this.repository_empty = true;
    }
    if (this.service.runtime == undefined || this.service.runtime == null || this.service.runtime == '') {
      this.runtime_empty = true;
    } else {
      this.runtime_empty = false;
    }
    if (this.service.tags == undefined || this.service.tags == null || this.service.tags == '') {
      this.tags_empty = true;
    } else {
      this.tags_empty = false;
    }
  }


  serviceCreationStatus() {
    this.statusprogress = 20;
    this.creating = true;
    this.deleting = false;
    this.intervalSubscription = Observable.interval(5000)
      .switchMap((response) => this.http.get('/jazz/request-status?id=' + this.service_request_id))
      .subscribe(
        response => {

          let dataResponse = <any>{};
          dataResponse.list = response;
          var respStatus = dataResponse.list.data;
          if (respStatus.status.toLowerCase() === 'completed') {
            this.statusCompleted = true;
            this.serviceStatusCompleted = true;
            this.serviceStatusPermission = true;
            this.serviceStatusRepo = true;
            this.serviceStatusValidate = true;
            this.statusInfo = 'Wrapping things up';
            this.statusprogress = 100;
            localStorage.removeItem('request_id' + "_" + this.service.name + "_" + this.service.domain);
            // alert('last stage');
            this.http.get('/jazz/services/' + this.service.id, null, this.service.id).subscribe(
              (response) => {
                this.serviceDetail.onDataFetched(response.data);
              }
            )
            this.intervalSubscription.unsubscribe();
            setTimeout(() => {
              this.service_error = false;
            }, 5000);
          } else if (respStatus.status.toLowerCase() === 'failed') {
            this.statusCompleted = false;
            this.statusFailed = true;
            this.serviceStatusStarted = false;
            this.serviceStatusStartedD = true;
            this.serviceStatusCompletedD = true;
            this.serviceStatusPermissionD = true;
            this.serviceStatusRepoD = true;
            this.serviceStatusValidateD = true;
            this.statusInfo = 'Creation failed';
            setTimeout(() => {
              this.service_error = false;
            }, 5000);

          } else {
            this.statusCompleted = false;
            respStatus.events.forEach(element => {
              if (element.name === 'TRIGGER_FOLDERINDEX' && element.status === 'COMPLETED') {
                this.serviceStatusCompleted = true;
                this.statusInfo = 'Wrapping things up';
                this.statusprogress = 100;
                localStorage.removeItem('request_id' + this.service.name + this.service.domain);
              } else if (element.name === 'ADD_WRITE_PERMISSIONS_TO_SERVICE_REPO' && element.status === 'COMPLETED') {
                this.serviceStatusPermission = true;
                this.statusInfo = 'Adding required permissions';
                this.statusprogress = 85;
              } else if (element.name === 'PUSH_TEMPLATE_TO_SERVICE_REPO' && element.status === 'COMPLETED') {
                this.serviceStatusRepo = true;
                this.statusInfo = 'Getting your code ready';
                this.statusprogress = 60;
              } else if (element.name === 'VALIDATE_INPUT' && element.status === 'COMPLETED') {
                this.serviceStatusValidate = true;
                this.statusInfo = 'Validating your request';
                this.statusprogress = 35;
              } else if (element.name === 'CALL_ONBOARDING_WORKFLOW' && element.status === 'COMPLETED') {
                this.serviceStatusStarted = true;
                this.statusInfo = 'Service Creation started';
                this.statusprogress = 20;
              }
            });
          }
          document.getElementById('current-status-val').setAttribute("style", "width:" + this.statusprogress + '%');

        },
        error => {

          this.service_error = false;
          this.serviceCreationStatus();
        }
      )
  }

  modifyEnvArr() {
    var j = 0;
    var k = 2;
    this.sortEnvArr();

    if (this.environ_arr != undefined) {
      for (var i = 0; i < this.environ_arr.length; i++) {
        this.environ_arr[i].status = this.environ_arr[i].status.replace("_", " ");
        if (this.environ_arr[i].logical_id == 'prd' || this.environ_arr[i].logical_id == 'prod') {
          this.prodEnv = this.environ_arr[i];
          continue;
        }
        if (this.environ_arr[i].logical_id == 'stg') {
          this.stgEnv = this.environ_arr[i];
          continue;
        } else {
          if (this.environ_arr[i].status !== 'archived') {
            this.Environments[j] = this.environ_arr[i];
            this.envList[k] = this.environ_arr[i].logical_id;
            if (this.environ_arr[i].friendly_name != undefined) {
              this.friendlist[k++] = this.environ_arr[i].friendly_name;
            } else {
              this.friendlist[k++] = this.environ_arr[i].logical_id;
            }
            j++;
          }
        }
      }
      this.list = {
        env: this.envList,
        friendly_name: this.friendlist
      }
    }

    if (this.Environments.length == 0) {
      this.noSubEnv = true;
    }
    if (this.prodEnv.logical_id == undefined) {
      this.noProd = true;
    }
    if (this.stgEnv.logical_id == undefined) {
      this.noStg = true;
    }

    this.cache.set('envList', this.list);


  }

  sortEnvArr() {
    var j = 0;
    var k = 0;

    for (var i = 0; i < this.environ_arr.length; i++) {
      if (this.environ_arr[i].status != 'inactive') {
        this.list_env[j] = this.environ_arr[i];

        j++;

      }
      if (this.environ_arr[i].status == 'inactive') {

        this.list_inactive_env[k] = this.environ_arr[i];
        k++;

      }

    }
    this.environ_arr = this.list_env.slice(0, this.list_env.length);

    this.environ_arr.push.apply(this.environ_arr, this.list_inactive_env);




  }

  getenvData() {
    this.isenvLoading = true;
    this.ErrEnv = false;
    if (this.service == undefined) {
      return
    }
    this.http.get('/jazz/environments?domain=' + this.service.domain + '&service=' + this.service.name, null, this.service.id).subscribe(
      response => {
        this.isenvLoading = false;
        this.environ_arr = response.data.environment;
        if (this.environ_arr != undefined)
          if (this.environ_arr.length == 0 || response.data == '') {
            this.noEnv = true;
          }
        this.ErrEnv = false;


        this.modifyEnvArr();

      },
      err => {
        this.isenvLoading = false;

        console.log('error', err);
        this.ErrEnv = true;
        if (err.status == 404) this.err404 = true;
        this.errMessage = "Something went wrong while fetching your data";
        this.errMessage = this.toastmessage.errorMessage(err, "environment");
        var payload = {
          "domain": +this.service.domain,
          "service": this.service.name
        }
        this.getTime();
        this.errorURL = window.location.href;
        this.errorAPI = environment.baseurl + "/jazz/environments";
        this.errorRequest = payload;
        this.errorUser = this.authenticationservice.getUserId();
        this.errorResponse = JSON.parse(err._body);

      })
  };

  getTime() {
    var now = new Date();
    this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':' +
      ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
  }

  feedbackRes: boolean = false;
  openModal: boolean = false;
  feedbackMsg: string = '';
  feedbackResSuccess: boolean = false;
  feedbackResErr: boolean = false;
  isFeedback: boolean = false;
  toast: any;
  model: any = {
    userFeedback: ''
  };
  buttonText: string = 'SUBMIT';
  isLoading: boolean = false;
  sjson: any = {};
  djson: any = {};

  reportIssue() {

    this.json = {
      "user_reported_issue": this.model.userFeedback,
      "API": this.errorAPI,
      "REQUEST": this.errorRequest,
      "RESPONSE": this.errorResponse,
      "URL": this.errorURL,
      "TIME OF ERROR": this.errorTime,
      "LOGGED IN USER": this.errorUser
    }

    this.openModal = true;
    this.errorChecked = true;
    this.isLoading = false;
    this.errorInclude = JSON.stringify(this.djson);
    this.sjson = JSON.stringify(this.json);
  }

  openFeedbackForm() {
    this.isFeedback = true;
    this.model.userFeedback = '';
    this.feedbackRes = false;
    this.feedbackResSuccess = false;
    this.feedbackResErr = false;
    this.isLoading = false;
    this.buttonText = 'SUBMIT';
  }

  reportEmail: string;

  mailTo() {
    location.href = 'mailto:' + this.reportEmail + '?subject=Jazz : Issue reported by' + " " + this.authenticationservice.getUserId() + '&body=' + this.sjson;
  }
  errorIncluded() { }

  submitFeedback(action) {

    this.errorChecked = (<HTMLInputElement>document.getElementById("checkbox-slack")).checked;
    if (this.errorChecked == true) {
      this.json = {
        "user_reported_issue": this.model.userFeedback,
        "API": this.errorAPI,
        "REQUEST": this.errorRequest,
        "RESPONSE": this.errorResponse,
        "URL": this.errorURL,
        "TIME OF ERROR": this.errorTime,
        "LOGGED IN USER": this.errorUser
      }
    } else {
      this.json = this.model.userFeedback;
    }
    this.sjson = JSON.stringify(this.json);

    this.isLoading = true;

    if (action == 'DONE') {
      this.openModal = false;
      return;
    }

    var payload = {
      "title": "Jazz: Issue reported by " + this.authenticationservice.getUserId(),
      "project_id": env_internal.urls.internal_acronym,
      "priority": "P4",
      "description": this.json,
      "created_by": this.authenticationservice.getUserId(),
      "issue_type": "bug"
    }
    this.http.post('/jazz/jira-issues', payload).subscribe(
      response => {
        this.buttonText = 'DONE';
        this.isLoading = false;
        this.model.userFeedback = '';
        var respData = response.data;
        this.feedbackRes = true;
        this.feedbackResSuccess = true;
        if (respData != undefined && respData != null && respData != "") {
          this.feedbackMsg = "Thanks for reporting the issue. We’ll use your input to improve Jazz experience for everyone!";
        }
      },
      error => {
        this.buttonText = 'DONE';
        this.isLoading = false;
        this.feedbackResErr = true;
        this.feedbackRes = true;
        this.feedbackMsg = this.toastmessage.errorMessage(error, 'jiraTicket');
      }
    );
  }

  frndload(event) { }

  is_multi_env: boolean = false;
  SlackEnabled: boolean = false;

  ngOnInit() {
    if (env_oss.slack_support) this.SlackEnabled = true;
    if (environment.envName == 'oss')
      if (!environment.multi_env)
        this.multiENV = false;
    if (environment.multi_env) this.is_multi_env = true;
    if (environment.envName == 'oss') this.internal_build = false;

    this.service.accounts = env_internal.urls.accounts;
    this.service.regions = env_internal.urls.regions;
    this.createloader = true;
    if (this.service.status == "deletion completed" || this.service.status == "deletion started") {
      this.showcanvas = true;
    } else {
      this.showcanvas = false;
    }
    this.showCancel = false;

    if (this.service.status == 'creation started' || this.service.status == 'deletion started') {
      try {
        this.reqJson = JSON.parse(localStorage.getItem('request_id' + "_" + this.service.name + "_" + this.service.domain));

        this.service_request_id = this.reqJson.request_id;
      } catch (e) {
        console.log(e)
      }

    } else {
      localStorage.removeItem('request_id' + "_" + this.service.name + "_" + this.service.domain);
    }
    this.creation_status = this.service.status;
    this.animatingDots = "...";
    this.testingStatus();
  }

  testingStatus() {
    setInterval(() => {
      this.onload.emit(this.service.status);
    }, 500);

  }
  transform_env_oss(data) {
    var arrEnv = data.data.environment
    if (environment.multi_env) {
      for (var i = 0; i < arrEnv.length; i++) {
        arrEnv[i].status = arrEnv[i].status.replace('_', ' ');
        if (arrEnv[i].logical_id == 'prod')
          this.prodEnv = arrEnv[i];
        else
          this.Environments.push(arrEnv[i]);
      }
    } else {
      for (var i = 0; i < arrEnv.length; i++) {
        arrEnv[i].status = arrEnv[i].status.replace('_', ' ');
        if (arrEnv[i].logical_id == 'prod')
          this.prodEnv = arrEnv[i];
        else
          this.stgEnv = arrEnv[i];
      }
    }
    // arrEnv[0].status.replace("_"," ");
  }

  refresh_env() {
    this.envComponent.refresh();
  }


  internal_build: boolean = true;

  ngOnChanges(x: any) {
    if(this.service){
      if(this.service.eventScheduleEnable !== undefined){
        this.service['eventScheduleEnablePresent'] = true
      }
      if(this.service.accountID){
        let accountValue = this.service.accountID
        env_oss.aws.accountMap.map((item)=>{
          if(item.account === accountValue){
            this.accountName = item.accountName
          }
        })
      }
    }
    if(this.rateExpression && this.rateExpression.interval){
      this.initialRateInterval = this.rateExpression.interval
    }
    if(this.rateExpression && this.rateExpression.duration){
      this.initialDuration = this.rateExpression.duration
    }
    if (environment.multi_env) this.is_multi_env = true;
    if (environment.envName == 'oss') this.internal_build = false;
    var obj;
    this.prodEnv = {};
    this.stgEnv = {};
    this.desc_temp = this.service.description;

    this.check_empty_fields();

    setTimeout(() => {
      this.islink = this.ValidURL(this.service.repository);
      if (this.islink) {
        if (this.internal_build) {
          this.bitbucketRepo = "View on Bitbucket";

        } else {
          this.bitbucketRepo = "Git Repo";

        }
        this.repositorylink = this.service.repository;
      } else if (this.service.repository === "[Archived]") {
        this.bitbucketRepo = "Archived";
        this.repositorylink = "";
      }
    }, 100);


    if (this.service.status == 'creation started' || this.service.status == 'deletion started') {
      try {
        this.reqJson = JSON.parse(localStorage.getItem('request_id' + "_" + this.service.name + "_" + this.service.domain));

        this.service_request_id = this.reqJson.request_id;
      } catch (e) {
        console.log(e)
      }

    } else {
      localStorage.removeItem('request_id' + "_" + this.service.name + "_" + this.service.domain);
    }
    this.creation_status = this.service.status;
    this.animatingDots = "...";
    this.testingStatus();
    if (this.service.eventScheduleRate) {
      this.setEventScheduleRate();
    }

    // request status api call
    if (this.service.status === 'creation started' && !this.serviceStatusCompleted && this.service_request_id != undefined) {
      this.serviceCreationStatus();

    } else if (this.service.status === 'deletion started' && !this.serviceStatusCompleted) {
      this.serviceDeletionStatus();
    }
  }

  ngOnDestroy() {
    //unsubscribe  request status api call
    if ((this.service.status === 'creation started' || this.service.status === 'deletion started') && this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
  }

  onEditEvents(){
    if (this.isAdminAccess) {
      this.onCancelClick();
      this.editEvents = true;
      this.disp_show2 = false;
      this.previoustype = this.rateExpression.type;
      this.previouscron = this.rateExpression.cronStr;
      this.previousRateVal = this.rateExpression.rateStr;
    }
  }


  serviceDeletionStatus() {

    this.creating = false;
    this.deleting = true;

    this.intervalSubscription = Observable.interval(5000)
      .switchMap((response) => this.http.get('/jazz/request-status?id=' + this.service_request_id))
      .subscribe(
        response => {
          this.createloader = false;
          let dataResponse = <any>{};
          dataResponse.list = response;
          var respStatus = dataResponse.list.data;
          if (respStatus.status.toLowerCase() === 'completed') {
            this.statusCompleted = true;
            this.serviceStatusCompleted = true;
            this.serviceStatusPermission = true;
            this.serviceStatusRepo = true;
            this.serviceStatusValidate = true;
            this.DelstatusInfo = 'Wrapping things up';
            this.statusprogress = 100;
            this.service.status = "deletion completed";
            localStorage.removeItem('request_id' + "_" + this.service.name + "_" + this.service.domain);
            setTimeout(() => {
              this.service_error = false;
              this.router.navigateByUrl('services');
            }, 5000);
            this.intervalSubscription.unsubscribe();
          } else if (respStatus.status.toLowerCase() === 'failed') {
            this.statusCompleted = false;
            this.statusFailed = true;
            this.serviceStatusStarted = false;
            this.serviceStatusStartedD = true;
            this.serviceStatusCompletedD = true;
            this.serviceStatusPermissionD = true;
            this.serviceStatusRepoD = true;
            this.serviceStatusValidateD = true;
            this.DelstatusInfo = 'Deletion failed';
            this.service.status = "deletion failed";
            setTimeout(() => {
              this.service_error = false;
            }, 5000);
          } else {
            this.statusCompleted = false;
            respStatus.events.forEach(element => {
              if (element.name === 'DELETE_PROJECT' && element.status === 'COMPLETED') {
                this.serviceStatusPermission = true;
                this.DelstatusInfo = 'Wrapping things up';
                this.statusprogress = 100;
                localStorage.removeItem('request_id' + this.service.name + this.service.domain);
              } else if (element.name === 'BACKUP_PROJECT' && element.status === 'COMPLETED') {
                this.serviceStatusRepo = true;
                this.DelstatusInfo = 'Finishing up';
                8
                this.statusprogress = 81;
              } else if ((element.name === 'UNDEPLOY_WEBSITE' && element.status === 'COMPLETED') && (this.service.serviceType == "website")) {
                this.serviceStatusValidate = true;
                this.DelstatusInfo = 'Backing up code';
                this.statusprogress = 48;
              } else if ((element.name === 'DELETE_API_DOC' && element.status === 'COMPLETED') && (this.service.serviceType == "api")) {
                this.serviceStatusValidate = true;
                this.DelstatusInfo = 'Backing up code';
                this.statusprogress = 48;
              } else if ((element.name === 'UNDEPLOY_LAMBDA' && element.status === 'COMPLETED') && (this.service.serviceType == "function")) {
                this.serviceStatusValidate = true;
                this.DelstatusInfo = 'Backing up code';
                this.statusprogress = 48;
              } else if (element.name === 'CALL_DELETE_WORKFLOW' && element.status === 'COMPLETED') {
                this.serviceStatusStarted = true;
                this.DelstatusInfo = 'Deleting assets';
                this.statusprogress = 20;
              }
            });
          }
          document.getElementById('current-status-val').setAttribute("style", "width:" + this.statusprogress + '%');
        },
        error => {
          if (error.status == "404") {
            this.statusCompleted = false;
            this.statusFailed = true;
            this.serviceStatusStarted = false;
            this.serviceStatusStartedD = true;
            this.serviceStatusCompletedD = true;
            this.serviceStatusPermissionD = true;
            this.serviceStatusRepoD = true;
            this.serviceStatusValidateD = true;
            setTimeout(() => {
              this.service_error = false;
            }, 5000);
          }
          this.service_error = false;
          this.intervalSubscription.unsubscribe();
          // this.serviceDeletionStatus();
        }
      )
  }

  public goToAbout(hash) {
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag', true);
    this.cache.set('scroll_id', hash);
  }
  focusindex: number;
  showRegionList: boolean;
  showAccountList: boolean;
  selectedAccount = [];
  selectedRegion = [];
  scrollList: any;
  onRegionChange(newVal) {
    if (!newVal) {
      this.showRegionList = false;
    } else {
      this.showRegionList = true;
    }
  }
  onAccountChange(newVal) {
    if (!newVal) {
      this.showAccountList = false;
    } else {
      this.showAccountList = true;
    }
  }

  focusInputAccount(event) {
    document.getElementById('AccountInput').focus();
  }

  focusInputRegion(event) {
    document.getElementById('regionInput').focus();
  }

  selRegion: any;
  selApprover: any;
  selectAccount(account) {
    this.selApprover = account;
    let thisclass: any = this;
    this.showAccountList = false;
    thisclass.AccountInput = '';
    this.selectedAccount.push(account);
    this.update_payload.accounts = this.selectedAccount;
    for (var i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i] === account) {
        this.accounts.splice(i, 1);
        return;
      }
    }
  }
  removeAccount(index, account) {
    this.accounts.push(account);
    this.selectedAccount.splice(index, 1);
  }
  selectRegion(region) {
    this.selApprover = region;
    let thisclass: any = this;
    this.showRegionList = false;
    thisclass.regionInput = '';
    this.selectedRegion.push(region);
    this.update_payload.regions = this.selectedRegion;
    for (var i = 0; i < this.regions.length; i++) {
      if (this.regions[i] === region) {
        this.regions.splice(i, 1);
        return;
      }
    }
  }
  removeRegion(index, region) {
    this.regions.push(region);
    this.selectedRegion.splice(index, 1);
  }
  keypressAccount(hash) {
    if (hash.key == 'ArrowDown') {
      this.focusindex++;
      if (this.focusindex > 0) {
        var pinkElements = document.getElementsByClassName("pinkfocus")[0];
        if (pinkElements == undefined) {
          this.focusindex = 0;
        }
      }
      if (this.focusindex > 2) {
        this.scrollList = {
          'position': 'relative',
          'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem'
        };

      }
    } else if (hash.key == 'ArrowUp') {
      if (this.focusindex > -1) {
        this.focusindex--;

        if (this.focusindex > 1) {
          this.scrollList = {
            'position': 'relative',
            'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem'
          };
        }
      }
      if (this.focusindex == -1) {
        this.focusindex = -1;


      }
    } else if (hash.key == 'Enter' && this.focusindex > -1) {
      event.preventDefault();
      var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

      var approverObj = pinkElement[0].attributes[2].value;

      this.selectAccount(approverObj);

      this.focusindex = -1;

    } else {
      this.focusindex = -1;
    }
  }

  keypressRegion(hash) {
    if (hash.key == 'ArrowDown') {
      this.focusindex++;
      if (this.focusindex > 0) {
        var pinkElements = document.getElementsByClassName("pinkfocus2")[0];
        if (pinkElements == undefined) {
          this.focusindex = 0;
        }
      }
      if (this.focusindex > 2) {
        this.scrollList = {
          'position': 'relative',
          'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem'
        };

      }
    } else if (hash.key == 'ArrowUp') {
      if (this.focusindex > -1) {
        this.focusindex--;

        if (this.focusindex > 1) {
          this.scrollList = {
            'position': 'relative',
            'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem'
          };
        }
      }
      if (this.focusindex == -1) {
        this.focusindex = -1;


      }
    } else if (hash.key == 'Enter' && this.focusindex > -1) {
      event.preventDefault();
      var pinkElement = document.getElementsByClassName("pinkfocus2")[0].children;

      var approverObj = pinkElement[0].attributes[2].value;

      this.selectRegion(approverObj);

      this.focusindex = -1;

    } else {
      this.focusindex = -1;
    }
  }
}
