/**
  * @type Component
  * @desc create service component
  * @author
*/
import { Http, Headers, Response } from '@angular/http';
import { Component, Input, OnInit, Output, EventEmitter, NgModule, AfterViewInit,ElementRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceFormData, RateExpression, CronObject, EventExpression, EventLabels, AzureEventExpression, AzureEventLabels } from '../service-form-data';
import { FocusDirective } from '../focus.directive';
import { CronParserService } from '../../../core/helpers';
import { ToasterService} from 'angular2-toaster';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from "../../../core/services";
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { ServicesListComponent } from "../../../pages/services-list/services-list.component";
import { environment as env_oss } from './../../../../environments/environment.oss';
import { environment } from "../../../../environments/environment";
import { nodejsTemplate } from "../../../../config/templates/nodejs-yaml";
import { javaTemplate } from "../../../../config/templates/java-yaml";
import { goTemplate } from "../../../../config/templates/go-yaml";
import { pythonTemplate } from "../../../../config/templates/python-yaml";
const yamlLint = require('yaml-lint');


@Component({
  selector: 'create-service',
  templateUrl: './create-service.component.html',
  providers: [RequestService,MessageService],
  styleUrls: ['./create-service.component.scss']
})


export class CreateServiceComponent implements OnInit {

  @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();
  deploymentDescriptorTextJava = javaTemplate.template;
  deploymentDescriptorTextNodejs = nodejsTemplate.template;
  deploymentDescriptorTextgo = goTemplate.template;
  deploymentDescriptorTextpython = pythonTemplate.template;
  deploymentDescriptorText = this.deploymentDescriptorTextNodejs;
  startNew:boolean = false;
  typeofservice:boolean=true;
  typeofplatform:boolean=false;
  typeofserviceSelected:boolean = false;
  typeofplatformSelected:boolean = false;
  typeofruntimeSelected:boolean = false;
  deploymenttargetSelected:boolean = false;
  typeOfRuntime:string = "nodejs";
  ids=[
    "typeofservice",
    "platform-type",
    "runtime-type",
    "website-type",
    "additional"
  ]
  isyamlValid:boolean = true;
  typeform:boolean=false;
  typeevents:boolean=false;
  version: string = ">=1.0.0 <2.0.0";
  deploymentDescriptorFilterData = ["Function Template", "Start New"];
  selectedList:string='Function Template';
  sqsStreamString:string = "arn:aws:sqs:" + env_oss.aws.region + ":" + env_oss.aws.account_number + ":";
  kinesisStreamString:string = "arn:aws:kinesis:" + env_oss.aws.region + ":" + env_oss.aws.account_number + ":stream/";
  dynamoStreamString:string = "arn:aws:dynamo:" + env_oss.aws.region + ":" + env_oss.aws.account_number + ":table/";
  SlackEnabled:boolean = false;
  documentDBStreamString: string;
  eventStreamString: string;
  storageStreamString: string;
  serviceBusStreamString: string;
  invalidAzureEventName: boolean = false;
  docs_link = env_oss.urls.docs_link;
  typeOfService:string = "api";
  typeOfPlatform:string = "aws";
  disablePlatform = false;
  selected:string = "Minutes";
  runtime:string = Object.keys(env_oss.envLists)[0];
  webtime:string = Object.keys(env_oss.webLists)[0];
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
  validrate: boolean = false;
  serviceNotAvailable : boolean = false;
  isDomainDefined : boolean = false;
  invalidttl : boolean = false;
  serviceRequested = false;
  serviceRequestFailure = false;
  serviceRequestSuccess = false;
  serviceLink:string;
  Currentinterval : string = 'minutes';
  rateExpressionIsValid : boolean = false;
  rateExpressionError : string = '';
  cronFieldValidity : any;
  private headers = new Headers({'Content-Type': 'application/json'});
  submitted = false;
  vpcSelected: boolean = false;
  isDescriptorEmpty: boolean = false;
  resMessage:string='';
  cdnConfigSelected:boolean = false;
  public lineNumberCount: any = new Array(8);
  isfunction: boolean = true;
  is_function: boolean = false;
  linenumber:number;
  focusindex:any = -1;
  scrollList:any = '';
  toast : any;
  eventMaxLength:any = {
    "stream_name":0,
    "table_name":0,
    "queue_name":0,
    "bucket_name":0
  };
  serviceLimit:number;
  domainLimit:number;
  servicePatterns:any;

