/**
  * @type Component
  * @desc create service component
  * @author
*/


import { Http, Headers, Response } from '@angular/http';
import { Component, Input, OnInit, Output, EventEmitter, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { FORM_DIRECTIVES, ControlGroup, Control, Validators, FormBuilder, Validator, } from '@angular/common';
import { ServiceFormData, RateExpression, CronObject, EventExpression } from './../service-form-data';
import { FocusDirective } from './../focus.directive';
import { CronParserService } from '../../../core/helpers';
import { ToasterService } from 'angular2-toaster';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from "../../../core/services";
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { ServicesListComponent } from "../../../pages/services-list/services-list.component"
import { environment as env_internal } from './../../../../environments/environment.internal';

@Component({
  selector: 'create-service',
  templateUrl: './create-service.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./create-service.component.scss']
})


export class CreateServiceComponent implements OnInit {

  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();

  docs_int_jazz:string = env_internal.urls.docs;
  typeOfService: string = "api";
  typeOfPlatform: string = "aws";
  disablePlatform = true;
  selected: string = "Minutes";
  runtime: string = 'nodejs';
  eventSchedule: string = 'fixedRate';
  private slackSelected: boolean = false;
  private createslackSelected: boolean = false;
  private ttlSelected: boolean = false;
  showApproversList: boolean = false;
  approverName: string;
  approverName2: string;
  currentUserSlack: boolean = false;
  git_clone: boolean = false;
  git_url: string = "";
  git_private: boolean = false;
  git_creds: any = {};
  git_username: string = "";
  git_pwd: string = "";
  selApprover: any = [];
  appIndex: any;
  git_err: boolean = false;
  approversList: any;
  approversList2: any;
  slackAvailble: boolean = false;
  slackNotAvailble: boolean = false;
  channelNameError: boolean = false;
  showLoader: boolean = false;
  showApproversList2: boolean = false;
  showRegionList:boolean = false;
  showAccountList:boolean = false;

  isLoading: boolean = false;
  slackChannelLoader: boolean = false;
  serviceAvailable: boolean = false;
  serviceNotAvailable: boolean = false;
  serviceNameError: boolean = false;
  isDomainDefined: boolean = false;
  invalidttl: boolean = false;
  serviceRequested = false;
  serviceRequestFailure = false;
  serviceRequestSuccess = false;
  vpcdisable: boolean = false;
  serviceLink: string;
  Currentinterval: string = 'Minutes';
  rateExpressionIsValid: boolean = false;
  isLoadingNewSlack: boolean = false;
  rateExpressionError: string = '';
  cronFieldValidity: any;
  private headers = new Headers({ 'Content-Type': 'application/json' });
  submitted = false;
  vpcSelected: boolean = false;
  publicSelected: boolean = false;
  resMessage: string = '';
  cdnConfigSelected: boolean = false;
  focusindex: any = -1;
  scrollList: any = '';
  toast: any;
  gitCloneSelected: boolean = false;
  gitprivateSelected: boolean = false;
  //   model: any = {
  //     gitRepo: '',
  // };
  gitRepo: any = '';
  gitusername: any = '';
  gituserpwd: any = '';
  createSlackModel: any = {
    name: '',
    purpose: '',
    invites: ''
  };


  model = new ServiceFormData('', '', '', '', '', '');
  cronObj = new CronObject('0/5', '*', '*', '*', '?', '*')
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', this.selected, '');
  eventExpression = new EventExpression("awsEventsNone", undefined, undefined, undefined, undefined);
  private doctors = [];
  private toastmessage: any;
  errBody: any;
  parsedErrBody: any;
  errMessage: any;
  firstcharvalidation: string = ""
  invalidServiceName: boolean = false;
  invalidServiceNameNum: boolean = false;
  invalidDomainName: boolean = false;
  loginUser: string = '';
  loginUserDetail: any;
  service: any = "";
  domain: any = "";
  reqId: any = "";

  accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	  accSelected:string = this.accList[0];
	regSelected:string=this.regList[0];

