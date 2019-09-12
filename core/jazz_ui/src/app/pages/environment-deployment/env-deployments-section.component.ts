import { Component, OnInit, Input } from '@angular/core';
import { RequestService , MessageService , AuthenticationService } from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import { HttpModule } from '@angular/http';
import {DataCacheService } from '../../core/services/index';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { ToasterService } from 'angular2-toaster';
declare var $:any;
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';



@Component({
  selector: 'env-deployments-section',
  providers: [RequestService, MessageService],
  templateUrl: './env-deployments-section.component.html',
  styleUrls: ['./env-deployments-section.component.scss']
})
export class EnvDeploymentsSectionComponent implements OnInit {
  @Input() service: any = {};
  @Input() isDeployAccess: boolean = false;
  filterloglevel:string = 'INFO';
  loadingState:string='default';
  envObj:any;
  isSort:boolean = false;
  disableRetry:boolean = false;
  paginationSelected: Boolean = true;
	totalPagesTable: number = 7;
	prevActivePage: number = 1;
  limitValue : number = 10;
	offsetValue:number = 0;
  rowclick:boolean = false;
  retryBUTTON:boolean = true;
  rot_icon:boolean = true;
  rot_icon2:boolean = true;
  private toastmessage:any = '';
  envResponseEmpty:boolean = false;
  envResponseTrue:boolean = false;
  envResponseError:boolean = false;
  isLoading: boolean = true;
  disableBuild: boolean = false;
  private subscription:any;
  private http:any;
  environment_object:any;
  deployedList:any = [];
  deployments:any =[];
  time: any =[];
  errstatus:number;
  commitDetails:any = [];
  id:any=[];
  buildurl:any=[];
  time_date:any=[];
  time_time:any=[];
  deployment_id:any=[];
  length:any;
  status_val:number;
  relativeUrl:string='/jazz/deployments';
  status: any =[];
  buildNo:any =[];
  backupLogs:any=[];
  env: any;
  sort:any;
  filter:any;
  failed:boolean=false;
  success:boolean=false;
  errorTime:any;
	errorURL:any;
	errorAPI:any;
  errorRequest:any={};
  rebuild_id:any;
  isRebuildReq:Boolean = false;
  pageSelected:Boolean = true;
  errorMessage: string = "Something went wrong while fetching your data";

	errorResponse:any={};
	errorUser:any;
	errorChecked:boolean=true;
	errorInclude:any="";
	json:any={};
  constructor(
    private request:RequestService,
    private route: ActivatedRoute,
		private router: Router,
    private cache: DataCacheService,
    private messageservice: MessageService,
    private toasterService: ToasterService,
    private authenticationservice: AuthenticationService ,
  ) {
      this.http = request;
      this.toastmessage = messageservice;
  }

  refresh() {
    if (this.isLoading) return;
    this.ngOnChanges();
  }

  move_right:boolean=false;
  move_left:boolean = false;
  show_icon:boolean = true;
  hide_both:boolean = false;
  stageObj:any = [
    {
      stageNum: 'STAGE 1:',
      stage:'Pre-Build Validation',
      progress:'100%',
      status:'Complete'
    },
    {
      stageNum: 'STAGE 2:',
      stage:'Deployment to Dev Env',
      progress:'80%',
      status:'1min 33s' 
    },
    {
      stageNum: 'STAGE 3:',
      stage:'Deployment to Dev Env',
      progress:'10%',
      status:'2min 03s'
    },
  //   },
    {
      stageNum: 'STAGE 4:',
      stage:'Deployment to Dev Env',
      progress:'22%',
      status:'5min 41s'
    },  
    {
    stageNum: 'STAGE 5:',
    stage:'Deployment to Dev Env',
    progress:'22%',
    status:'5min 41s'
    }
  ];

  tableHeader2 = [
    {
      label: 'Build ID',
      key: 'buildNo',
      sort: true,
      filter: {
				type: 'dateRange'
			}     
    },
    {
      label: 'Commit Details',
      key: 'commitDetails',
      sort: true ,
      filter: {
				type: 'dateRange'
			}    
    },
    
    {
      label: 'Time',
      key: 'time',
      sort: true  ,
      filter: {
				type: 'dateRange'
			}        
    },
    {
      label: 'Status',
      key: 'status',
      sort: true  ,
      filter: {
				type: 'dateRange'
			}        
    }
    // ,
    // {
    //   label:"",
    //   key:"",
    //   sort: false ,
    //   filter: {
		// 		type: 'dateRange'
		// 	}    

    // }
    
  ];

  move(dir)
  {
    if(dir=='right')
    {
      this.move_right=true;
      this.move_left=false;
      this.show_icon=false;
    }
    else
      {
        
      this.move_right=false;
      this.move_left=true;
      this.show_icon=true;
      }
  }
  getenv(obj){
    this.environment_object=obj;
  }