  model = new ServiceFormData('','','', '','','');
  cronObj = new CronObject('0/5','*','*','*','?','*')
  rateExpression = new RateExpression(undefined, undefined, 'none', '5', this.selected, '', '');
  eventExpression = new EventExpression("awsEventsNone",undefined,undefined,undefined,undefined);
  azureEventExpression = new AzureEventExpression("azureEventsNone",undefined,undefined,undefined,undefined);

  eventLabels = new EventLabels("Function","DynamoDB", "Table ARN", "Kinesis", "Stream ARN" ,"S3", "Bucket ARN","SQS", "Queue ARN");

  azureEventLabels = new AzureEventLabels("Function", "DocumentDB", "Table Name","Event Hubs", "Event Hub Name", "Storage", "Storage Account","Service Bus Queue", "Service Bus Name");

  amazonEventLabels = new EventLabels("Function","DynamoDB", "Table ARN", "Kinesis", "Stream ARN" ,"S3", "Bucket ARN","SQS", "Queue ARN");

  private doctors = [];
  private toastmessage:any;
  errBody: any;
	parsedErrBody: any;
  errMessage: any;
  invalidServiceName:boolean=false;
  invalidDomainName:boolean=false;
  invalidEventName:boolean = false;
  runtimeKeys : any;
  runtimeObject : any;
  accountList = [];
  regionList = [];
  accountSelected;
  accountDetails;
  events: string;
  regionSelected;
  accountMap: any;
  webObject : any;
  selectedDescriptorField: any;
  webKeys : any;
  isstartNew: boolean = false;
  deploymentTargetSelected: any;
  awsOnly: boolean = true;
  public lineNumberCounting: any = new Array(5);

  public buildEnvironment:any = environment;
  public deploymentTargets = this.buildEnvironment["INSTALLER_VARS"]["CREATE_SERVICE"]["DEPLOYMENT_TARGETS"];
  public apigeeFeature = this.buildEnvironment.INSTALLER_VARS.feature.apigee && this.buildEnvironment.INSTALLER_VARS.feature.apigee.toString() === "true" ? true : false;
  public selectedDeploymentTarget = "aws_apigateway";
  public azureEnabled: boolean = false;
  public disableFunction: boolean = false;

  constructor (
    private toasterService: ToasterService,
    private cronParserService: CronParserService,
    private http: RequestService,
    private cache: DataCacheService,
    public messageService: MessageService,
    private serviceList: ServicesListComponent,
    private authenticationService: AuthenticationService,
    private elementRef:ElementRef
  ) {
    this.toastmessage = messageService;
    this.runtimeObject = env_oss.envLists;
    this.runtimeKeys = Object.keys(this.runtimeObject);
    this.webObject = env_oss.webLists;
    this.webKeys = Object.keys(this.webObject);
  }

  public focusDynamo = new EventEmitter<boolean>();
  public focusKinesis = new EventEmitter<boolean>();
  public focusS3 = new EventEmitter<boolean>();
  public focusSQS = new EventEmitter<boolean>();
  public focusDocumentDB = new EventEmitter<boolean>();
  public focusEventHub = new EventEmitter<boolean>();
  public focusStorageAccount = new EventEmitter<boolean>();
  public focusServiceBus = new EventEmitter<boolean>();