  accounts=this.accList
  regions=this.regList;

  supported_account:string = this.accList[0];

  selectedRegion=[];
  regionInput:string;
  selectedAccount=[];
  AccountInput:string;
  constructor(
    // private http: Http,
    private toasterService: ToasterService,
    private cronParserService: CronParserService,
    private http: RequestService,
    private cache: DataCacheService,
    private messageservice: MessageService,
    private servicelist: ServicesListComponent,
    private authenticationservice: AuthenticationService
  ) {
    this.toastmessage = messageservice;
  }

  // serviceTypeData = [
  //   {'name':'api','path':'../assets/images/icons/icon-api@3x.png'},
  //   {'name':'function','path':'../assets/images/icons/icon-function@3x.png'},
  //   {'name':'website','path':'../assets/images/icons/icon-function@3x.png'}
  // ];

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

  // function for opening and closing create service popup
  closeCreateService(serviceRequest) {
    if (serviceRequest) {
      this.servicelist.serviceCall();
    }
    this.cache.set("updateServiceList", true);
    this.serviceRequested = false;
    this.serviceRequestFailure = false;
    this.serviceRequestSuccess = false;
    this.onClose.emit(false);
  }



  selectedApprovers = [];
  selectedApprovers2 = [];

  rateData = ['Minutes', 'Hours', 'Days'];

  // function for changing service type
  changeServiceType(serviceType) {
    this.typeOfService = serviceType;
  }

  // function for changing platform type
  changePlatformType(platformType) {
    if (!this.disablePlatform) {
      this.typeOfPlatform = platformType;
    }
  }

  // function called on runtime change(radio)
  onSelectionChange(val) {
    this.runtime = val;
  }

  // function called on event schedule change(radio)
  onEventScheduleChange(val) {
    this.rateExpression.type = val;
  }
  onAWSEventChange(val) {
    this.eventExpression.type = val;
  }
  onSelectedDr(selected) {
    this.rateExpression.interval = selected;
    this.generateExpression(this.rateExpression)
  }

