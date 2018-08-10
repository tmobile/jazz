/**
  * @type Component
  * @desc create service component
  * @author
*/
import { Http, Headers, Response } from '@angular/http';
import { Component, Input, OnInit, Output, EventEmitter, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceFormData, RateExpression, CronObject, EventExpression } from '../service-form-data';
import { FocusDirective } from '../focus.directive';
import { CronParserService } from '../../../core/helpers';
import { ToasterService} from 'angular2-toaster';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from "../../../core/services";
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { ServicesListComponent } from "../../../pages/services-list/services-list.component";
import { environment as env_oss } from './../../../../environments/environment.oss';

@Component({
  selector: 'create-service',
  templateUrl: './create-service.component.html',
  providers: [RequestService,MessageService],
  styleUrls: ['./create-service.component.scss']
})


export class CreateServiceComponent implements OnInit {

  @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();
  sqsStreamString:string = "arn:aws:sqs:us-west-2:" + env_oss.aws.account_number + ":stream/";
  kinesisStreamString:string = "arn:aws:kinesis:us-west-2:" + env_oss.aws.account_number + ":stream/";
  dynamoStreamString:string = "arn:aws:dynamo:us-west-2:" + env_oss.aws.account_number + ":stream/";
  SlackEnabled:boolean = false;
  docs_link = env_oss.urls.docs_link;
  typeOfService:string = "api";
  typeOfPlatform:string = "aws";
  disablePlatform = true;
  selected:string = "Minutes";
  runtime:string = 'nodejs';
  eventSchedule:string = 'fixedRate';
  private slackSelected: boolean = false;
  private ttlSelected: boolean = false;
  showApproversList: boolean = false;
  approverName:string;
  approversList;
  slackAvailble : boolean = false;
  slackNotAvailble : boolean = false;
  channelNameError : boolean = false;
  showLoader: boolean = false;
  isLoading: boolean = false;
  slackChannelLoader: boolean = false;
  serviceAvailable : boolean = false;
  serviceNotAvailable : boolean = false;
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
  resMessage:string='';
  cdnConfigSelected:boolean = false;
  focusindex:any = -1;
  scrollList:any = '';
  toast : any;


  model = new ServiceFormData('','','', '','','');
  cronObj = new CronObject('0/5','*','*','*','?','*')
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', this.selected, '');
  eventExpression = new EventExpression("awsEventsNone",undefined,undefined,undefined,undefined);
  private doctors = [];
  private toastmessage:any;
  errBody: any;
	parsedErrBody: any;
  errMessage: any;
  invalidServiceName:boolean=false;
  invalidDomainName:boolean=false;