  scrollTo(id) {
    const ele = document.getElementById(id);
    if(ele){
      ele.scrollIntoView({ behavior: 'smooth', block: 'start'});
    }
  }
  selectAccountsRegions(){
    if(this.typeOfPlatform === 'aws') {
    this.accountMap = env_oss.aws.accountMap;
    this.accountList = [];
    this.regionList = [];
    this.accountMap.map((item)=>{
      this.accountList.push(item.account + ' (' + item.accountName + ')' )
      if(item.primary){
        this.accountSelected = item.account
        this.accountDetails = item.account + ' (' + item.accountName + ')'
      }
    })
    this.regionList = this.accountMap[0].regions;
    this.regionSelected = this.regionList[0];
    this.setAccountandRegion();
    }
  }

  setAccountandRegion(){
    this.sqsStreamString = "arn:aws:sqs:" + this.regionSelected + ":" + this.accountSelected + ":";
    this.kinesisStreamString = "arn:aws:kinesis:" + this.regionSelected + ":" + this.accountSelected + ":stream/";
    this.dynamoStreamString = "arn:aws:dynamo:" + this.regionSelected + ":" + this.accountSelected + ":table/";
  }

  azureEventsPrefix() {
    this.documentDBStreamString = "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.cosmosdb/"
    this.eventStreamString = "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.eventHub/";
    this.serviceBusStreamString = "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.serviceBus/";
  }

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
  chkDocumentdb() {
    this.focusDocumentDB.emit(true);
    return this.azureEventExpression.type === 'cosmosdb';
  }

  chkEventHub() {
    this.focusEventHub.emit(true);
    return this.azureEventExpression.type === 'eventhub';
  }

  chkStorageAccount() {
    this.focusStorageAccount.emit(true);
    return this.azureEventExpression.type === 'storageaccount';
  }

  chkServiceBus() {
    this.focusServiceBus.emit(true);
    return this.azureEventExpression.type === 'servicebusqueue'
  }

  getSelectedData(data){
    this.deploymentTargetSelected = data;
    if(this.deploymentTargetSelected === 'gcp_apigee'){
      this.accountSelected = this.buildEnvironment.defaults.account_id,
      this.regionSelected = this.buildEnvironment.defaults.region
    }
  }

 // function for opening and closing create service popup
  closeCreateService(serviceRequest){
    if(serviceRequest){
      this.serviceList.serviceCall();
      this.showToastPending(
        'Service is getting ready',
        this.toastmessage.customMessage('successPending', 'createService'),
      );
    }
    this.cache.set("updateServiceList", true);
    this.serviceRequested = false;
    this.serviceRequestFailure = false;
    this.serviceRequestSuccess = false;
    this.onClose.emit(false);
    this.onFilterSelected(this.selectedList);
  }

  lineNumbers() {
    let lines;
    if(this.deploymentDescriptorText)
    {
      lines = this.deploymentDescriptorText.split(/\r*\n/);
      let line_numbers = lines.length;
      if(line_numbers < 5){
        line_numbers = 5;
      }
      this.lineNumberCounting = new Array(line_numbers);
    }
  }

  onFilterSelected(event){
    if(event == "Function Template"){
      this.startNew = false;
      this.isfunction = true;
      this.isstartNew = false;
      this.is_function = true;
      this.onSelectionChange(this.runtime, false);
    }
    else if(event == "Start New"){
      this.startNew = true;
      this.isstartNew = true;
      this.is_function = false;
      this.isfunction = false;
      this.deploymentDescriptorText = "";
    }
    this.selectedDescriptorField = event[0];
    this.isDescriptorEmpty = false;
  }
  onaccountSelected(event){
    this.accountMap.map((item,index)=>{
      if((item.account + ' (' + item.accountName + ')') === event){
        this.accountSelected = item.account
        this.accountDetails = item.account + ' (' + item.accountName + ')'
        this.regionList = item.regions;
        this.regionSelected = this.regionList[0];
      }
    })
    this.setAccountandRegion()    ;
  }
  onregionSelected(event){
    this.regionSelected = event;
    this.setAccountandRegion();
  }


