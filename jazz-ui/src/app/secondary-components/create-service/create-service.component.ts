/** 
  * @type Component 
  * @desc create service component
  * @author
*/
import { Http, Headers, Response } from '@angular/http';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
// import { FORM_DIRECTIVES, ControlGroup, Control, Validators, FormBuilder, Validator, } from '@angular/common';
import { ServiceFormData, RateExpression, CronObject }    from './service-form-data';
import {CronParserService} from '../../core/helpers';
import { ToasterService} from 'angular2-toaster';
import { RequestService, DataCacheService } from "../../core/services";
import 'rxjs/Rx';
import {Observable} from 'rxjs/Rx';

@Component({
  selector: 'create-service',
  templateUrl: './create-service.component.html',
  providers: [RequestService],
  styleUrls: ['./create-service.component.scss']
})
export class CreateServiceComponent implements OnInit {

  @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();

  typeOfService:string = "api";
  typeOfPlatform:string = "aws";
  disablePlatform = true;
  selected:string = "Minutes";
  runtime:string = 'java';
  eventSchedule:string = 'fixedRate';
  private slackSelected: boolean = false;
  private ttlSelected: boolean = false;
  showApproversList: boolean = false;
  approverName:string;
  approversList: any = [];
  slackAvailble : boolean = false;
  slackNotAvailble : boolean = false;
  channelNameError : boolean = false;
  showLoader: boolean = false;
  isLoading: boolean = false;
  slackChannelLoader: boolean = false;
  serviceAvailable : boolean = false;
  serviceNotAvailable : boolean = false;
  serviceNameError : boolean = false;
  isDomainDefined : boolean = false;
  invalidttl : boolean = false;
  serviceRequested = false;
  serviceRequestFailure = false;
  serviceRequestSuccess = false;
  serviceLink:string;
  Currentinterval : string = 'Minutes';
  rateExpressionIsValid : boolean = false;
  rateExpressionError : string = '';
  cronFieldValidity : any;
  private headers = new Headers({'Content-Type': 'application/json'});
  submitted = false;
  vpcSelected: boolean = false;

  model = new ServiceFormData('','', '','','');
  cronObj = new CronObject('0/5','*','*','*','?','*')
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', this.selected, '');

  constructor (
    // private http: Http,
    private toasterService: ToasterService,
    private cronParserService: CronParserService,
    private http: RequestService,
    private cache: DataCacheService
  ) {}

  serviceTypeData = [
    {'name':'api','path':'../assets/images/icons/icon-api@3x.png'},
    {'name':'function','path':'../assets/images/icons/icon-function@3x.png'},
    {'name':'website','path':'../assets/images/icons/icon-function@3x.png'}
  ];
 
 // function for opening and closing create service popup
  closeCreateService(){
    this.cache.set("updateServiceList", true);
    this.serviceRequested = false;
    this.serviceRequestFailure = false;
    this.serviceRequestSuccess = false;
    this.onClose.emit(false);
  }

  selectedApprovers = [];

  rateData = ['Minutes','Hours','Days'];

  // function for changing service type
  changeServiceType(serviceType){
    this.typeOfService = serviceType;
  }
  
  // function for changing platform type
  changePlatformType(platformType){
    if(!this.disablePlatform){
      this.typeOfPlatform = platformType;
    }
  }

  // function called on runtime change(radio)
  onSelectionChange(val){
    this.runtime = val;
  }

  // function called on event schedule change(radio)
  onEventScheduleChange(val){
    this.rateExpression.type = val;
  }
  
  onSelectedDr(selected){
    this.rateExpression.interval = selected;
    this.generateExpression(this.rateExpression)
  }

  statusFilter(item){
    this.selected = item;
  };
  
  // function to get approvers list
  public getData() {
    this.http.get('/platform/ad/users')
        .subscribe((res: Response) => {
        this.approversList = res;
        this.approversList = this.approversList.data.values;
        console.log("get approvers list"+res);
    });
  }

  // function to validate slack channel
  public validateChannelName() {
    // this.slackChannelLoader = true;
  }

  // function to restore the slack channel availability when it is changed
  onSlackChange(){
    this.channelNameError = false;
    this.slackAvailble = false;
    this.slackNotAvailble = false;
  }

  // check service name availability
  public validateServiceName() {
    this.showLoader = true;

    this.http.get('/platform/is-service-available/?service='+this.model.serviceName+'&domain='+this.model.domainName)
        .subscribe(
        (Response) => {
         
        var output = Response;
        this.showLoader = false;
         console.log("validateServiceName"+output.data.available);
        if(output.data.available == true){
          console.log("output.data.available == true");
          this.serviceAvailable = true;
          this.serviceNotAvailable = false;
        } else if (output.data.available == false){
          console.log("output.data.available == false");
          this.serviceAvailable = false;
          this.serviceNotAvailable = true;
        } else {
          // alert("else");
           this.serviceNameError = true;
           this.serviceAvailable = false;
           this.serviceNotAvailable = false;
        }
        this.checkdomainName();
        (error) => {
        this.showLoader = false;
        this.serviceNameError = true;
        this.serviceAvailable = false;
        this.serviceNotAvailable = false;
        var err = error;
        this.checkdomainName();
        
        }
      }
    );
  }