  getUserDetails(list) {
    this.loginUser = this.authenticationservice.getUserId();
    if (list.length) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].userId.toLowerCase() === this.loginUser) {
          this.loginUserDetail = list[i];
        }
      }
    }
  }

  statusFilter(item) {
    this.selected = item;
  };
  approversListRes: any;
  // function to get approvers list
  public getData() {

    this.http.get('/platform/ad/users')
      .subscribe((res: Response) => {
        this.approversListRes = res;
        this.approversList = this.approversListRes.data.values.slice(0, this.approversListRes.data.values.length);
        this.approversList2 = this.approversListRes.data.values.slice(0, this.approversListRes.data.values.length);
        this.getUserDetails(this.approversList2);
      }, error => {
        this.resMessage = this.toastmessage.errorMessage(error, 'aduser');
        this.toast_pop('error', 'Oops!', this.resMessage);
      });
  }



  // function to validate slack channel
  public validateChannelName() {

    this.slackChannelLoader = true;
    this.http.get('/jazz/is-slack-channel-available?slack_channel=' + this.model.slackName)
      .subscribe(
      (Response) => {
        var output = Response;
        this.slackChannelLoader = false;
        if (output.data.is_available == true) {
          this.slackAvailble = true;
          this.slackNotAvailble = false;
        } else if (output.data.is_available == false) {
          this.slackAvailble = false;
          this.slackNotAvailble = true;
        } else {
          this.serviceAvailable = true;
          this.slackAvailble = false;
          this.slackNotAvailble = false;
        }
      },
      (error) => {
        this.slackChannelLoader = false;
        var err = error;
        // this.channelNameError = true;
        this.resMessage = this.toastmessage.errorMessage(error, 'slackChannel');
        this.toast_pop('error', 'Oops!', this.resMessage);
      }
      );
  }

  // function to restore the slack channel availability when it is changed
  onSlackChange() {
    this.channelNameError = false;
    this.slackAvailble = false;
    this.slackNotAvailble = false;
  }

  // check service name availability
  public validateServiceName() {
    this.showLoader = true;
    this.model.serviceName = this.model.serviceName.toLowerCase();
    this.model.domainName = this.model.domainName.toLowerCase();


    this.http.get('/jazz/is-service-available/?service=' + this.model.serviceName + '&domain=' + this.model.domainName)
      .subscribe(
      (Response) => {

        var output = Response;
        this.showLoader = false;
        if (output.data.available == true) {
          this.serviceAvailable = true;
          this.serviceNotAvailable = false;
        } else if (output.data.available == false) {
          this.serviceAvailable = false;
          this.serviceNotAvailable = true;
        } else {
          //  this.serviceNameError = true;
          this.serviceAvailable = false;
          this.serviceNotAvailable = false;
        }
        this.checkdomainName();
        (error) => {
          this.showLoader = false;
          // this.serviceNameError = true;
          this.serviceAvailable = false;
          this.serviceNotAvailable = false;
          var err = error;
          this.checkdomainName();

        }
      },
      (error) => {
        this.showLoader = false;
        this.resMessage = this.toastmessage.errorMessage(error, 'serviceAvailability');
        this.toast_pop('error', 'Oops!', this.resMessage);
      }
      );
  }

  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');

    tst.classList.add('toaster-anim');
    this.toast = this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);

  }
  checkdomainName() {
    if (this.model.domainName) {
      this.isDomainDefined = true;
    } else {
      this.isDomainDefined = false;
    }
  }

  // function to restore the service channel availability to false when it is changed
  onServiceChange() {
    this.isDomainDefined = false;
    this.serviceNameError = false;
    this.serviceAvailable = false;
    this.serviceNotAvailable = false;
  }

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

  // function to create service
  public createService() {
    var approversPayload = []
    for (var i = this.selectedApprovers.length - 1; i >= 0; i--) {
      approversPayload.push(this.selectedApprovers[i].userId);
    }

    var payload = {
      "service_type": this.typeOfService,
      "service_name": this.model.serviceName,
      "approvers": approversPayload,
      "domain": this.model.domainName,
      "description": this.model.serviceDescription,
      //     "git_clone":this.git_clone,
      //     "git_url":this.git_url,
      //     "git_private":this.git_private,
      //     "git_creds":{
      // "properties":{
      //       "git_username":this.git_username,
      //       "git_pwd":this.git_pwd
      // }
      //     }

    };

    let obj = {};

    if (this.typeOfService == 'api') {
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
      payload["is_public_endpoint"] = this.publicSelected;
    }
    else if (this.typeOfService == 'function') {
      payload["runtime"] = this.runtime;
      // payload.service_type = 'lambda';
      payload["require_internal_access"] = this.vpcSelected;
      if (this.rateExpression.type != 'none') {
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
        if (this.rateExpression.cronStr == 'invalid') {
          return;
        } else if (this.rateExpression.cronStr !== undefined) {
          payload["rateExpression"] = this.rateExpression.cronStr;
        }
      }

      if (this.eventExpression.type !== "awsEventsNone") {
        var event = {};
        event["type"] = this.eventExpression.type;
        if (this.eventExpression.type === "dynamodb") {
          event["source"] = "arn:aws:dynamodb:us-west-2:302890901340:table/" + this.eventExpression.dynamoTable;
          event["action"] = "PutItem";
        } else if (this.eventExpression.type === "kinesis") {
          event["source"] = "arn:aws:kinesis:us-west-2:302890901340:stream/" + this.eventExpression.streamARN;
          event["action"] = "PutRecord";
        } else if (this.eventExpression.type === "s3") {
          event["source"] = this.eventExpression.S3BucketName;
          event["action"] = "S3:" + this.eventExpression.S3BucketName + ":*";
        }
        payload["events"] = [];
        payload["events"].push(event);
      }

    } else if (this.typeOfService == 'website') {
      payload["create_cloudfront_url"] = this.cdnConfigSelected;

      if (this.gitCloneSelected == true) {
        payload["git_repository"] = {};
        //payload["git_repository"]["git_url"] = this.git_url;
        obj = { "git_https_url": this.git_url, "git_creds": {} };

        if (this.git_private == true) {
          //payload["git_private"] = this.git_private;
          this.git_creds = {

            "git_username": this.gitusername,
            "git_pwd": this.gituserpwd

          }
          obj["git_creds"] = this.git_creds;

          // payload["git_pwd"] = this.gitpwd;

        }
        payload["git_repository"] = obj;
      }
    }

    if (this.slackSelected) {
      payload["slack_channel"] = this.model.slackName;
    }
    if (this.typeOfService == 'api' && this.ttlSelected) {
    }

    // if (this.typeOfService == 'function') {
    //   payload["accounts"]=this.selectedAccount;
    //   payload["regions"]=this.selectedRegion;
    // }


    this.isLoading = true;
    this.http.post('/jazz/create-serverless-service', payload)
      .subscribe(
      (Response) => {
        var service = payload.service_name;
        var domain = payload.domain;
        var reqId = Response.data.request_id;
        localStorage.setItem('request_id' + "_" + payload.service_name + "_" + payload.domain, JSON.stringify({ service: service, domain: domain, request_id: reqId }));
        var output = Response;
        // this.cache.set("request_id", Response.data.request_id);
        // this.cache.set("request_id_name", Response.input.service_name);
        this.serviceRequested = true;
        this.serviceRequestSuccess = true;
        this.serviceRequestFailure = false;
        this.isLoading = false;
        // this.cache.set('request_id',output.data.request_id);
        // var index = output.data.indexOf("https://");
        // this.serviceLink = output.data.slice(index, output.data.length);
        this.resMessage = this.toastmessage.successMessage(Response, "createService");
        if (output.data != undefined && typeof (output.data) == 'string') {
          this.resMessage = output.data;
        } else if (output.data != undefined && typeof (output.data) == 'object') {
          this.resMessage = output.data.message;
        }
        this.selectedApprovers = [];
        this.cronObj = new CronObject('0/5', '*', '*', '*', '?', '*')
        this.rateExpression.error = undefined;
        // this.toasterService.pop('success', 'Success!!', output.data.create_service.data);
        //this.toasterService.pop('success', resMessage);
      },
      (error) => {
        this.isLoading = false;
        this.serviceRequested = true;
        this.serviceRequestSuccess = false;
        this.serviceRequestFailure = true;
        this.errBody = error._body;
        this.errMessage = this.toastmessage.errorMessage(error, 'createService');
        try {
          this.parsedErrBody = JSON.parse(this.errBody);
          if (this.parsedErrBody.message != undefined && this.parsedErrBody.message != '') {
            this.errMessage = this.parsedErrBody.message;
          }
        } catch (e) {
          console.log('JSON Parse Error', e);
        }
      }
      );
  }

  // function to navigate from success or error screen to create service screen
  backToCreateService() {
    this.approversList.push(this.selApprover);
    this.selectedApprovers.splice(0, 1);
    this.serviceRequested = false;
    this.serviceRequestSuccess = false;
    this.serviceRequestFailure = false;
  }


  // function to create a service
  onSubmit() {

    this.submitted = true;
    this.getData();
    this.createService();
    this.typeOfService = 'api';

    setTimeout(() => {
      this.vpcSelected = false;
      this.publicSelected = false;
      this.slackSelected = false;
      this.createslackSelected = false;
      this.ttlSelected = false;
      this.cdnConfigSelected = false;
      this.gitprivateSelected = false;
      this.gitCloneSelected = false;
    }, 2000)



  }


  // function to hide approver list when input field is empty
  onApproverChange(newVal) {
    if (!newVal) {
      this.showApproversList = false;
    } else {
      this.showApproversList = true;
    }
  }

  onApproverChange2(newVal) {
    if (!newVal) {
      this.showApproversList2 = false;
    } else {
      this.showApproversList2 = true;
    }
  }