  /**
   * Display pending toast
   * @param title Toast title
   * @param body  Toast body
   * @returns
   */
  // TODO: Abstract out to service
  showToastPending (title: string, body: string): void {
    const options = {
      body: body,
      closeHtml: '<button>Dismiss</button>',
      showCloseButton: true,
      timeout: 10000,
      title: title,
      type: 'wait',
    };

    // TODO: Investigate need for manual class addition
    const tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(options);
  }


  selectedApprovers = [];

  rateData = ['minutes','hours','days','minute','hour','day'];

  // function for changing service type
  changeServiceType(serviceType){
    this.typeOfService = serviceType;
    if(serviceType === 'sls-app' || serviceType === 'api'){
      this.changePlatformType('aws');
      this.azureEnabled = false;
    } else {
      if(typeof env_oss.azure.azure_enabled === "boolean" && env_oss.azure.azure_enabled === true){
        this.azureEnabled = true;
      }
    }
    if(this.typeOfService === 'function'){
      this.disableFunction = true;
    } else {
      this.disableFunction = false;
    }
    this.scrollTo('platform-type');
  }



  changeDeploymentTarget(deploymentTarget){
    this.selectedDeploymentTarget =  deploymentTarget;
    if(this.selectedDeploymentTarget === 'gcp_apigee'){
      this.accountSelected = this.buildEnvironment.aws.account_number,
      this.regionSelected = this.buildEnvironment.aws.region.region
    }
    this.scrollTo('runtime-type');
  }

  changeRuntimeType(runtimeType){
    this.typeOfRuntime=runtimeType;
  }


  // function for changing platform type
  changePlatformType(platformType){
    if(typeof env_oss.azure.azure_enabled === "boolean" && env_oss.azure.azure_enabled === true && platformType !== 'gcloud'){
      if(this.typeOfService === 'api' || this.typeOfService === 'sls-app'){
        this.awsOnly = true;
        this.typeOfPlatform = 'aws';
      } else {
        this.typeOfPlatform = platformType;
        if(this.typeOfService === 'function'){
          this.disableFunction = true;
        } else {
          this.disableFunction = false;
        }
        this.awsOnly = false;
      }
    } else {
      this.awsOnly = true;
      this.typeOfPlatform = 'aws';
    }
    this.events = this.typeOfPlatform.charAt(0).toUpperCase() + this.typeOfPlatform.slice(1);
    this.updateEventLabels(this.typeOfPlatform);
    this.updateAvailableRuntimes(this.typeOfPlatform);
    if(document.getElementById('deployment-type')){
      this.scrollTo('deployment-type-section');
    }
    else{
      if(this.typeOfService == 'website'){
        this.scrollTo('website-type');
      } else {
        this.scrollTo('runtime-type');
      }
    }

  }


  updateEventLabels(platformType){
  	if(platformType === "aws"){
    this.eventLabels = this.amazonEventLabels;
    this.eventExpression.type = 'awsEventsNone';
  	}
  	else if(platformType === "azure"){
      this.azureEventLabels = this.azureEventLabels;
    this.azureEventExpression.type = 'azureEventsNone';
  	}
  }

  updateAvailableRuntimes(platformType){
    this.runtimeObject = env_oss[platformType].envLists;
    this.runtimeKeys = Object.keys(this.runtimeObject);
    this.runtime = this.runtimeKeys[0];
  }


  // function called on runtime change(radio)
  onSelectionChange(val, shouldScroll = true){
    this.runtime = val;
    this.typeform = true;
    if(!this.startNew){
      switch(this.runtime){

        case 'java8' : this.deploymentDescriptorText = this.deploymentDescriptorTextJava; break;
        case 'nodejs8.10' : this.deploymentDescriptorText = this.deploymentDescriptorTextNodejs; break;
        case 'nodejs10.x' : this.deploymentDescriptorText = this.deploymentDescriptorTextNodejs; break;
        case 'go1.x' : this.deploymentDescriptorText = this.deploymentDescriptorTextgo; break;
        case 'python3.6' : this.deploymentDescriptorText = this.deploymentDescriptorTextpython; break;
        case 'c#' : this.deploymentDescriptorText = this.deploymentDescriptorTextpython; break;
      }
    }

    shouldScroll && this.scrollTo('additional');

  }