  idClicked(id){
    window.open(this.service.repository+'/commits/'+id)
  }

  widgetExpand()
  {
    if(this.rot_icon == true) 
    {
      this.rot_icon = false;
      this.hide_both = true;
      $("#slide-cover").slideUp();

    }
    else{
      this.rot_icon = true;
      $("#slide-cover").slideDown();
      setTimeout(() => {
        this.hide_both = false;
      }, 400);
      
    } 
   
  }

 


  onRowClicked()
  {
  }

  onFilter(column){

		for (var i = 0; i < this.tableHeader2.length; i++) {
			var col = this.tableHeader2[i]
			if (col.filter != undefined && col.filter['_value'] != undefined) {
				if (col.filter['type'] == 'dateRange') {
					// code...
				} else{
					this.deployments  = this.filter.filterFunction(col.key , col.filter['_value'], this.deployments);
				}
			}
		}
	};

  onSort(sortData){
        var col = sortData.key;
        var reverse = false;
        if (sortData.reverse == true) {
          reverse = true;
        }
    
        this.deployments = this.sort.sortByColumn(col , reverse , function(x:any){return x;}, this.deployments);
      };

        onFilterSelected(filters){
          
              var filter ;
              if (filters[0]) {
                filter = filters[0];
              }
              this.filterloglevel=filter;
              this.offsetValue = 0;
              this.callServiceEnvdeployment();
              
            }
          

