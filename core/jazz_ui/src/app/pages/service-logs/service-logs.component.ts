import { Component, OnInit, ComponentFactoryResolver, ReflectiveInjector, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { ToasterService } from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';
import { FilterTagsComponent } from '../../secondary-components/filter-tags/filter-tags.component';
import { AfterViewInit } from '@angular/core';
import { AuthenticationService } from '../../core/services/index';
import { DataCacheService } from '../../core/services/index';
import { AdvancedFiltersComponent } from './../../secondary-components/advanced-filters/internal/advanced-filters.component';
import { AdvancedFilterService } from './../../advanced-filter.service';
import { AdvFilters } from './../../adv-filter.directive';
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';





@Component({
  selector: 'service-logs',
  templateUrl: './service-logs.component.html',
  styleUrls: ['./service-logs.component.scss']
})
export class ServiceLogsComponent implements OnInit {

	
	constructor(@Inject(ElementRef) elementRef: ElementRef, @Inject(ComponentFactoryResolver) componentFactoryResolver,private advancedFilters: AdvancedFilterService ,private cache: DataCacheService, private authenticationservice: AuthenticationService , private request: RequestService,private toasterService: ToasterService,private messageservice: MessageService) {
		var el:HTMLElement = elementRef.nativeElement;
		this.root = el;
		this.toasterService = toasterService;
		this.http = request;
		this.toastmessage= messageservice;
		this.componentFactoryResolver = componentFactoryResolver;
		var comp = this;
		setTimeout(function(){
			comp.getFilter(advancedFilters);
			this.filter_loaded = true;
			document.getElementById('hidethis').classList.add('hide')
		},10);
		
		
	}
	filter_loaded:boolean = false;
	@Input() service: any = {};
	@ViewChild('filtertags') FilterTags: FilterTagsComponent;
	@ViewChild(AdvFilters) advFilters: AdvFilters;
	componentFactoryResolver:ComponentFactoryResolver;
  
	advanced_filter_input:any = {
		time_range:{
			show:true,
		},
		slider:{
			show:true,
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
			show:true,
		},
		method:{
			show:false,
		},
		account:{
			show:false,
		},
		region:{
			show:false,
		}
	}
	fromlogs:boolean = true;
	payload:any={};
	private http:any;
	root: any;
	errBody: any;
	parsedErrBody: any;
	errMessage: any;
	private toastmessage:any;
	loadingState:string='default';
	 private subscription:any;
	 filterloglevel:string = 'ERROR';
	 environment:string = 'prod';
	 pageSelected:number =1;
	 expandText:string='Expand all';
	 ReqId=[];
	 errorTime:any;
	 errorURL:any;
	 errorAPI:any;
	 errorRequest:any={};
	 errorResponse:any={};
	 errorUser:any;
	 errorChecked:boolean=true;
	 errorInclude:any="";
	 json:any={};
	 model:any={
		userFeedback : ''
  };


	tableHeader = [
		{
			label: 'Time',
			key: 'timestamp',
			sort: true,
			filter: {
				type: 'dateRange'
			}
		},{
			label: 'Message',
			key: 'message',
			sort: true,
			filter: {
				type: 'input'
			}
		},{
			label: 'Request ID',
			key: 'request_id',
			sort: true,
			filter: {
				type: ''
			}
		},{
			label: 'Log Level',
			key: 'type',
			sort: true,
			filter: {
				type: 'dropdown',
				data: ['ERROR', 'WARN',  'INFO', 'DEBUG','VERBOSE']
			}
		}
	]

	logs = [];
	backupLogs=[];



	filtersList = [ 'ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'];
	selected=[ 'ERROR'];

	slider:any;
	sliderFrom = 1;
	sliderPercentFrom;
	sliderMax:number = 7;
	rangeList: Array<string> = ['Day', 'Week', 'Month', 'Year'];
	selectedTimeRange:string= this.rangeList[0];
	

	filterSelected: Boolean = false;
	searchActive: Boolean = false;
	searchbar: string = '';
	filter:any;
	sort:any;
	paginationSelected: Boolean = true;
	totalPagesTable: number = 7;
	prevActivePage: number = 1;
	limitValue : number = 20;
	offsetValue:number = 0;

	envList = ['prod','stg'];
	
	accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	  accSelected:string = this.accList[0];
	regSelected:string=this.regList[0];
  
    instance_yes;
	getFilter(filterServ){
		
		this.service['islogs']=false;
		this.service['isServicelogs']=true;
		this.service['ismetrics']=false;

		let filtertypeObj = filterServ.addDynamicComponent({"service" : this.service, "advanced_filter_input" : this.advanced_filter_input});
		let componentFactory = this.componentFactoryResolver.resolveComponentFactory(filtertypeObj.component);
		var comp = this;
		
		let viewContainerRef = this.advFilters.viewContainerRef;
		viewContainerRef.clear();
		let componentRef = viewContainerRef.createComponent(componentFactory);
		this.instance_yes=(<AdvancedFiltersComponent>componentRef.instance);
		(<AdvancedFiltersComponent>componentRef.instance).data = {"service" : this.service, "advanced_filter_input" : this.advanced_filter_input};
		(<AdvancedFiltersComponent>componentRef.instance).onFilterSelect.subscribe(event => {
		
			comp.onFilterSelect(event);
		});

	}

	refresh(){
		this.callLogsFunc();
	}

   onaccSelected(event){
    this.FilterTags.notify('filter-Account',event);
    this.accSelected=event;

   }
	onregSelected(event){
    this.FilterTags.notify('filter-Region',event);
    this.regSelected=event;
   }
 
	// onEnvSelected(env){

	onEnvSelected(envt){
		this.FilterTags.notify('filter-Env',envt);

		// this.logsSearch.environment = env;
		if(env === 'prod'){
			env='prod'
		}
		var env_list=this.cache.get('envList');
		var fName = env_list.friendly_name;
		var index = fName.indexOf(envt);
		var env = env_list.env[index];
		this.environment = envt;
		this.payload.environment=env;
		this.resetPayload();
	}

	onFilterSelect(event){
		switch(event.key){
		  case 'slider':{
			this.getRange(event.value);
			break;
		  }
		  
		  case 'range':{
			this.sendDefaults(event.value);
			this.FilterTags.notifyLogs('filter-TimeRange',event.value);		
			this.sliderFrom =1;
			this.FilterTags.notifyLogs('filter-TimeRangeSlider',this.sliderFrom);
			
			var resetdate = this.getStartDate(event.value, this.sliderFrom);
			this.selectedTimeRange = event.value;
			this.payload.start_time = resetdate;
			this.resetPayload();
			
			break;
		  }
		  
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
		  case "environment":{
			this.FilterTags.notifyLogs('filter-Environment',event.value);
			this.environment = event.value;
			this.payload.environment = event.value;
			this.resetPayload();
			break;
		  }
	
	   
		}
		
	  }
	getRange(e){
		this.FilterTags.notifyLogs('filter-TimeRangeSlider',e.from);
		
		this.sliderFrom =e.from;
		this.sliderPercentFrom=e.from_percent;
		var resetdate = this.getStartDate(this.selectedTimeRange, this.sliderFrom);
		this.payload.start_time = resetdate;
		this.resetPayload();
	
	}
	resetPayload(){
		this.payload.offset = 0;
		$(".pagination.justify-content-center li:nth-child(2)")[0].click();
		this.callLogsFunc();
	}

	getRangefunc(e){
		this.FilterTags.notifyLogs('filter-TimeRangeSlider',e);
		
		this.sliderFrom =e;
		this.sliderPercentFrom=e;	
		var resetdate = this.getStartDate(this.selectedTimeRange, this.sliderFrom);
		this.payload.start_time = resetdate;
		this.resetPayload();
	}

	cancelFilter(event){
		switch(event){
		  case 'time-range':{this.instance_yes.onRangeListSelected('Day'); 
			break;
		  }
		  case 'time-range-slider':{
			this.instance_yes.resetslider(1);
		  
			break;
		  }
		  case 'period':{ this.instance_yes.onPeriodSelected('15 Minutes');
			break;
		  }
		  case 'statistic':{      this.instance_yes.onStatisticSelected('Average');
		  
			break;
		  }
		  case 'account':{      this.instance_yes.onaccSelected('Acc 1');
		  
			break;
		  }
		  case 'region':{      this.instance_yes.onregSelected('reg 1');
		  
			break;
		  }
		  case 'env':{      this.instance_yes.onEnvSelected('prod');
		  
			break;
		  }
		  case 'method':{      
				
				this.instance_yes.onMethodListSelected('POST');
		  
			break;
		  }
		  case 'all':{ this.instance_yes.onRangeListSelected('Day');    
				this.instance_yes.onPeriodSelected('15 Minutes');
				this.instance_yes.onStatisticSelected('Average');
				this.instance_yes.onaccSelected('Acc 1');
				this.instance_yes.onregSelected('reg 1');
				this.instance_yes.onEnvSelected('prod');
				this.instance_yes.onMethodListSelected('POST');
				break;
		  	}
		}
	   
		this.getRangefunc(1);
}

	sendDefaults(range){
		switch(range){
			case 'Day':{     this.FilterTags.notify('filter-Period','15 Minutes')
				break;
			}
			case 'Week':{   this.FilterTags.notify('filter-Period','1 Hour')
				break;
			}
			case 'Month':{ 
			   this.FilterTags.notify('filter-Period','6 Hours')
				break;
			}
			case 'Year':{   this.FilterTags.notify('filter-Period','7 Days')
				break;
			}
		}
	}

	onRangeListSelected(range){
		this.sendDefaults(range);
		this.FilterTags.notifyLogs('filter-TimeRange',range);		
		this.sliderFrom =1;
		this.FilterTags.notifyLogs('filter-TimeRangeSlider',this.sliderFrom);
		
		var resetdate = this.getStartDate(range, this.sliderFrom);
		// this.resetPeriodList(range);
		this.selectedTimeRange = range;
		this.payload.start_time = resetdate;
		this.resetPayload();		
	  }
	  
	navigateTo(event){
		var url = "http://search-cloud-api-es-services-smbsxcvtorusqpcygtvtlmzuzq.us-west-2.es.amazonaws.com/_plugin/kibana/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$$hashKey':'object:705','$state':(store:appState),meta:(alias:!n,disabled:!f,index:applicationlogs,key:domain,negate:!f,value:"+this.service.domain+"),query:(match:(domain:(query:"+this.service.domain+",type:phrase)))),('$$hashKey':'object:100','$state':(store:appState),meta:(alias:!n,disabled:!f,index:applicationlogs,key:servicename,negate:!f,value:"+this.service.domain+"_"+this.service.name+"-prod),query:(match:(servicename:(query:"+this.service.domain+"_"+this.service.name+"-prod,type:phrase))))),index:applicationlogs,interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(timestamp,desc),uiState:(spy:(mode:(fill:!f,name:!n))))"
		window.open(url);
	}


	expandall(){
		for(var i=0;i<this.logs.length;i++){
			var rowData = this.logs[i];
			rowData['expanded'] = true;			
		}
		this.expandText='Collapse all';
		
	}

	collapseall(){
		for(var i=0;i<this.logs.length;i++){
			var rowData = this.logs[i];
			rowData['expanded'] = false;			
		}
		this.expandText='Expand all';
	}

	onRowClicked(row, index) {
		var rowData = this.logs[index];
		if (rowData) {
			rowData['expanded'] = !rowData['expanded'];
			this.expandText = 'Collapse all';
			for (var i = 0; i < this.logs.length; i++) {
				var rowData = this.logs[i];
				if (rowData['expanded'] == false) {
					this.expandText = 'Expand all';
					break;
				}
			}
		}
	}

	getStartDate(filter, sliderFrom){
    var todayDate = new Date();
    switch(filter){
      case "Day":
        this.sliderMax = 7;
        var resetdate = new Date(todayDate.setDate(todayDate.getDate()-sliderFrom)).toISOString();
        break;
      case "Week":
        this.sliderMax = 5;
        var  resetdate = new Date(todayDate.setDate(todayDate.getDate()-(sliderFrom*7))).toISOString();
        break;
      case "Month":
        
	  this.sliderMax = 12;
	  var currentMonth = new Date ((todayDate).toISOString()).getMonth();
	  var currentDay = new Date((todayDate).toISOString()).getDate();
	  currentMonth++;
	  var currentYear = new Date ((todayDate).toISOString()).getFullYear();
	  var diffMonth = currentMonth - sliderFrom;
	  if(diffMonth>0){
		var resetYear = currentYear;
		var resetMonth = diffMonth;
	  } else if(diffMonth===0){
		var resetYear = currentYear-1;
		var resetMonth = 12;
	  } else if(diffMonth<0){
		var resetYear = currentYear - 1;
		// var resetMonth = sliderFrom - currentMonth;
		var resetMonth = 12 + diffMonth;
	  }
	  if(currentDay==31)currentDay=30;
	  var newStartDateString = resetYear + "-" + resetMonth + "-" + currentDay + " 00:00:00"
	  var newStartDate = new Date(newStartDateString);
	  var resetdate = newStartDate.toISOString();
	  break;
      case "Year":
        this.sliderMax = 6;
        var currentYear = new Date((todayDate).toISOString()).getFullYear();
        var newStartDateString = (currentYear - 6).toString() + "/" + "1" + "/" + "1";
        var newStartDate = new Date(newStartDateString);
        var resetdate = newStartDate.toISOString();
        break;
    }
    return resetdate;
  }

	onFilter(column){
		//this.logs = this.logsData

		for (var i = 0; i < this.tableHeader.length; i++) {
			var col = this.tableHeader[i]
			if (col.filter != undefined && col.filter['_value'] != undefined) {
				if (col.filter['type'] == 'dateRange') {
					// code...
				} else{
					this.logs  = this.filter.filterFunction(col.key , col.filter['_value'], this.logs);
				}
			}
		}
	};

	onSort(sortData){

    var col = sortData.key;
    var reverse = false;
    if (sortData.reverse == true) {
    	reverse = true
    }

    this.logs = this.sort.sortByColumn(col , reverse , function(x:any){return x;}, this.logs);
	};
	callLogsFunc(){
		this.loadingState = 'loading';		
		 if ( this.subscription ) {
			this.subscription.unsubscribe();
		}
		this.subscription = this.http.post('/jazz/logs', this.payload).subscribe(
      response => {
		
	   this.logs  = response.data.logs || response.data.data.logs ;
	   if(this.logs != undefined)
		if( this.logs.length !=0){
			var pageCount = response.data.count;
			this.totalPagesTable = 0;
			if(pageCount){
			  this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
			}
			else{
			  this.totalPagesTable = 0;
			}
			this.backupLogs = this.logs;
			
			this.sort = new Sort(this.logs);
			this.loadingState = 'default'
		} else{
			this.loadingState = 'empty';
		}
		this.trim_Message();
		

      },
      err => {
		  this.loadingState='error';
		  this.errBody = err._body;
		  
		  this.errMessage=this.toastmessage.errorMessage(err,"serviceLogs");
		  try {
			this.parsedErrBody = JSON.parse(this.errBody);
			if(this.parsedErrBody.message != undefined && this.parsedErrBody.message != '' ) {
			  this.errMessage = this.parsedErrBody.message;
			}
		  } catch(e) {
			  console.log('JSON Parse Error', e);
		  }


       
		this.getTime();
		this.errorURL = window.location.href;
		this.errorAPI = env_internal.baseurl+"/jazz/logs";
		this.errorRequest = this.payload;
		this.errorUser = this.authenticationservice.getUserId();
		try{
			this.errorResponse = JSON.parse(err._body);

		}
		catch(e){
			console.log('error while parsing json',e);
		}

		this.cache.set('feedback',this.model.userFeedback)
		this.cache.set('api',this.errorAPI)
		this.cache.set('request',this.errorRequest)
		this.cache.set('resoponse',this.errorResponse)
		this.cache.set('url',this.errorURL)
		this.cache.set('time',this.errorTime)
		this.cache.set('user',this.errorUser)

	})
  };

  getTime() {
	var now = new Date();
	this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
	+ ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
	}
	refreshData(event){
		this.loadingState = 'default';
		this.resetPayload();
	}

	paginatePage(currentlyActivePage){
		this.expandText='Expand all';
		
    if(this.prevActivePage != currentlyActivePage){
	  this.prevActivePage = currentlyActivePage;
	  this.logs=[];
	  this.offsetValue = (this.limitValue * (currentlyActivePage-1));
	  this.payload.offset=this.offsetValue;
	  this.callLogsFunc();
      //  ** call service
      /*
      * Required:- we need the total number of records from the api, which will be equal to totalPagesTable.
      * We should be able to pass start number, size/number of records on each page to the api, where,
      * start = (size * currentlyActivePage) + 1
      */
    }
    else{
    }

  }
  
 	onFilterSelected(filters){
	
		this.loadingState = 'loading';
		var filter ;
		if (filters[0]) {
			filter = filters[0];
		}
		this.filterloglevel=filter;
		this.payload.type=this.filterloglevel;		
		this.resetPayload();
		
		

	}
	

	trim_Message(){
		
		if(this.logs!=undefined)
		for(var i=0;i<this.logs.length;i++){
			var reg=new RegExp(this.logs[i].timestamp,"g");
			this.logs[i].message=this.logs[i].message.replace(reg,'');
			this.logs[i].request_id=this.logs[i].request_id.substring(0,this.logs[i].request_id.length-1);
			this.logs[i].message=this.logs[i].message.replace(this.logs[i].request_id,'')

			
		}

	}

	fetchEnvlist(){
		var env_list=this.cache.get('envList');
		if(env_list != undefined){
		  this.envList=env_list.friendly_name;
		}
	
	  }
	  ngOnChanges(x:any){
		  this.fetchEnvlist();
	  }
	ngOnInit() {
		
		var todayDate = new Date();
		this.payload= {
			"service" :  this.service.name ,//"logs", //
		   "domain" :   this.service.domain ,//"jazz", //
		   "environment" :  this.environment, //"dev"
		   "category" :   this.service.serviceType ,//"api",//
		   "size" : this.limitValue,
		   "offset" : this.offsetValue,
		   "type":this.filterloglevel ||"ERROR",
		   "end_time": (new Date().toISOString()).toString(),
		   "start_time":new Date(todayDate.setDate(todayDate.getDate()-this.sliderFrom)).toISOString()
	   }				
		this.callLogsFunc();
	}

	
	

}
