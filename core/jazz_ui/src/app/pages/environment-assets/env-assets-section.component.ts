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
import { UtilsService } from '../../core/services/utils.service';
import { RenameFieldService } from '../../core/services/rename-field.service';
declare let Promise;


@Component({
  selector: 'env-assets-section',
	templateUrl: './env-assets-section.component.html',
	providers: [RequestService, MessageService, RenameFieldService],
  styleUrls: ['./env-assets-section.component.scss']
})
export class EnvAssetsSectionComponent {

	state: string = 'default';
  showPaginationtable: boolean = false;
  currentlyActive: number = 1;
	offsetval:number = 0;
	public assetList:any = [];
	private env:any;
	private http:any;
	private subscription:any;
	public serviceType;
	public assetType:any;
	componentFactoryResolver:ComponentFactoryResolver;
	type: any = [];
	length: any;
	serviceName: any = [];
	domain: any = [];
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
	relativeUrl:string = '/jazz/assets';
	payload:any = {}
	errMessage: string = "Something went wrong while fetching your data"

	@Input() service: any = {};
	assetListbyType;
  currentType;
  public cardsScroller;
  public cardsOversized;
  public cardSize = 135 + 12;
  public cardOffset = 0;
  selectedCard = 0;
  sortkey = 'last_updated';
  direction = -1;
  @ViewChild('carouselCards') carouselCards;
  @ViewChild('cardsScroller') set _cardsScroller(input) {
    this.cardsScroller = input;
    if (this.cardsScroller) {
      setTimeout(() => {
        this.cardsOversized = this.cardsScroller.nativeElement.scrollWidth >
          this.carouselCards.nativeElement.getBoundingClientRect().width;
      });
    }
  };

  tableHeader = [
		{
			label: 'Provider ID',
			key: 'provider_id',
			sort: true
		},
		{
			label: 'Last Updated',
			key: 'last_updated',
			sort: true
		}
	];

  constructor(
		private request:RequestService,
		private messageservice: MessageService,
		private route: ActivatedRoute,
		private router: Router,
		private cache: DataCacheService,
		private authenticationservice: AuthenticationService,
		private utilsService: UtilsService,
		private renameFieldService: RenameFieldService,
		@Inject(ComponentFactoryResolver) componentFactoryResolver,private advancedFilters: AdvancedFilterService ,

  ) {
		this.http = request;
		this.toastmessage = messageservice;
		this.componentFactoryResolver = componentFactoryResolver;
   }

  refresh() {
    this.envResponseEmpty = false;
    this.envResponseError = false;
    this.envResponseTrue = false;
		this.callServiceEnvAssets();
	}

	offsetLeft() {
		if (this.cardsScroller.nativeElement.getBoundingClientRect().right > this.carouselCards.nativeElement.getBoundingClientRect().right) {
		this.cardOffset -= 1;
		}
	}

	offsetRight() {
		if (this.cardOffset < 0) {
		this.cardOffset += 1;
		}
	}

	callServiceEnvAssets() {
		this.isLoading = true;
    if ( this.subscription ) {
      this.subscription.unsubscribe();
		}
		this.payload['service'] = this.service.name;
		this.payload['domain'] = this.service.domain;
		this.payload['environment'] = this.env;
		this.payload['offset'] = this.offsetval;
    this.subscription = this.http.get(this.relativeUrl, this.payload, this.service.id).subscribe(
      (response) => {
		var res = response.data.assets;
        if((res == undefined) || (res.length == 0)){
          this.envResponseEmpty = true;
          this.isLoading = false;
        }
        else
        {
        this.envResponseEmpty = false;
        this.isLoading = false;

        this.envResponseTrue = true;
        this.length = response.data.assets.length;
        for(var i=0; i < this.length ; i++){
			this.type[i] = {
				'key': res[i].asset_type,
				'assetTypeDisplayName': this.renameFieldService.getDisplayNameOfKey(res[i].asset_type) || res[i].asset_type
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
			res[i]['last_updated'] = this.commitDiff[i];
			res[i]['last_update_count'] = this.count[i];
          	}
		  	this.type = _.uniqBy(this.type, 'key');
			this.assetListbyType = this.utilsService.groupByKey(res, 'asset_type');
			this.currentType = this.type[0];

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

	ngOnChanges(x:any) {
		this.route.params.subscribe(
		params => {
				this.env = params.env;
				if(this.env == "prd"){
					this.env = "prod";
				}
		});
		this.callServiceEnvAssets();
	}

	refreshCostData(event){
	this.callServiceEnvAssets();
	}
	public goToAbout(hash){
		this.router.navigateByUrl('landing');
		this.cache.set('scroll_flag',true);
		this.cache.set('scroll_id',hash);
	}

	sortTablebyKey(event) {
		this.sortkey = event.key;
		this.direction = event.reverse ? 1 : -1;
	}
}
