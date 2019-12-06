import { Component, OnInit, Input , OnChanges, SimpleChange, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { RequestService ,MessageService} from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import { ToasterService} from 'angular2-toaster';
import { DataService } from "../data-service/data.service";
import { DataCacheService , AuthenticationService } from '../../core/services/index';
import { environment as env_internal } from './../../../environments/environment.internal';
import { environment as env_oss} from './../../../environments/environment.oss';
@Component({
  selector: 'env-overview-section',
  templateUrl: './env-overview-section.component.html',
  providers: [RequestService,MessageService,DataService],
  styleUrls: ['./env-overview-section.component.scss']
})
export class EnvOverviewSectionComponent implements OnInit {

  @Output() onload:EventEmitter<any> = new EventEmitter<any>();
  @Output() envLoad:EventEmitter<any> = new EventEmitter<any>();
  @Output() open_sidebar:EventEmitter<any> = new EventEmitter<any>();

  accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	accSelected:string = this.accList[0];
  regSelected:string=this.regList[0];


  @Output() frndload:EventEmitter<any> = new EventEmitter<any>();


  private http:any;
  private sub:any;
  provider: any = '';
  serviceName: any = '';
  runtime: any = '';
  private env:any;
  branchname: any;
  friendlyChanged:boolean = false;
  tempFriendlyName:string;
  yaml:string = "";
  tempTextArea:string;
  friendlyName : string;
  yamlName:string;
  lastCommitted: any;
  editBtn:boolean = true;
  showAppDetail:boolean = false;
  saveBtn:boolean = false;
  slsapp:boolean = false;
  showCncl:boolean=false;
  editButton:boolean=true;
  saveButton:boolean=false;
  isCancel:boolean=false;
  version: string = ">=1.0.0 <2.0.0";
  showDisplay:boolean = false;
  rolesList: any = []
  isValid:boolean=false;
  startNew: boolean = true;
  showCancel:boolean = false;
  environmnt:any;
  isDiv:boolean=true;
  isvalid:boolean=false;
  envResponseEmpty:boolean = false;
  envResponseTrue:boolean = false;
  envResponseError:boolean = false;
  isLoading: boolean = true;
  isSecretLoading: boolean = true;
  dayscommit: boolean = false;
  hourscommit: boolean = false;
  seccommit: boolean = false;
  mincommit: boolean = false;
  isEditClicked:boolean=false;
  commitDiff: any;
  copylinkmsg = "COPY LINK TO CLIPBOARD";
  envstatus:any;
  status_val:number;
  errorTime:any;
	errorURL:any;
	errorAPI:any;
	errorRequest:any={};
	errorResponse:any={};
	errorUser:any;
	errorChecked:boolean=true;
	errorInclude:any="";
  json:any={};
  desc_temp:any;
  is_function:boolean;
  isfunction: boolean = true;
  linenumber:number;
  private toastmessage: any = '';
  public lineNumberCount: any = new Array(7);
  copyLink:string="Copy Link";
  disableSave:boolean = true;
  editEvents: boolean = true;
  access:any = []
  isAddOrDelete: boolean = false;
  errMessage: string = "Something went wrong while fetching your data";
  message:string="lalalala"
  private subscription:any;
  rolesObj:any = {};
  reqArnArray:any = [];
  roleValue: any = '';
  inValidArn: boolean = false;
  isError: boolean = false;
  noData: boolean = false;
  deleteRole: boolean = false;
  confirmationHeader:string = "";
  confirmationText:string = "";
  arnToBeDeleted:any = '';
  isNotWebsite: boolean = false;
  tvaultSafeName: any = '';
  firstSafeRole: any = '';
  tvaultEnabled: boolean = false;
  inputVal: any = ''

  @Input() service: any = {};
  @Input() isAdminAccess:boolean = false;
  temp_description:string;
  put_payload:any = {};
  services = {
    description:'NA',
    lastcommit:'NA',
    branchname:'NA',
    endpoint:'NA',
    repository:'NA',
    runtime:'NA',
    tags: 'NA'
  };
  endpList:any;
  constructor(
    private request:RequestService,
    private route: ActivatedRoute,
    private router: Router,
    private cache: DataCacheService,
    private toasterService: ToasterService,
    private messageservice:MessageService,
    private data: DataService,

    private authenticationservice: AuthenticationService ,
  ) {
    this.http = request;
    this.toastmessage = messageservice;

   }
  refresh() {
    this.envResponseEmpty = false;
    this.envResponseTrue = false;
    this.envResponseError = false;
    this.isLoading = true;
    this.ngOnInit();
  }
  //  prd?domain=jazz-testing&service=test-create

popup(state){
  if(state == 'enter'){
    var ele = document.getElementById('popup-endp');
  ele.classList.add('endp-visible');
  }
  if(state == 'leave'){
    var ele = document.getElementById('popup-endp');
    ele.classList.remove('endp-visible');
  }

}
  onEditClick(){
    this.tempFriendlyName=this.friendlyName;
    this.showCancel=true;
    this.saveBtn=true;
    this.editBtn=false;
  }

  lineNumbers() {
    let lines;
    if (this.yaml) {
      lines = this.yaml.split(/\r*\n/);
      let line_numbers = lines.length;
      if(line_numbers < 7){
        line_numbers = 7;
      }
      this.lineNumberCount = new Array(line_numbers);
    }
  }
 
  onSaveClick(){
    this.showCancel=false;
    this.saveBtn=false;
    this.editBtn=true;
    let self=this;

    var errMsgBody;
    if(this.friendlyChanged){
      this.put_payload.friendly_name= this.tempFriendlyName;
      this.http.put('/jazz/environments/'+ this.env +'?domain=' + this.service.domain + '&service=' + this.service.name,this.put_payload, this.service.id)
            .subscribe(
                (Response)=>{
                  let successMessage = self.toastmessage.successMessage(Response,"updateEnv");
                  self.toast_pop('success',"",successMessage);
                  self.callServiceEnv(false);
                  self.tempFriendlyName='';

                  this.callServiceEnv();
                  this.tempFriendlyName='';
                },
                (error)=>{
                  try{
                    errMsgBody=JSON.parse(error._body);
                  }
                  catch(e){
                  }
                  let errorMessage='';
                  if(errMsgBody!=undefined)
                    errorMessage = errMsgBody.message;

                  self.errMessage = self.toastmessage.errorMessage(Error, 'updateEnv');
                  self.toast_pop('error', 'Oops!', errorMessage);
                  self.callServiceEnv();

                }
              );
              this.isLoading=true;
              this.envResponseTrue=false;
              this.friendlyChanged=false;

    }

  }

  onCancelClick(){
    this.showCncl=false;
    this.saveBtn=false;
    this.editBtn=true;
    this.tempFriendlyName='';
  }
  toast_pop(error,oops,errorMessage)
  {
    var tst = document.getElementById('toast-container');
       tst.classList.add('toaster-anim');
      this.toasterService.pop(error,oops,errorMessage);
      setTimeout(() => {
          tst.classList.remove('toaster-anim');
        }, 3000);
  }

  formatLastCommit(){

    var commit = this.lastCommitted.substring(0,19);
    var lastCommit = new Date(commit);
    var now = new Date();
    var todays = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

            this.dayscommit = true;
            this.commitDiff = Math.floor(Math.abs((todays.getTime() - lastCommit.getTime())/(1000*60*60*24)));
            if( this.commitDiff == 0 ){
              this.dayscommit = false;
              this.hourscommit = true;
              this.commitDiff = Math.floor(Math.abs((todays.getHours() - lastCommit.getHours())));
              if( this.commitDiff == 0 ){
                this.dayscommit = false;
                this.hourscommit = false;
                this.mincommit = true;
                this.commitDiff = Math.floor(Math.abs((todays.getMinutes() - lastCommit.getMinutes())));
                if( this.commitDiff == 0 ){
                  this.dayscommit = false;
                  this.hourscommit = false;
                  this.mincommit = false;
                  this.seccommit = true;
                  this.commitDiff = "just now";
                }
              }
            }

  }
  openSidebar(){
    this.open_sidebar.emit(true);
}

  getSafeDetails() {
    this.reqArnArray = [];
    this.noData = false;
    this.rolesList = [];
    this.http.get(`/jazz/t-vault/safes/${this.tvaultSafeName}`).subscribe(
      (res) => {
        if (Object.keys(res.data.roles).length === 0) {
          this.noData = true;
          this.isSecretLoading = false;
        }
        else {
          this.rolesObj = res.data.roles;
          this.isSecretLoading = false;
          this.rolesList.push(Object.keys(this.rolesObj))
          this.rolesList[0].map((item) => {
            this.reqArnArray.push(this.rolesObj[item].arn);
          })
          if (this.reqArnArray.length > 1) {
            this.firstSafeRole = this.reqArnArray.splice(0, 1);
          } else if (this.reqArnArray.length === 1) {
            this.firstSafeRole = this.reqArnArray[0];
            this.reqArnArray = [];
          }
        }
      },
      (error) => {
        this.isError = true;
        this.isSecretLoading = false;
        let errMessage = this.toastmessage.errorMessage(error, "updateSecret");
        this.toast_pop("error", "Oops!", errMessage);
      }
    )
  }

  addRoleInSafe() {
    this.isSecretLoading = true;
    this.inputVal = "";
    let payload = {
      "arn": this.roleValue,
      "permission": "read"
    }
    this.http.post(`/jazz/t-vault/safes/${this.tvaultSafeName}/role`, payload).subscribe(
      res => {
        this.isAddOrDelete = false;
        let successMessage = this.toastmessage.successMessage(res, "updateSecret");
        this.toast_pop("success", "", successMessage);
        this.getSafeDetails();
      },
      (error) => {
        this.getSafeDetails();
        this.isAddOrDelete = false;
        let errMessage = this.toastmessage.errorMessage(error, "updateSecret");
        this.toast_pop("error", "Oops!", errMessage);
      }
    )
  }

  onCompleteClick() {
    let payload = { "arn": this.arnToBeDeleted };
    this.isSecretLoading = true;
    this.deleteRole = false;
    this.showDisplay = false;
    this.editEvents = true;
    this.http.delete(`/jazz/t-vault/safes/${this.tvaultSafeName}/role`, payload).subscribe(
      res => {
        let successMessage = this.toastmessage.successMessage(res, "updateSecret");
        this.toast_pop("success", "", successMessage);
        this.isSecretLoading = false;
        this.getSafeDetails();
      },
      (err) => {
        this.isSecretLoading = false;
        let errMessage = this.toastmessage.errorMessage(err, "updateSecret");
        this.toast_pop("error", "Oops!", errMessage);
      }
    )
  }

  outSidePopup() {
    this.deleteRole = false;
  }

  onDeleteClick(val) {
    this.deleteRole = true;
    this.arnToBeDeleted = "";
    this.arnToBeDeleted = val;
    this.confirmationHeader = this.toastmessage.customMessage("acknowledgementHeader", "secretConfirmation");
    this.confirmationText = this.toastmessage.customMessage("deleteRole", "secretConfirmation");
  }
  validRole(str) {
    const status = /arn:aws:iam::\d{12}:role\/\/?[a-zA-Z_0-9+=,.@\-_/]+/.test(str)
    return status;
  }

  onRoleNameChange(val) {
    this.roleValue = val;
    let isValid = this.validRole(this.roleValue)
    if (this.reqArnArray.length > 0) {
      if (isValid && (!this.reqArnArray.includes(this.roleValue) && this.firstSafeRole[0] !== this.roleValue)) {
        this.isAddOrDelete = true;
        this.inValidArn = false;
      } else {
        this.isAddOrDelete = false;
        this.inValidArn = true;
      }
    } else {
      if(isValid && this.firstSafeRole !== this.roleValue){
        this.isAddOrDelete = true;
        this.inValidArn = false;
      } else {
        this.isAddOrDelete = false;
        this.inValidArn = true;
      }
    }
  }

  onInputCancelClick() {
    this.inputVal = "";
    this.showDisplay = false;
    this.inValidArn = false;
  }

  addSecret() {
    this.showDisplay = true;
    this.roleValue = "";
    this.access = [];
    let emptyInputAvalable = this.access.filter(each => (!each.arnVal));
    if (!emptyInputAvalable.length) {
      this.access.push({ "arnVal": "" });
    }
  }
  copyRoleClipboard(x) {
    let element = null; // Should be <textarea> or <input>
    element = document.getElementById(x);
    element.select();
    try {
      document.execCommand("copy");
      this.copylinkmsg = "LINK COPIED";
    }
    finally {
      document.getSelection().removeAllRanges;
    }
  }

  secretEdiClick() {
    this.editEvents = false;
  }
  secretSaveClick() {
    this.editEvents = true;
    this.showDisplay = false;
    this.addRoleInSafe();
  }
  onSecretCancelClick() {
    this.editEvents = true;
    this.showDisplay = false;
    this.isAddOrDelete = false;
    this.inValidArn = false;
    this.inputVal = "";
  }

  checkTvaultAvailability(response) {
    if (this.tvaultEnabled) {
      if (response.data.environment[0].metadata && response.data.environment[0].metadata.safe) {
        this.tvaultSafeName = response.data.environment[0].metadata.safe.name;
        let ser = this.service.serviceType;
        if (ser !== undefined && ser !== "website") {
          this.isNotWebsite = true;
          this.getSafeDetails();
        }
      }
    }
  }

  callServiceEnv(shouldUpdateYaml = true) {
    if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
    this.onload.emit(this.environmnt.endpoint);
    this.subscription = this.http.get('/jazz/environments/'+ this.env +'?domain=' + this.service.domain + '&service=' + this.service.name, null, this.service.id).subscribe(
      // this.http.get('/jazz/environments/prd?domain=jazz-testing&service=test-create').subscribe(
        (response) => {
          if(response.data == (undefined || '')){

            this.envResponseEmpty = true;
            this.isLoading = false;
          }
          else {
            this.checkTvaultAvailability(response);
            this.onload.emit(response.data.environment[0].endpoint);
            this.envLoad.emit(response.data);
            this.environmnt=response.data.environment[0];
            this.cache.set('currentEnv',this.environmnt);
            this.status_val = parseInt(status[this.environmnt.status]);

            var deployment_status = ["deployment_completed","active","deployment_started" ,"pending_approval","deployment_failed","inactive","deletion_started","deletion_failed","archived"]

            this.envstatus = deployment_status[this.status_val].replace("_"," ");

            if (shouldUpdateYaml) {
              this.yamlName = response.data.environment[0].deployment_descriptor;
              this.yaml = this.yamlName;
            }

            var envResponse = response.data.environment[0];
            this.friendlyName = envResponse.friendly_name;
            this.branchname = envResponse.physical_id;
            this.lastCommitted = envResponse.last_updated;
            this.frndload.emit(this.friendlyName);
            this.formatLastCommit();
            this.lineNumbers();
            this.isLoading = false;
            this.envResponseTrue = true;
            this.envResponseEmpty = false;
          }
        },
        (error) => {
          if( error.status == "404"){
            this.router.navigateByUrl('404');
          }
          this.envResponseTrue = false;
          this.envResponseError = true;
          this.envResponseEmpty = false;
          this.isLoading = false;
          var payload ={
            "service" : this.service.name,
            "domain" : this.service.domain,         }
          this.getTime();
          this.errorURL = window.location.href;
          this.errorAPI = env_internal.baseurl+"/jazz/environment/"+this.env;
          this.errorRequest = payload;
          this.errorUser = this.authenticationservice.getUserId();
          this.errorResponse = JSON.parse(error._body);
          this.errMessage = this.toastmessage.errorMessage(error, "environment");
      })
    };

    getTime() {
      var now = new Date();
      this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
      + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
      }

    feedbackRes:boolean=false;
    openModal:boolean=false;
      feedbackMsg:string='';
      feedbackResSuccess:boolean=false;
    feedbackResErr:boolean=false;
    isFeedback:boolean=false;
      toast:any;
      model:any={
          userFeedback : ''
    };
    buttonText:string='SUBMIT';
    sjson:any={};
		djson:any={};
		reportIssue(){

					this.json = {
						"user_reported_issue" : this.model.userFeedback,
						"API": this.errorAPI,
						"REQUEST":this.errorRequest,
						"RESPONSE":this.errorResponse,
						"URL": this.errorURL,
						"TIME OF ERROR":this.errorTime,
						"LOGGED IN USER":this.errorUser
				}

					this.openModal=true;
					this.errorChecked=true;
					this.isLoading=false;
					this.errorInclude = JSON.stringify(this.djson);
					this.sjson = JSON.stringify(this.json);
				}

				openFeedbackForm(){
					this.isFeedback=true;
					this.model.userFeedback='';
					this.feedbackRes=false;
					this.feedbackResSuccess=false;
					this.feedbackResErr=false;
					this.isLoading = false;
					this.buttonText='SUBMIT';
        }
        reportEmail:string;
				mailTo(){
					location.href='mailto:'+this.reportEmail+'?subject=Jazz : Issue reported by'+" "+ this.authenticationservice.getUserId() +'&body='+this.sjson;
				}
				errorIncluded(){
				}

				submitFeedback(action){

					this.errorChecked = (<HTMLInputElement>document.getElementById("checkbox-slack")).checked;
					if( this.errorChecked == true ){
						this.json = {
								"user_reported_issue" : this.model.userFeedback,
								"API": this.errorAPI,
								"REQUEST":this.errorRequest,
								"RESPONSE":this.errorResponse,
								"URL": this.errorURL,
								"TIME OF ERROR":this.errorTime,
								"LOGGED IN USER":this.errorUser
						}
					}else{
						this.json = this.model.userFeedback ;
					}
					this.sjson = JSON.stringify(this.json);

					this.isLoading = true;

					if(action == 'DONE'){
						this.openModal=false;
						return;
					}

					var payload={
						"title" : "Jazz: Issue reported by "+ this.authenticationservice.getUserId(),
						"project_id":env_internal.urls.internal_acronym,
						"priority": "P4",
						"description": this.json,
						"created_by": this.authenticationservice.getUserId(),
						"issue_type" :"bug"
					}
					this.http.post('/jazz/jira-issues', payload).subscribe(
						response => {
							this.buttonText='DONE';
							this.isLoading = false;
							this.model.userFeedback='';
							var respData = response.data;
							this.feedbackRes = true;
							this.feedbackResSuccess= true;
							if(respData != undefined && respData != null && respData != ""){
								this.feedbackMsg = "Thanks for reporting the issue. We’ll use your input to improve Jazz experience for everyone!";
							}
						},
						error => {
							this.buttonText='DONE';
							this.isLoading = false;
							this.feedbackResErr = true;
							this.feedbackRes = true;
							this.feedbackMsg = this.toastmessage.errorMessage(error, 'jiraTicket');
						  }
					);
				}


   myFunction() {
    setTimeout( ()=> {this.resetCopyValue()}, 3000);
 }

 resetCopyValue(){
    this.copylinkmsg = "COPY LINK TO CLIPBOARD";
 }

 copyClipboard(copyapilinkid){
  var element = null; // Should be <textarea> or <input>
  element = document.getElementById(copyapilinkid);
  element.select();
  try {
      document.execCommand("copy");
      this.copylinkmsg = "LINK COPIED";
  }
  finally {
     document.getSelection().removeAllRanges;
  }
}
isOSS:boolean=false;
form_endplist(){
  // this.endpList=env_internal.urls.endplist;
}
  ngOnInit() {
    this.form_endplist();
    this.isError = false;
    if (typeof env_oss.tvault.tvault_enabled === "boolean" && env_oss.tvault.tvault_enabled === true) {
      this.tvaultEnabled = true;
    }
    if(env_oss.envName=='oss')this.isOSS=true;
    if(this.service.domain != undefined)
      this.callServiceEnv();
      this.data.currentMessage.subscribe(message => this.message = message)
  }

  ngOnChanges(x:any) {
    this.route.params.subscribe(
      params => {
      this.env = params.env;
    });
    this.environmnt={};
    if(this.service.domain != undefined)
      this.callServiceEnv();
      let ser=this.service.serviceType;
      if(ser == 'sls-app'){
        this.slsapp = true;
      }
}
notify(services){
  this.service=services;

  if(this.service.domain != undefined)
      {

        this.callServiceEnv();
      }
}
refreshCostData(event){
  this.callServiceEnv();
}

public goToAbout(hash){
	this.router.navigateByUrl('landing');
	this.cache.set('scroll_flag',true);
	this.cache.set('scroll_id',hash);
}

focusindex:number;
    showRegionList:boolean;
    showAccountList:boolean;
    selectedAccount=[];
    selectedRegion=[];
    scrollList:any;
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

      selRegion:any;
      selApprover:any;
      accounts = this.accList;
      regions = this.regList
selectAccount(account){
  this.selApprover = account;
    let thisclass: any = this;
    this.showAccountList = false;
    thisclass.AccountInput = '';
    this.selectedAccount.push(account);
    this.put_payload.accounts=this.selectedAccount;
    this.friendlyChanged=true;
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
  this.friendlyChanged=true;
}
selectRegion(region){
  this.selApprover = region;
    let thisclass: any = this;
    this.showRegionList = false;
    thisclass.regionInput = '';
    this.selectedRegion.push(region);
    this.put_payload.regions=this.selectedRegion;
    this.friendlyChanged=true;

    for (var i = 0; i < this.regions.length; i++) {
      if (this.regions[i] === region) {
        this.regions.splice(i, 1);
        return;
      }
    }
}
copy_link(id)
    {
        var element = null; // Should be <textarea> or <input>
        element = document.getElementById(id);
        element.select();
        try {
            document.execCommand("copy");
            this.copyLink = "Link Copied";
            setTimeout(() => {
              this.copyLink = "Copy Link";
            }, 3000);

        }
        finally {
            document.getSelection().removeAllRanges;
        }
    }
removeRegion(index, region) {
  this.regions.push(region);
  this.selectedRegion.splice(index, 1);
  this.friendlyChanged=true;
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
    var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

    var approverObj = pinkElement[0].attributes[2].value;

    this.selectAccount(approverObj);

    this.focusindex = -1;

  } else {
    this.focusindex = -1;
  }
}

keypressRegion(hash){
    if (hash.key == 'ArrowDown') {
        this.focusindex++;
        if (this.focusindex > 0) {
          var pinkElements = document.getElementsByClassName("pinkfocus2")[0];
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
        var pinkElement = document.getElementsByClassName("pinkfocus2")[0].children;

        var approverObj = pinkElement[0].attributes[2].value;

        this.selectRegion(approverObj);

        this.focusindex = -1;

      } else {
        this.focusindex = -1;
      }
}
}

export enum status {
  "deployment_completed"=0,
  "active",
  "deployment_started" ,
  "pending_approval",
  "deployment_failed",
  "inactive",
  "deletion_started",
  "deletion_failed",
  "archived"
}