  constructor (
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

  public focusDynamo = new EventEmitter<boolean>();
  public focusKinesis = new EventEmitter<boolean>();
  public focusS3 = new EventEmitter<boolean>();
  public focusSQS = new EventEmitter<boolean>();

  chkDynamodb() {
    this.focusDynamo.emit(true);
    return this.eventExpression.type === 'dynamodb';
  }

  chkfrKinesis() {
    this.focusKinesis.emit(true);
    return this.eventExpression.type === 'kinesis';
  }

  chkSQS() {
    this.focusSQS.emit(true);
    return this.eventExpression.type === 'sqs';
  }

  chkS3() {
    this.focusS3.emit(true);
    return this.eventExpression.type === 's3';
  }

 // function for opening and closing create service popup
  closeCreateService(serviceRequest){
    if(serviceRequest){
      this.servicelist.serviceCall();
    }
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
  onAWSEventChange(val){
    this.eventExpression.type = val;
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
    let currentUserId = this.authenticationservice.getUserId();


  }

  // function to validate slack channel
  public validateChannelName() {

    this.slackChannelLoader = true;
    this.http.get('/jazz/is-slack-channel-available?slack_channel='+this.model.slackName)
        .subscribe(
        (Response) => {
        var output = Response;
        this.slackChannelLoader = false;
        if(output.data.is_available == true){
          this.slackAvailble = true;
          this.slackNotAvailble = false;
        } else if (output.data.is_available == false){
          this.slackAvailble = false;
          this.slackNotAvailble = true;
        } else {
           this.serviceAvailable = true;
           this.slackAvailble = false;
           this.slackNotAvailble = false;
        }},
        (error) => {
          this.slackChannelLoader = false;
          var err = error;
          this.resMessage=this.toastmessage.errorMessage(error, 'slackChannel');
          this.toast_pop('error', 'Oops!', this.resMessage);
        }
    );
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


    this.http.get('/jazz/is-service-available/?service='+this.model.serviceName+'&domain='+this.model.domainName)
        .subscribe(
        (Response) => {

        var output = Response;
        this.showLoader = false;
        if(output.data.available == true){
          this.serviceAvailable = true;
          this.serviceNotAvailable = false;
        } else if (output.data.available == false){
          this.serviceAvailable = false;
          this.serviceNotAvailable = true;
        } else {
           this.serviceAvailable = false;
           this.serviceNotAvailable = false;
        }
        this.checkdomainName();
        (error) => {
        this.showLoader = false;
        this.serviceAvailable = false;
        this.serviceNotAvailable = false;
        var err = error;
        this.checkdomainName();
      }
      },
      (error)=>{
        this.showLoader = false;
        this.resMessage=this.toastmessage.errorMessage(error, 'serviceAvailability');
        this.toast_pop('error', 'Oops!', this.resMessage);
      }
    );
  }

  toast_pop(error,oops,errorMessage)
  {
      var tst = document.getElementById('toast-container');

       tst.classList.add('toaster-anim');
      this.toast = this.toasterService.pop(error,oops,errorMessage);
      setTimeout(() => {
          tst.classList.remove('toaster-anim');
        }, 6000);

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
                "domain": this.model.domainName,
                "description":this.model.serviceDescription
            };

    if (this.typeOfService == 'api') {
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
    }
    else if(this.typeOfService == 'function'){
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
      if(this.rateExpression.type != 'none'){
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
        if (this.rateExpression.cronStr == 'invalid') {
            return;
        } else if (this.rateExpression.cronStr !== undefined) {
            payload["rateExpression"] = this.rateExpression.cronStr;
        }
      }

      if(this.eventExpression.type !== "awsEventsNone") {
        var event = {};
        event["type"] = this.eventExpression.type;
        if(this.eventExpression.type === "dynamodb") {
          event["source"] = "arn:aws:dynamodb:us-west-2:"+env_oss.aws.account_number+":table/" + this.eventExpression.dynamoTable;
          event["action"] = "PutItem";
        } else if(this.eventExpression.type === "kinesis") {
          event["source"] = "arn:aws:kinesis:us-west-2:"+env_oss.aws.account_number+":stream/" + this.eventExpression.streamARN;
          event["action"] = "PutRecord";
        } else if(this.eventExpression.type === "s3") {
          event["source"] = this.eventExpression.S3BucketName;
          event["action"] = "S3:" + this.eventExpression.S3BucketName + ":*";
        } else if (this.eventExpression.type === "sqs") {
          event["source"] = "arn:aws:sqs:us-west-2:"+env_oss.aws.account_number+":stream/" + this.eventExpression.SQSstreamARN;
        }
        payload["events"] = [];
        payload["events"].push(event);
      }

    } else if(this.typeOfService == 'website'){
      payload["create_cloudfront_url"] = this.cdnConfigSelected;
    }

    if(this.slackSelected){
        payload["slack_channel"] = this.model.slackName;
    }
    if(this.typeOfService == 'api' && this.ttlSelected){
        payload["cache_ttl"] = this.model.ttlValue;
    }

    this.isLoading = true;
    this.http.post('/jazz/create-serverless-service' , payload)
        .subscribe(
        (Response) => {
          var output = Response;
          this.serviceRequested = true;
          this.serviceRequestSuccess = true;
          this.serviceRequestFailure = false;
          this.isLoading = false;
          var index = output.data.indexOf("https://");
          this.serviceLink = output.data.slice(index, output.data.length);
          this.resMessage=this.toastmessage.successMessage(Response,"createService");
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
            if(this.parsedErrBody.message != undefined && this.parsedErrBody.message != '' ) {
              this.errMessage = this.parsedErrBody.message;
            }
          } catch(e) {
              console.log('JSON Parse Error', e);
            }
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
    this.getData();
    this.createService();
    this.typeOfService = 'api';
    this.selectedApprovers=[];
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
  selectApprovers(approver) {
    let thisclass : any = this;
    this.showApproversList = false;
    thisclass.approverName = '';
    this.selectedApprovers.push(approver);
    for(var i = 0; i < this.approversList.length; i++){
      if(this.approversList[i].displayName === approver.displayName){
        this.approversList.splice(i,1);
        return;
      }
    }
  }



  // function for removing selected approvers
  removeApprover(index,approver){
    this.approversList.push(approver);
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

  validateName(event) {
    if(this.model.serviceName != null &&(this.model.serviceName[0] === '-' || this.model.serviceName[this.model.serviceName.length - 1] === '-')){
      this.invalidServiceName = true;
    }
    if(this.model.domainName != null && (this.model.domainName[0] === '-' || this.model.domainName[this.model.domainName.length -1] === '-')){
      this.invalidDomainName = true;
    }
    if(this.invalidServiceName == false && this.invalidDomainName==false){
      this.serviceNameAvailability();
    }
}
  // function for service name avalability //
  serviceNameAvailability(){
    if (!this.model.serviceName || !this.model.domainName) {
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
    if (!this.serviceAvailable) {
        return true;
    }
    if (this.slackSelected && !this.slackAvailble) {
        return true
    }
    if (this.ttlSelected && this.invalidttl) {
        return true
    }
    if(this.rateExpression.error != undefined && this.typeOfService == 'function' && this.rateExpression.type != 'none'){
        return true
    }
    if(this.eventExpression.type == 'dynamodb' && this.eventExpression.dynamoTable == undefined){
        return true
    }
    if(this.eventExpression.type == 'kinesis' && this.eventExpression.streamARN == undefined){
        return true
    }
    if(this.eventExpression.type == 's3' && this.eventExpression.S3BucketName == undefined){
        return true
    }
    if(this.invalidServiceName || this.invalidDomainName){
      return true
    }
    return false;
  }

  keypress(hash)
  {


    if(hash.key == 'ArrowDown')
    {
     this.focusindex++;
     if(this.focusindex>0){
      var pinkElements = document.getElementsByClassName("pinkfocus")[0];
      if(pinkElements == undefined)
        {
          this.focusindex = 0;
        }
    }
      if(this.focusindex>2)
      {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

      }
    }
    else if(hash.key == 'ArrowUp')
    {
      if(this.focusindex > -1){
        this.focusindex--;

        if(this.focusindex>1)
        {
          this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
        }
      }
      if(this.focusindex == -1) {
         this.focusindex = -1;


         }
    }
    else if(hash.key == 'Enter' && this.focusindex > -1)
    {
      var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

      var approverObj= {
        displayName:pinkElement[0].attributes[2].value,
        givenName:pinkElement[0].attributes[3].value,
        userId:pinkElement[0].attributes[4].value,
        userEmail:pinkElement[0].attributes[5].value
      }
      this.selectApprovers(approverObj);

      this.showApproversList = false;
      this.approverName = '';
      this.focusindex = -1;

    } else {
      this.focusindex = -1;
    }
  }

  focusInput(event){
    document.getElementById('approverName').focus();
  }

  ngOnInit() {
    this.getData();
    if(env_oss.slack_support) this.SlackEnabled=true;
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