  callServiceEnvdeployment() {
    this.loadingState = 'loading';
    this.isLoading = true;
    if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
    this.addQueryParam('domain=', this.service.domain, false);
    this.addQueryParam('service=', this.service.name, false);
    this.addQueryParam('environment=', this.env, false);

    this.subscription = this.http.get(this.relativeUrl, null, this.service.id).subscribe(
      (response) => {

        if((response.data == undefined) || (response.data.length == 0) || (response.data.deployments.length == 0 ) ){
          this.envResponseEmpty = true;
          this.isLoading = false;
					}else{


          var pageCount = response.data.count;
          
          if(pageCount){
            this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
            if(this.totalPagesTable === 1){
              this.pageSelected = false;
            }
            else {
              this.pageSelected = true;
            }
          }
          else{
            this.totalPagesTable = 0;
          }

          this.envResponseEmpty = false;
          this.isLoading = false;
          this.envResponseTrue = true;
          this.deployments =  response.data.deployments;
          this.deployedList =  this.deployments;
          this.length =  this.deployments.length;
          var countStarted = 0;
          for (var i = 0; i < this.length; i++) {
            let dateStr = `${this.deployments[i].created_time.replace("T", " ")}z`;
            this.time[i] = new Date(dateStr).toString();
            this.status[i] = this.deployments[i].status;
            this.commitDetails[i] = this.deployments[i].scm_commit_hash;
            this.id[i] = this.deployments[i].deployment_id;
            this.rebuild_id = this.id[0];
            this.buildNo[i] = this.deployments[i].provider_build_id;
            this.buildurl[i] = this.deployments[i].provider_build_url;
            this.deployment_id[i] = this.deployments[i].deployment_id;
            this.backupLogs = this.deployments;
            this.sort = new Sort(this.deployments);
            if(this.deployments[i].status == "started"){
              countStarted = countStarted + 1;
            }
           }

           if (this.isRebuildReq && countStarted === 0) {
            this.disableBuild = true;
            this.isRebuildReq =false;
           } else {
            this.disableBuild = countStarted ? true : false;
           }

           if(this.deployments.length !=0){
            var pageCount = response.data.count;
            if(pageCount){
              this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
            }
            else{
              this.totalPagesTable = 0;
            }
            this.backupLogs = this.deployments;
          }
          }
         },
        (error) => {
          
          this.errstatus=error.status;
    
          this.envResponseTrue = false;
          this.envResponseEmpty = false;
					this.isLoading = false;
          this.envResponseError = true;
          var payload ={
            "service" : this.service.name,
            "domain" : this.service.domain,
            "environment" : this.env
          }
          this.getTime();
          this.errorURL = window.location.href;
          this.errorAPI = environment.baseurl+"/jazz/deployments";
          this.errorRequest = payload;
          this.errorUser = this.authenticationservice.getUserId();
          this.errorResponse = JSON.parse(error._body);
          this.errorMessage = this.toastmessage.errorMessage(error, "getDeploymentsResponse");

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
    // isLoading:boolean=false;
    sjson:any={};
		djson:any={};
		// isLoading:boolean=false;
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
						"project_id": env_internal.urls.internal_acronym,
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
    

      openBuildUrl(url){
          window.open(url, '_blank');
      }

  ngOnInit() {    
  }

  paginatePage(currentlyActivePage){
    if(this.prevActivePage != currentlyActivePage){
      this.prevActivePage = currentlyActivePage;
      this.deployments = [];
     


      var queryParamKey = 'offset=';
      
      var offsetValue = (this.limitValue * (currentlyActivePage-1));


      var queryParamValue = offsetValue;
      this.addQueryParam(queryParamKey, queryParamValue, true );
      /*
      * Required:- we need the total number of records from the api, which will be equal to totalPagesTable.
      * We should be able to pass start number, size/number of records on each page to the api, where,
      * start = (size * currentlyActivePage) + 1
      */
    }
    else{
    }
	}
	addQueryParam(queryParamKey, queryParamValue, makeCall){
   

    if( this.relativeUrl.indexOf('?') == -1 ){
        this.relativeUrl += '?';
      }

      if( this.relativeUrl.indexOf(queryParamKey ) == -1 && queryParamValue.toString() != '' && queryParamValue.toString().length > 0  ){
        this.relativeUrl += queryParamKey + queryParamValue + '&';
        // this.serviceCall();
      }
      else{

        var array = this.formKeyValuePairFrmUrl();
        var arrayWithNewValues = this.replaceIfKeyExists(array, queryParamKey, queryParamValue);
        var newrelateUrl = this.formStringFrmObj(arrayWithNewValues);
        this.relativeUrl = this.relativeUrl.split("?")[0] + "?" + newrelateUrl;

      }

      if(makeCall){
        this.callServiceEnvdeployment();
      }
	}
	formStringFrmObj(array){
    var string= "";
    array.forEach(function(param) {
      if(param.value != undefined && param.value.toString() != ""){
        string = string + param.key + "=" + param.value + "&"
      }
    });
    return string;
  }
	replaceIfKeyExists(array, newkey, newvalue){
    array.forEach(function(param) {
      if((param.key + "=") == newkey){
        param.value = newvalue;
      }
		});
		return array;
  }
		
	formKeyValuePairFrmUrl(){
    var queryParameters = this.relativeUrl.split("?")[1];
    var eachParam = queryParameters.split("&");
    var array = [];

    eachParam.forEach(function(param) {
      var key = param.split("=")[0];
      var val = param.split("=")[1];
      if(key != ""){ // to add key only if has value
        array.push({"key":key, "value":val});
      }
      if(val == undefined || val.toString() == ""){
        var index = array.indexOf(param);
        if(index > -1){
          array.splice(array.indexOf(param),1); // to remove the key if value is empty
        }
      }
    });
    return array;
  }
  currentlyActive:number=1;
  totalPageNum: number = 12;

	paginatePageInTable(clickedPage){
		switch(clickedPage){
		 case 'prev':
		   if(this.currentlyActive > 1)
			 this.currentlyActive = this.currentlyActive - 1;
		   break;
		 case 'next':
		   if(this.currentlyActive < this.totalPageNum)
			 this.currentlyActive = this.currentlyActive + 1;
		   break;
		 case '1':
		   this.currentlyActive = 1;
		   break;
		 default:
		   if(clickedPage > 1){
			 this.currentlyActive = clickedPage;
		   }
		}
		// paginatePage()
		this.paginatePage(this.currentlyActive);
 }

  ngOnChanges(changes?:any) {
    this.envObj = this.cache.get('currentEnv');
    this.status_val = parseInt(status[this.envObj.status]); 

    if(this.envObj != undefined && this.status_val > 2){
      this.disableRetry=true;
    }

    this.route.params.subscribe(
      params => {
			this.env = params.env;
			if(this.env == "prd"){
				this.env = "prod";
      }
    });
    var queryParamKey = 'limit=';

    this.addQueryParam('limit=', this.limitValue, false);

    this.callServiceEnvdeployment();
    this.sort = new Sort(this.deployments);
    this.loadingState = 'default';
}

refreshCostData(event){ 
  this.envResponseError = false;
  this.isLoading = true;

  this.callServiceEnvdeployment();
}
public goToAbout(hash){
	this.router.navigateByUrl('landing');
	this.cache.set('scroll_flag',true);
	this.cache.set('scroll_id',hash);
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

rebuild(){
  this.rowclick = false;
  this.disableBuild = true;
  this.isRebuildReq = true;
  var rebuild_url = '/jazz/deployments/';
  this.http.post(rebuild_url+this.rebuild_id+'/re-build',{},this.service.id).subscribe(
    (response) => {
      let successMessage = this.toastmessage.successMessage(response, "retryDeploy");
      this.toast_pop('success',"",successMessage+this.service.name);      
    },
    (error) => {
      this.errorMessage = this.toastmessage.errorMessage(error, "retryDeploy");
      this.toast_pop('error', 'Oops!', this.errorMessage);
      this.disableBuild = false;
    })
    this.isLoading = true;
    this.callServiceEnvdeployment();
}


}
export enum status {
  "deployment_completed"=0,
  "active",
  "deployment_started" ,
  "deployment_failed",
  "pending_approval",
  "deletion_failed",
  "inactive",
  "deletion_started", 
  "archived"
}
