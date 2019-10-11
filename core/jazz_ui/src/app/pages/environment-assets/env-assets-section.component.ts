import { Component, OnInit, ComponentFactoryResolver, ReflectiveInjector, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';
import { RequestService, MessageService } from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import { HttpModule } from '@angular/http';
import { DataCacheService , AuthenticationService } from '../../core/services/index';
import { FilterTagsComponent } from '../../secondary-components/filter-tags/filter-tags.component';
import { AdvancedFiltersComponent } from './../../secondary-components/advanced-filters/internal/advanced-filters.component';
import { AdvancedFilterService } from './../../advanced-filter.service';
import { AdvFilters } from './../../adv-filter.directive';
import { environment } from './../../../environments/environment.internal';
import { environment as env_internal } from './../../../environments/environment.internal';
import { environment as env_oss} from './../../../environments/environment.oss';
import * as moment from 'moment';
import * as _ from 'lodash';
declare let Promise;


@Component({
  selector: 'env-assets-section',
	templateUrl: './env-assets-section.component.html',
	providers: [RequestService, MessageService],
  styleUrls: ['./env-assets-section.component.scss']
})
export class EnvAssetsSectionComponent implements OnInit {

	state: string = 'default';
  showPaginationtable: boolean = false;
  currentlyActive: number = 1;
	totalPageNum: number = 12;
	offset:number = 0;
	offsetval:number = 0;
	public assetList:any = [];
	private env:any;
	private http:any;
	private subscription:any;
	public serviceType;
	public assetWithDefaultValue:any=[];
  public environmentFilter;
	@ViewChild('filtertags') FilterTags: FilterTagsComponent;
  @ViewChild('filters') filters;
	@ViewChild(AdvFilters) advFilters: AdvFilters;
	public assetType:any;
	componentFactoryResolver:ComponentFactoryResolver;
	filterSelected: boolean = false;
	fromassets:boolean = true;
  public assetFilter: any;
	advanced_filter_input:any = {
		time_range:{
			show:false,
		},
		slider:{
			show:false,
		},
		period:{
			show:false,
		},
		statistics:{
			show:false,
		},
		path:{
			show:false,
		},
		environment:{
			show:false,
		},
		method:{
			show:false,
		},
		account:{
			show:true,
		},
		region:{
			show:true,
		},
		asset:{
			show:true,
		}
	}

	assetsList: any = [];
	public formFields: any = [];

	accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	accSelected:string = this.accList[0];
	regSelected:string=this.regList[0];
	type: any = [];
  public asset_type:any=[]
	length: any;
	// image: any = [];
	slNumber: any = [];
	serviceName: any = [];
	domain: any = [];
	arn: any = [];
	Provider: any = [];
	status: any = [];
	time: any = [];
	url : any = [];
	endpoint : any = [];
	envResponseEmpty:boolean = false;
  envResponseTrue:boolean = false;
  envResponseError:boolean = false;
	isLoading: boolean = true;
	errorTime:any;
	errorURL:any;
	errorAPI:any;
	errorRequest:any={};
	errorResponse:any={};
	errorUser:any;
	errorChecked:boolean=true;
	errorInclude:any="";
	json:any={};
	toastmessage:any;
	dayscommit: boolean = false;
	hourscommit: boolean = false;
	seccommit: boolean = false;
	mincommit: boolean = false;
	commitDiff: any=[];
	lastCommitted: any;
	islink:boolean = false;
	count: any = [];
	public assetSelected:any;
	relativeUrl:string = '/jazz/assets';
	payload:any = {}
	errMessage: string = "Something went wrong while fetching your data"

	@Input() service: any = {};

  constructor(
		private request:RequestService,
		private messageservice: MessageService,
		private route: ActivatedRoute,
		private router: Router,
		private cache: DataCacheService,
		private authenticationservice: AuthenticationService ,
		@Inject(ComponentFactoryResolver) componentFactoryResolver,private advancedFilters: AdvancedFilterService ,

  ) {
		this.http = request;
		this.toastmessage = messageservice;
		this.componentFactoryResolver = componentFactoryResolver;
		var comp = this;
		setTimeout(function(){
			comp.getFilter(advancedFilters);
		},5000);
   }

  refresh() {
    this.envResponseEmpty = false;
    this.envResponseError = false;
    this.envResponseTrue = false;
		this.callServiceEnvAssets();
	}

ngOnInit()
{
	this.serviceType = this.service.type || this.service.serviceType;
  this.getAssetType();
}
	 getFilter(filterServ){

	}

   onaccSelected(event){
    this.FilterTags.notify('filter-Account',event);
    this.accSelected=event;

   }
	onregSelected(event){
    this.FilterTags.notify('filter-Region',event);
    this.regSelected=event;
	 }

	applyFilter(value){
		this.isLoading = true;
		this.assetSelected=value.selected.replace(/ /g,"_");
		this.getAssetType(value);
	 }
	getAssetType(data?){
		let self=this;
    return self.http.get('/jazz/assets',{
      domain: self.service.domain,
			service:self.service.name,
			environment:self.env
    },self.service.id).toPromise().then((response:any)=>{
      if(response&&response.data&&response.data.assets){
				let assets=_(response.data.assets).map('asset_type').uniq().value();
				self.assetWithDefaultValue=assets;
				self.assetWithDefaultValue.splice(0,0,'all');
        for(var i=0;i<self.assetWithDefaultValue.length;i++){
        self.assetList[i]=self.assetWithDefaultValue[i].replace(/_/g, " ");
        }
        self.assetFilter={
            column: 'Filter By:',
            label: 'ASSET TYPE',
            options: self.assetList,
            values: assets,
            selected:assets[0].replace(/_/g," ")
				};
				if(!data){
					self.assetSelected=assets[0];
				}
       let assetField = self.filters.getFieldValueOfLabel('ASSET TYPE');
        if (!assetField) {
					self.formFields.splice(0, 0, self.assetFilter);
					self.filters.setFields(self.formFields);
				}
			self.callServiceEnvAssets();
    }
    })
    .catch((error) => {
      return Promise.reject(error);
    })
  }
   onFilterSelect(event){
	 switch(event.key){
	  case 'account':{
		this.FilterTags.notify('filter-Account',event.value);
		this.accSelected=event.value;
		break;
	  }
	  case 'region':{
		this.FilterTags.notify('filter-Region',event.value);
		this.regSelected=event.value;
		break;

	  }


	}

}

   cancelFilter(event){

	}
	callServiceEnvAssets() {
		this.isLoading = true;
    if ( this.subscription ) {
      this.subscription.unsubscribe();
		}
		this.payload['service'] = this.service.name;
		this.payload['domain'] = this.service.domain;
		this.payload['environment'] = this.env;
		this.payload['limit'] = this.limitValue;
		this.payload['offset'] = this.offsetval;
		if (this.assetSelected !== 'all') {
			this.payload['asset_type'] = this.assetSelected;
		}	else {
			delete this.payload['asset_type'];
		}

    this.subscription = this.http.get(this.relativeUrl, this.payload, this.service.id).subscribe(
      (response) => {

        if((response.data == undefined) || (response.data.count == 0)){
          this.envResponseEmpty = true;
          this.isLoading = false;
        }
        else
        {
          var pageCount = response.data.count;

        if(pageCount){
					this.totalPageNum = Math.ceil(pageCount/this.limitValue);
					if(this.totalPageNum === 1){
						this.showPaginationtable = false;
					}
					else {
						this.showPaginationtable = true;
					}
        }
        else{
          this.totalPageNum = 0;
        }
        this.envResponseEmpty = false;
        this.isLoading = false;

        this.envResponseTrue = true;
        this.length = response.data.assets.length;
				this.assetsList = response.data.assets;
        for(var i=0; i < this.length ; i++){
          this.type[i] = response.data.assets[i].asset_type;
          this.slNumber[i] = this.offsetval + (i+1);
          if( response.data.assets[i].provider == undefined ){
            this.Provider[i] = "-"
          }else{
          this.Provider[i] = response.data.assets[i].provider;
          }
          if( response.data.assets[i].status == undefined ){
            this.status[i] = "-"
          }else{
          this.status[i] = response.data.assets[i].status;
          }
          if( response.data.assets[i].endpoint_url == undefined ){
            this.endpoint[i] = "-"
          }else{
          this.endpoint[i] = response.data.assets[i].endpoint_url;;
          }
          if( response.data.assets[i].swagger_url == undefined ){
            this.url[i] = "-"
          }else{
          this.url[i] = response.data.assets[i].swagger_url;
          }
          if( response.data.assets[i].provider_id == undefined ){
            this.arn[i] = "-"
          }else{
          this.arn[i] = response.data.assets[i].provider_id;
          }

          this.lastCommitted = response.data.assets[i].timestamp;
          var commit = this.lastCommitted.substring(0,19);
          var lastCommit = new Date(commit);
          var now = new Date();
          var todays = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

          this.count[i] = 3;
          this.commitDiff[i] = Math.floor(Math.abs((todays.getTime() - lastCommit.getTime())/(1000*60*60*24)));
          if( this.commitDiff[i] > 30){
            this.count[i] = 4;
            this.commitDiff[i] = Math.floor(this.commitDiff[i]/30)
          }else
          if( this.commitDiff[i] == 0 ){
            this.count[i] = 2;
            this.commitDiff[i] = Math.floor(Math.abs((todays.getHours() - lastCommit.getHours())));
            if( this.commitDiff[i] == 0 ){
            this.count[i] = 1;
            this.commitDiff[i] = Math.floor(Math.abs((todays.getMinutes() - lastCommit.getMinutes())));
            if( this.commitDiff[i] == 0 ){
              this.count[i] = 0;
              this.commitDiff[i] = "Just now";
            }
            }
          }

          }


        }
      },
      (error) => {
        this.envResponseTrue = false;
        this.envResponseEmpty = false;
        this.isLoading = false;
        this.envResponseError = true;
        this.getTime();
        this.errorURL = window.location.href;
        this.errorAPI = env_internal.baseurl+"jazz/assets/search";
        this.errorRequest = this.payload;
        this.errorUser = this.authenticationservice.getUserId();
        this.errorResponse = JSON.parse(error._body);
        this.errMessage = this.toastmessage.errorMessage(error, "getAssetResponse");

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
		// isLoading:boolean=false;
		reportIssue(){
			if(environment.envName !='oss'){
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
				}}

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

     redirect(url){
		 window.open(url , '_blank');
	 }


	limitValue : number = 10;
	prevActivePage: number = 0;


	paginatePage(currentlyActivePage){
    if(this.prevActivePage != currentlyActivePage){
      this.prevActivePage = currentlyActivePage;
      this.assetsList = [];


			this.offsetval = (this.limitValue * (currentlyActivePage-1));

			this.callServiceEnvAssets();

    }
    else{
    }
	}


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

	ngOnChanges(x:any) {
    this.route.params.subscribe(
      params => {
			this.env = params.env;
			if(this.env == "prd"){
				this.env = "prod";
			}
    });
}

  refreshCostData(event){
    this.callServiceEnvAssets();
  }
  public goToAbout(hash){
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag',true);
    this.cache.set('scroll_id',hash);
  }

  public assetTypeToLabel(type, provider) {
	  if(type === 'swagger_url' || type === 'endpoint_url'){
      return 'URL';
    }
    else if(provider === 'aws'){
      return 'ARN';
    }
    else if(provider === 'azure') {
      return 'Resource';
    }

    switch(type) {
      case 'swagger_url':
      case 'endpoint_url':
        return 'URL';
      default:
        return 'Provider ID';
    }
	}
}