  onWebSelectionChange(val){
    this.webtime = val;
    this.scrollTo('additional');
  }

  // function called on event schedule change(radio)
  onEventScheduleChange(val){
    this.rateExpression.type = val;
    if(val !== `none`){
      if (this.typeOfPlatform === 'aws') {
        this.eventExpression.type = 'awsEventsNone';
      }
      else if (this.typeOfPlatform === 'azure') {
        this.azureEventExpression.type = 'azureEventsNone';
      }
      this.disableFunction = false;
    } else {
      this.disableFunction = true;
    }
  }
  onChangeText(val){
    if((<HTMLInputElement>document.getElementById(val)).value.length > 2){
      this.disableFunction = false;
    } else {
      this.disableFunction = true;
    }
    this.generateExpression(this.rateExpression);
  }
  onAWSEventChange(val){
    this.invalidEventName = false;
    this.eventExpression = new EventExpression("awsEventsNone",undefined,undefined,undefined,undefined);
    this.eventExpression.type = val;
    if(val !== `awsEventsNone`){
      this.rateExpression.type = 'none';
      this.disableFunction = false;
    } else{
      this.disableFunction = true;
    }
  }
  onAzureEventChange(val) {
    this.invalidAzureEventName = false;
    this.azureEventExpression = new AzureEventExpression("azureEventsNone",undefined,undefined,undefined,undefined);
    this.azureEventExpression.type = val;
    if(val !== `azureEventsNone`){
      this.rateExpression.type = 'none';
      this.disableFunction = false;
    } else{
      this.disableFunction = true;
    }
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
    let currentUserId = this.authenticationService.getUserId();
  }

  //function to validate event source names
  validateEvents(value){
    if(value != null && ((value[0] === '-' || value[value.length - 1] === '-') || (value[0] === '.' || value[value.length - 1] === '.') || (value[0] === '_' || value[value.length - 1] === '_'))){
      if(this.typeOfPlatform === 'aws') {
      this.invalidEventName = true; }
      else if(this.typeOfPlatform === 'azure') {
        this.invalidAzureEventName = true;
      }
    }
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

  // TODO:          Abstract invocations of toast_pop(...)
  // TODO cont'd:   to service
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
                "description":this.model.serviceDescription,
                "deployment_targets": {}
            };