selRegion:any;
selectAccount(account){

  this.selApprover = account;
    let thisclass: any = this;
    this.showAccountList = false;
    thisclass.AccountInput = '';
    this.selectedAccount.push(account);
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
selectRegion(region){
  this.selApprover = region;
    let thisclass: any = this;
    this.showRegionList = false;
    thisclass.regionInput = '';
    this.selectedRegion.push(region);
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
keypressAccount(hash){
  if (hash.key == 'ArrowDown') {
    this.focusindex++;
    if (this.focusindex > 0) {
      var pinkElements = document.getElementsByClassName("pinkfocus")[0];
      if (pinkElements == undefined) {
        this.focusindex = 0;
      }
      // var id=pinkElements.children[0].innerHTML;
    }
    // console.log(this.focusindex);
    if (this.focusindex > 2) {
      this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

    }
  }
  else if (hash.key == 'ArrowUp') {
    if (this.focusindex > -1) {
      this.focusindex--;

      if (this.focusindex > 1) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
      }
    }
    if (this.focusindex == -1) {
      this.focusindex = -1;


    }
  }
  else if (hash.key == 'Enter' && this.focusindex > -1) {
    if(this.accounts.length == 0){
      this.showApproversList = false;
    }
    event.preventDefault();
    var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

    var approverObj = pinkElement[0].attributes[2].value;

    this.selectAccount(approverObj);

    this.showApproversList = false;
    this.approverName2 = '';
    this.focusindex = -1;

  } else {
    this.focusindex = -1;
  }
}
focusindexR:number=-1;
keypressRegion(hash){
  if (hash.key == 'ArrowDown') {
    this.focusindexR++;
    if (this.focusindexR > 0) {
      var pinkElements = document.getElementsByClassName("pinkfocus")[1];
      if (pinkElements == undefined) {
        this.focusindexR = 0;
      }
      // var id=pinkElements.children[0].innerHTML;
    }
    if (this.focusindexR > 2) {
      this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindexR - 2) * 2.9) + 'rem' };

    }
  }
  else if (hash.key == 'ArrowUp') {
    if (this.focusindexR > -1) {
      this.focusindexR--;

      if (this.focusindexR > 1) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindexR - 2) * 2.9) + 'rem' };
      }
    }
    if (this.focusindexR == -1) {
      this.focusindexR = -1;


    }
  }
  else if (hash.key == 'Enter' && this.focusindexR > -1) {
    event.preventDefault();
    var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

    var approverObj = pinkElement[0].attributes[2].value;

    this.selectRegion(approverObj);

    this.showApproversList = false;
    this.approverName2 = '';
    this.focusindexR = -1;

  } else {
    this.focusindexR = -1;
  }
}