  checkdomainName(){
    if(this.model.domainName){
        this.isDomainDefined = true;
    } else {
      this.isDomainDefined = false;
    }
  }

  // function to restore the service channel availability to false when it is changed
  onServiceChange(){
    this.isDomainDefined = false;
    this.serviceNameError = false;
    this.serviceAvailable = false;
    this.serviceNotAvailable = false;
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
                "username": "aanand12",
                "password": "Moonraft@1234567",
                "domain": this.model.domainName
            };

    if (this.typeOfService == 'api') {
      payload["runtime"] = this.runtime; 
      payload["require_internal_access"] = this.vpcSelected; 
    }
    else if(this.typeOfService == 'function'){
      payload["runtime"] = this.runtime;
      payload.service_type = 'lambda';
      payload["require_internal_access"] = this.vpcSelected;
      if(this.rateExpression.type != 'none'){
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
        if (this.rateExpression.cronStr == 'invalid') {
            return;
        } else if (this.rateExpression.cronStr !== undefined) {
            payload["rateExpression"] = this.rateExpression.cronStr;
        }
      }
    }

    if(this.slackSelected){
        payload["slack_channel"] = this.model.slackName;
    }
    if(this.typeOfService == 'api' && this.ttlSelected){
        payload["cache_ttl"] = this.model.ttlValue;
    }

    this.isLoading = true;
    this.http.post('/platform/create-serverless-service' , payload)
        .subscribe(
        (Response) => {
        var output = Response;
        this.serviceRequested = true;
        this.serviceRequestSuccess = true;
        this.serviceRequestFailure = false;
        this.isLoading = false;
        var index = output.data.create_service.data.indexOf("https://");
        this.serviceLink = output.data.create_service.data.slice(index, output.data.length);
        // console.log("testing output data:"+output.data.create_service+","+output.data.create_service.data);
        this.toasterService.pop('success', 'Success!!', output.data.create_service.data);
       },
        (error) => {
        this.isLoading = false;
        this.serviceRequested = true;
        this.serviceRequestSuccess = false;
        this.serviceRequestFailure = true;
        var err = error;
        this.toasterService.pop('error', 'Error!', err);

        // console.log(err)
        }
        );
  }
  
  // function to navigate from success or error screen to create service screen
  backToCreateService(){
    this.serviceRequested = false;
    this.serviceRequestSuccess = false;
    this.serviceRequestFailure = false;
  }
 
 // function to create a service
  onSubmit() { 
    this.submitted = true;
    // this.getData();
    this.createService();
  }


  // function to hide approver list when input field is empty
  onApproverChange(newVal) {
    if(!newVal){
      this.showApproversList = false;
    } else {
      this.showApproversList = true;
    }
  }


  //function for selecting approvers from dropdown//
  selectApprovers(approver){
    event.stopPropagation();
    this.approverName = '';
    this.showApproversList = false;
    for (var i = 0; i < this.selectedApprovers.length; i++) {
        if (this.selectedApprovers[i].givenName == approver.givenName) {
            return
        }
    }
    this.selectedApprovers.push(approver);
  }

  // function for removing selected approvers
  removeApprover(index,approver){
     this.selectedApprovers.splice(index,1);
  }

  //function for closing dropdown on outside click//
  closeDropdowns(){
    this.showApproversList = false;
  }

  // function for slack channel avalability //
  checkSlackNameAvailability(){
    if (!this.model.slackName) {
        return;
    }
    this.validateChannelName();
  }

  // function for service name avalability //
  serviceNameAvailability(){
    if (!this.model.serviceName) {
        return;
    }
    this.validateServiceName();
  }

  // function ttl value
  onTTLChange(){
     if(this.model.ttlValue){
        if(parseInt(this.model.ttlValue) > 3600 || parseInt(this.model.ttlValue) < 1) {
            this.invalidttl = true;
        } else {
          this.invalidttl = false;
        }
      } else {
        this.invalidttl = true;
      }
  };
  
  // function disable the submit till all entered datas are valid
  disableForm(){
    // if (this.selectedApprovers === undefined || this.selectedApprovers.length === 0) {
    //     return true;
    // }
    if (!this.serviceAvailable) {
        return true;
    }
    if (this.slackSelected && !this.slackAvailble) {
        return true
    }
    if (this.ttlSelected && this.invalidttl) {
        return true
    }
    if(this.rateExpression.error != undefined && this.typeOfService == 'function'){
        return true
    }
    return false;
  }

  ngOnInit() {
    // this.getData();
  };

  // cron validation related functions // 

  inputChanged(val){
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


  generateExpression(rateExpression){
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
          this.cronObj = new CronObject(('0/' + duration),'*','*','*','?','*');
        } else if (interval == 'Hours') {
          this.cronObj = new CronObject('0', ('0/' + duration),'*','*','?','*');
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