    if (this.typeOfService == 'api') {
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
      if (this.typeOfPlatform === 'aws') {
        payload["deployment_targets"] = {
          "api": this.selectedDeploymentTarget || "aws_apigateway"
        }
      }
      else if (this.typeOfPlatform === 'azure') {
        payload["deployment_targets"] = {
          "api": "azure_apigateway"
        }
      }
    }
    else if(this.typeOfService == 'function'){
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
      if (this.typeOfPlatform === 'aws') {
        payload["deployment_targets"] = {
          "function": "aws_lambda"
        }
      }
      else if (this.typeOfPlatform === 'azure') {
        payload["deployment_targets"] = {
          "function": "azure_function"
        }
      }
      if(this.rateExpression.type !== 'none'){
        this.rateExpression.cronStr = this.cronParserService.getCronExpression(this.cronObj);
        if (this.rateExpression.cronStr == 'invalid') {
            return;
        } else if (this.rateExpression.cronStr !== undefined) {
            payload["rateExpression"] = this.rateExpression.cronStr;
        }
      }
      if(this.typeOfPlatform === 'aws') {
      if(this.eventExpression.type !== "awsEventsNone") {
        var event = {};
        event["type"] = this.eventExpression.type;
        if(this.eventExpression.type === "dynamodb") {
          event["source"] = "arn:aws:dynamodb:" + this.regionSelected + ":"+this.accountSelected+":table/" + this.eventExpression.dynamoTable;
          event["action"] = "PutItem";
        } else if(this.eventExpression.type === "kinesis") {
          event["source"] = "arn:aws:kinesis:" + this.regionSelected + ":"+this.accountSelected+":stream/" + this.eventExpression.streamARN;
          event["action"] = "PutRecord";
        } else if(this.eventExpression.type === "s3") {
          event["source"] = this.eventExpression.S3BucketName;
          event["action"] = "s3:ObjectCreated:*";
        } else if (this.eventExpression.type === "sqs") {
          event["source"] = "arn:aws:sqs:" + this.regionSelected + ":"+this.accountSelected+":"+ this.eventExpression.SQSstreamARN;
        }
        payload["events"] = [];
        payload["events"].push(event);
      }
    }
    else if(this.typeOfPlatform === 'azure') {
      if(this.azureEventExpression.type !== "azureEventsNone") {
        var event = {};
        event["type"] = this.azureEventExpression.type;
        if(this.azureEventExpression.type === "cosmosdb") {
          event["source"] =  "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.cosmosdb/"+ this.model.domainName + "/" + this.azureEventExpression.cosmosdb;
          event["action"] = "PutItem";
        } else if(this.azureEventExpression.type === "eventhub") {
          event["source"] = "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.eventHub/" + this.model.domainName + "/" + this.azureEventExpression.eventhub;
          event["action"] = "PutRecord";
        } else if(this.azureEventExpression.type === "storageaccount") {
          event["source"] = this.azureEventExpression.storageaccount;
          event["action"] = "storageBus";
        } else if (this.azureEventExpression.type === "servicebusqueue") {
          event["source"] = "subscriptions/" + env_oss.azure.azure_account_number + "/providers/Microsoft.serviceBus/"+ this.model.domainName + "/" + this.azureEventExpression.servicebusqueue;
        }
        payload["events"] = [];
        payload["events"].push(event);
      }
    }

    } else if(this.typeOfService == 'website'){
      payload["framework"] = this.webtime;
      payload["create_cloudfront_url"] = this.cdnConfigSelected;
      if (this.typeOfPlatform === 'aws') {
        payload["deployment_targets"] = {
          "website": "aws_cloudfront"
        }
      } else if (this.typeOfPlatform === 'azure') {
        payload["deployment_targets"] = {
          "website": "azure_cdnprofile"
        }
      }
    }
    else if(this.typeOfService == 'sls-app'){
      payload["service_type"] = "sls-app";
      payload["deployment_descriptor"] = this.deploymentDescriptorText;
      payload["deployment_targets"]={"sls-app":"aws_sls-app"};
      payload["runtime"] = this.runtime;
      payload["require_internal_access"] = this.vpcSelected;
      payload["is_function_template"] = this.is_function;
    }
    if(this.slackSelected){
        payload["slack_channel"] = this.model.slackName;
    }
    if(this.typeOfService == 'api' && this.ttlSelected){
        payload["cache_ttl"] = this.model.ttlValue;
    }