blurAccount(){
  this.AccountInput='';
  setTimeout(() => {
    this.showAccountList=false;
  }, 500);

}

blurRegion(){
  this.regionInput='';
  setTimeout(() => {
    this.showRegionList=false;
  }, 500);

}

  //function for selecting approvers from dropdown//
  selectApprovers(approver) {

    this.selApprover = approver;
    let thisclass: any = this;
    this.showApproversList = false;
    thisclass.approverName = '';
    this.selectedApprovers.push(approver);
    for (var i = 0; i < this.approversList.length; i++) {
      if (this.approversList[i].displayName === approver.displayName) {
        this.approversList.splice(i, 1);
        return;
      }
    }


  }

  selectApprovers2(approver) {

    let thisclass: any = this;
    this.showApproversList2 = false;
    thisclass.approverName2 = '';
    // for (var i = 0; i < this.selectedApprovers.length; i++) {
    //     if(this.selectedApprovers[i].displayName === approver.displayName){
    //       return;
    //     }
    // }
    this.selectedApprovers2.push(approver);
    for (var i = 0; i < this.approversList2.length; i++) {
      if (this.approversList2[i].displayName === approver.displayName) {
        this.approversList2.splice(i, 1);

        return;
      }
    }
  }


  // function for removing selected approvers
  removeApprover(index, approver) {
    this.approversList.push(approver);
    this.selectedApprovers.splice(index, 1);
  }

  removeApprover2(index, approver) {
    this.approversList2.push(approver);
    this.selectedApprovers2.splice(index, 1);
  }

  //function for closing dropdown on outside click//
  closeDropdowns() {
    this.showApproversList = false;
  }

  // function for slack channel avalability //
  checkSlackNameAvailability() {
    this.createSlackModel.name = this.model.slackName;
    if (!this.model.slackName) {
      return;
    }
    this.validateChannelName();
  }




  validateGIT() {
    var giturl = this.gitRepo;
    var lastpart = giturl.substring(giturl.length - 4, giturl.length);
    if (lastpart != '.git' && this.gitRepo != '') this.git_err = true;
    else this.git_err = false;
  }

  validateName(event) {

    if (this.model.serviceName != null) {
      this.firstcharvalidation = Number(this.model.serviceName[0]).toString();
    }
    if (this.firstcharvalidation != "NaN") {
      this.invalidServiceName = true;
    }

    if (this.model.domainName != null) {
      this.firstcharvalidation = Number(this.model.domainName[0]).toString();
    }
    if (this.firstcharvalidation != "NaN") {
      this.invalidDomainName = true;
    }


    if (this.model.serviceName != null && (this.model.serviceName[0] == ('-')) || (this.model.serviceName[this.model.serviceName.length - 1] === '-')) {
      this.invalidServiceName = true;
    }

    if (this.model.domainName != null && (this.model.domainName[0] === '-' || this.model.domainName[this.model.domainName.length - 1] === '-')) {
      this.invalidDomainName = true;
    }

    if (this.invalidServiceName == false && this.invalidDomainName == false && this.invalidServiceNameNum == false) {
      this.serviceNameAvailability();
    }
  }
  // function for service name avalability //
  serviceNameAvailability() {
    if (!this.model.serviceName || !this.model.domainName) {
      return;
    }
    this.validateServiceName();
  }

  // function ttl value
  onTTLChange() {
    if (this.model.ttlValue) {
      if (parseInt(this.model.ttlValue) > 3600 || parseInt(this.model.ttlValue) < 1) {
        this.invalidttl = true;
      } else {
        this.invalidttl = false;
      }
    } else {
      this.invalidttl = true;
    }
  };

  // function disable the submit till all entered datas are valid
  disableForm() {
    if (this.git_err) return true;

    if (this.selectedApprovers === undefined || this.selectedApprovers.length === 0) {
      return true;
    }
    if (!this.serviceAvailable) {
      return true;
    }
    if (this.slackSelected && !this.slackAvailble) {
      return true
    }
    if (this.ttlSelected && this.invalidttl) {
      return true
    }
    if (this.rateExpression.error != undefined && this.typeOfService == 'function' && this.rateExpression.type != 'none') {
      return true
    }
    if (this.eventExpression.type == 'dynamodb' && this.eventExpression.dynamoTable == undefined) {
      return true
    }
    if (this.eventExpression.type == 'kinesis' && this.eventExpression.streamARN == undefined) {
      return true
    }
    if (this.eventExpression.type == 's3' && this.eventExpression.S3BucketName == undefined) {
      return true
    }
    if (this.invalidServiceName || this.invalidDomainName || this.invalidServiceNameNum) {
      return true
    }
    // this.approverName = '';
    if (this.approverName != '') {
      return true;
    }
    return false;
  }
  gitChange() {

    this.gitCloneSelected = !this.gitCloneSelected;
    if (!this.gitCloneSelected) {
      this.git_err = false;
    }


  }
  keypress(hash) {
    if (this.typeOfService == 'website') {
      var gitClone = <HTMLInputElement>document.getElementById("checkbox-gitclone");

      this.git_clone = gitClone.checked;

      if (this.git_clone) {
        var gitPrivate = <HTMLInputElement>document.getElementById("checkbox-gitprivate");

        this.git_private = gitPrivate.checked;

        this.git_url = "https://" + this.gitRepo;
      }
    }

    if (hash.key == 'ArrowDown') {
      this.focusindex++;
      if (this.focusindex > 0) {
        var pinkElements = document.getElementsByClassName("pinkfocus")[3];
        // if(pinkElements == undefined)
        //   {
        //     this.focusindex = 0;
        //   }
      }
      if (this.focusindex > 2) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

      }
    }
    else if (hash.key == 'ArrowUp') {

      if (this.focusindex > -1) {
        this.focusindex--;

        if (this.focusindex > 1) {
          this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
        }
      }
      if (this.focusindex == -1) {
        this.focusindex = -1;


      }
    }
    else if (hash.key == 'Enter' && this.focusindex > -1) {
      event.preventDefault();
      var pinkElement;
      pinkElement = document.getElementsByClassName('pinkfocususers')[0].children;
      // var pinkElementS = document.getElementsByClassName("pinkfocus")[0];
      // if (pinkElementS == undefined)
      // {
      //   var p_ele = document.getElementsByClassName('pinkfocus')[2];
      //   if(p_ele == undefined){

      //   }
      //   else pinkElement = document.getElementsByClassName('pinkfocus')[2].children;

      // }
      // else
      //   pinkElement = pinkElementS.children;
      var approverObj = {
        displayName: pinkElement[0].attributes[2].value,
        givenName: pinkElement[0].attributes[3].value,
        userId: pinkElement[0].attributes[4].value,
        userEmail: pinkElement[0].attributes[5].value
      }
      this.selectApprovers(approverObj);

      this.showApproversList = false;
      this.approverName = '';
      this.focusindex = -1;

    } else {
      this.focusindex = -1;
    }
  }

  keypress2(hash)
  {
    if (hash.key == 'ArrowDown') {
      this.focusindex++;
      if (this.focusindex > 0) {
        var pinkElements = document.getElementsByClassName("pinkfocus")[0];
        if (pinkElements == undefined) {
          this.focusindex = 0;
        }
        // var id=pinkElements.children[0].innerHTML;
      }
      if (this.focusindex > 2) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

      }
    }
    else if (hash.key == 'ArrowUp') {
      if (this.focusindex > -1) {
        this.focusindex--;

        if (this.focusindex > 1) {
          this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
        }
      }
      if (this.focusindex == -1) {
        this.focusindex = -1;


      }
    }
    else if (hash.key == 'Enter' && this.focusindex > -1) {
      event.preventDefault();
      var pinkElement;
      pinkElement = document.getElementsByClassName("pinkfocuslack")[0].children;
      // var pink_ele = document.getElementsByClassName("pinkfocus")[2];
      // if(pink_ele != undefined){
      //   alert('not undefined')
      //   pinkElement = document.getElementsByClassName("pinkfocus")[2].children;

      // }
      // else{
      //   alert('undefined')



      // }

      var approverObj = {
        displayName: pinkElement[0].attributes[2].value,
        givenName: pinkElement[0].attributes[3].value,
        userId: pinkElement[0].attributes[4].value,
        userEmail: pinkElement[0].attributes[5].value
      }
      this.selectApprovers2(approverObj);

      this.showApproversList = false;
      this.approverName2 = '';
      this.focusindex = -1;

    } else {
      this.focusindex = -1;
    }
  }

  slackFunction() {
    if (!this.slackSelected) {
      this.createslackSelected = false;
    }
  }

  CrSlackFunction() {

  }

  focusInput(event) {
    document.getElementById('approverName').focus();
  }

  focusInput2(event) {
    document.getElementById('approverName2').focus();
  }

  createSlack(event) {
    event.preventDefault();
    var payload = {
      "channel_name": this.model.slackName,
      "users": []
    }
    var currentuser = this.authenticationservice.getUserId();
    for (var i = 0; i < this.selectedApprovers2.length; i++) {
      payload.users[i] = { "email_id": this.selectedApprovers2[i].userEmail };
      if (this.selectedApprovers2[i].userId.toLowerCase() == currentuser) {
        this.currentUserSlack = true;
      }
      if (!this.currentUserSlack) {
        payload.users[this.selectedApprovers2.length] = { "email_id": this.loginUserDetail.userEmail };
      }
      this.isLoadingNewSlack = true;
      this.http.post('/jazz/slack-channel', payload).subscribe(
        (Response) => {
          var output = Response;
          this.resMessage = this.toastmessage.successMessage(Response, "createSlack");
          this.isLoadingNewSlack = false;

          this.createslackSelected = false;
          this.validateChannelName();
          this.toast_pop('success', 'Success!!', this.resMessage);
        },
        (error) => {

          this.isLoadingNewSlack = false;
          this.errBody = error._body;
          this.errMessage = this.toastmessage.errorMessage(error, 'createSlack');
          this.toast_pop('error', 'Oops!', this.errMessage);
          try {
            this.parsedErrBody = JSON.parse(this.errBody);
          } catch (e) {
            console.log('JSON Parse Error', e);
          }
        });
    }
  }

  cancelCreateSlack() {
    this.createslackSelected = false;
    this.createSlackModel.name = '';
    this.createSlackModel.purpose = '';
    this.createSlackModel.invites = '';
    for (var i = 0; i < this.selectedApprovers2.length; i++) {
      this.approversList2.push(this.selectedApprovers2[i]);
    }
    this.selectedApprovers2 = [];
  }
  selectAccountsRegions(){

    this.selectAccount(this.accList[0]);
    this.selectRegion(this.regList[0]);
  }

  ngOnInit() {
    this.selectAccountsRegions();
    // this.gitRepo = "https://";
    this.getData();

  };

  publicEndpoint() {
    if (this.publicSelected = true) {
      this.vpcSelected = false;
    }
  }

  ngOnChanges(x: any) {


  }

  // check(event){
  //   var gitClone = <HTMLInputElement> document.getElementById("checkbox-gitclone");

  //   this.git_clone =  gitClone.checked;


  // }

  // checkk(event){
  //   var gitClone = <HTMLInputElement> document.getElementById("checkbox-gitclone");

  //     this.git_clone =  gitClone.checked;


  //   var gitPrivate = <HTMLInputElement> document.getElementById("checkbox-gitprivate");

  //   this.git_private =  gitPrivate.checked;

  //   this.git_url = "https://"+this.gitRepo;
  //
  // }
  // cron validation related functions //

  inputChanged(val) {
    this.Currentinterval = val;
  }

  private isCronObjValid(cronObj) {
    var cronValidity = this.cronParserService.validateCron(cronObj);
    this.cronFieldValidity = cronValidity;
    if (cronValidity.isValid === true) {
      return true;
    }
    return false;
  };



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

      if (duration === undefined || duration === null || duration <= 0) {
        this.rateExpression.isValid = false;
        this.rateExpression.error = 'Please enter a valid duration';
      } else {
        if (interval == 'Minutes') {
          this.cronObj = new CronObject(('0/' + duration), '*', '*', '*', '?', '*');
        } else if (interval == 'Hours') {
          this.cronObj = new CronObject('0', ('0/' + duration), '*', '*', '?', '*');
        } else if (interval == 'Days') {
          this.cronObj = new CronObject('0', '0', ('1/' + duration), '*', '?', '*');
        }
        this.rateExpression.isValid = true;
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
      }
    } else if (rateExpression['type'] == 'cron') {
      var cronExpression;
      var cronObj = this.cronObj;
      var cronObjFields = this.cronParserService.cronObjFields;
      var _isCronObjValid = this.isCronObjValid(cronObj)

      if (_isCronObjValid === false) {
        this.rateExpression.isValid = false;
        this.rateExpression.error = 'Please enter a valid cron expression';
      } else {
        this.rateExpression.isValid = true;
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
      }
    }

    if (this.rateExpression.isValid === undefined) {
      return undefined;
    } else if (this.rateExpression.isValid === false) {
      return 'invalid';
    } else if (this.rateExpression.isValid === true) {
      return this.rateExpression.cronStr;
    }
  };

}