    /* Including deployment_accounts in the payload */
    if(this.typeOfPlatform === 'aws'){
      const deployment_accounts = [
        {
          "accountId": this.accountSelected,
          "region": this.regionSelected,
          "provider": this.typeOfPlatform,
          "primary":true
        }
      ]
      payload['deployment_accounts'] = deployment_accounts
    }
    else if(this.typeOfPlatform === 'azure') {
      const deployment_accounts = [
        {
          "accountId": env_oss.azure.azure_account_number,
          "region": env_oss.azure.azure_region,
          "provider": this.typeOfPlatform,
          "primary":true
        }
      ]
      payload['deployment_accounts'] = deployment_accounts
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
          this.resetEvents();
          this.selectAccountsRegions();
       },
        (error) => {
          this.isLoading = false;
          this.serviceRequested = true;
          this.serviceRequestSuccess = false;
          this.serviceRequestFailure = true;
          this.errBody = error._body;
          this.selectAccountsRegions();
          this.errMessage = this.toastmessage.errorMessage(error, 'createService');
          this.cronObj = new CronObject('0/5', '*', '*', '*', '?', '*')
          this.rateExpression.error = undefined;
          this.selectAccountsRegions();
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

  resetEvents(){
    this.eventExpression.dynamoTable = "";
    this.eventExpression.streamARN = "";
    this.eventExpression.S3BucketName = "";
    this.eventExpression.SQSstreamARN = "";
    this.azureEventExpression.cosmosdb = "";
    this.azureEventExpression.eventhub = "";
    this.azureEventExpression.storageaccount = "";
    this.azureEventExpression.servicebusqueue = "";
    this.cronObj = new CronObject('0/5', '*', '*', '*', '?', '*')
    this.rateExpression.error = undefined;
    this.rateExpression.type = 'none';
    this.rateExpression.duration = "5";
    this.eventExpression.type = 'awsEventsNone';
    this.azureEventExpression.type = 'azureEventsNone';
    this.runtime = this.runtimeKeys[0];
  }


  // function to navigate from success or error screen to create service screen
  backToCreateService(){
    this.serviceRequested = false;
    this.serviceRequestSuccess = false;
    this.serviceRequestFailure = false;
    this.onFilterSelected(this.selectedList);

  }

 // function to create a service
  onSubmit() {
    this.submitted = true;
    this.getData();
    this.createService();
    this.typeOfService = 'api';
    this.typeOfPlatform = 'aws';
    this.selectedApprovers = [];
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
    if (this.deploymentDescriptorText === '' && this.selectedDescriptorField === 'Start New') {
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
    if(this.eventExpression.type == 'sqs' && this.eventExpression.SQSstreamARN == undefined){
      return true
    }
    if(this.azureEventExpression.type == 'cosmosdb' && this.azureEventExpression.cosmosdb == undefined){
      return true
    }
    if(this.azureEventExpression.type == 'eventhub' && this.azureEventExpression.eventhub == undefined){
      return true
    }
    if(this.azureEventExpression.type == 'storageaccount' && this.azureEventExpression.storageaccount == undefined){
      return true
    }
    if(this.azureEventExpression.type == 'servicebusqueue' && this.azureEventExpression.servicebusqueue == undefined){
      return true
    }
    if(this.invalidServiceName || this.invalidDomainName){
      return true
    }
    if(this.invalidEventName || this.invalidAzureEventName){
      return true
    }
    if(!this.isyamlValid){
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

  loadMaxLength(){
    let maxEnvIfLength = 15;
    this.serviceLimit = env_oss.charachterLimits.serviceName;
    this.domainLimit = env_oss.charachterLimits.domainName;
    this.eventMaxLength.stream_name = env_oss.charachterLimits.eventMaxLength.stream_name - maxEnvIfLength;
    this.eventMaxLength.table_name = env_oss.charachterLimits.eventMaxLength.table_name - maxEnvIfLength;
    this.eventMaxLength.queue_name = env_oss.charachterLimits.eventMaxLength.queue_name - maxEnvIfLength;
    this.eventMaxLength.bucket_name = env_oss.charachterLimits.eventMaxLength.bucket_name - maxEnvIfLength;
    this.servicePatterns = env_oss.servicePatterns;
  }

  validateYAML(){
    yamlLint.lint(this.deploymentDescriptorText).then(() => {
      this.isyamlValid=true;
    }).catch((error) => {
      console.error('Invalid YAML file.', error);
      this.isyamlValid=false;
    });
    if (this.selectedDescriptorField === 'Start New' && this.deploymentDescriptorText === '') {
      this.isDescriptorEmpty = true;
    }
    else {
      this.isDescriptorEmpty = false;
    }
  }



  onScroll(event){
    let el = document.getElementById('crs');
    for(let i=0;i<this.ids.length;i++){
      let ele = document.getElementById(this.ids[i]);
      if(el.offsetHeight + el.scrollTop == el.scrollHeight)
      {

        if(ele){
          ele.classList.remove('in-active');
        }
        continue;
      }
      let windowHeight = window.innerHeight;

      if(this.ids[i]=="additional"){

        if(rect && rect.top < windowHeight/2){
          if(ele){
            ele.classList.add('ac-tive');
          }
        }
        let eventEle = document.getElementById('typeevents');
        if(eventEle){
          if (!eventEle.classList.contains('in-active')){
            if(ele){
              ele.classList.remove('ac-tive');
            }
          }
        }

      }

      if(ele){
        var rect = ele.getBoundingClientRect();
        let diff = windowHeight - ele.offsetHeight;

        if(i!=0){

          if(rect.top > windowHeight/2){
            ele.classList.add('in-active');
            if(this.ids[i].includes('type')){
              let newId = this.ids[i]+'-label';
              let element = document.getElementById(newId);
              if(element){
                element.classList.add('in-active');

              }
            }
          }

          else{
            ele.classList.remove('in-active');
            if(this.ids[i].includes('type')){
              let element = document.getElementById(this.ids[i]+'-label');
              if(element){
                element.classList.remove('in-active');
              }
            }
          }
        }

      }
    }
  }

  ngOnInit() {
    if(typeof env_oss.azure.azure_enabled === "boolean" && env_oss.azure.azure_enabled === true){
      this.azureEnabled = true;
    }
    if(this.typeOfService == 'api'){
      this.typeOfPlatform = 'aws';
      this.azureEnabled = false;
    }
    this.selectAccountsRegions();
    this.getData();
    this.loadMaxLength();
    this.onFilterSelected('Function Template')
    this.azureEventsPrefix();
    if(env_oss.slack_support) this.SlackEnabled=true;
  };

  inputChanged(val){
    this.Currentinterval = val;
  }

  // cron validation related functions //
  private isCronObjValid(cronObj) {
    var cronValidity = this.cronParserService.validateCron(cronObj);
    this.cronFieldValidity = cronValidity;
    if (cronValidity.isValid === true) {
      return true;
    }
    return false;
  };

  hasClass(el, cls) {
    if (el.className.match('(?:^|\\s)'+cls+'(?!\\S)')) { return true; }
    }
  addClass(el, cls) {
    if (!el.className.match('(?:^|\\s)'+cls+'(?!\\S)')){ el.className += ' '+cls; }
    }
  delClass(el, cls) {
    el.className = el.className.replace(new RegExp('(?:^|\\s)'+cls+'(?!\\S)'),'');
    }

  elementFromTop(elem, classToAdd, distanceFromTop, unit) {
    var winY = window.innerHeight || document.documentElement.clientHeight,
        distTop = elem.getBoundingClientRect().top,
        distPercent = Math.round((distTop / winY) * 100),
        distPixels = Math.round(distTop),
        distUnit;
    distUnit = unit == 'percent' ? distPercent : distPixels;
    if (distUnit <= distanceFromTop) {
      if (!this.hasClass(elem, classToAdd)) { this.addClass(elem, classToAdd); }
      } else {
      this.delClass(elem, classToAdd);
      }
    }

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
      this.validRate(duration, interval);
      this.rateExpression.rateStr = `${duration} ${interval}`

      if (duration === undefined || duration === null || duration <= 0 || this.validrate === false) {
        this.rateExpression.isValid = false;
        this.rateExpression.error = 'Please enter a valid rate expression';
      } else {
        this.rateExpression.isValid = true;
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
    } else if (this.rateExpression.isValid === true && this.rateExpression.type === 'cron') {
      return this.rateExpression.cronStr;
    }
    else if (this.rateExpression.isValid === true  && this.rateExpression.type === 'rate') {
      return this.rateExpression.rateStr;
    }
  };

}
