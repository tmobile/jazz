import { Component, OnInit, ComponentFactoryResolver, ReflectiveInjector, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';
import { DayData, WeekData, MonthData, Month6Data, YearData } from './data';
import { AfterViewInit } from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { RequestService, MessageService , AuthenticationService } from '../../core/services/index';
import { DataCacheService } from '../../core/services/index';
import { Router, ActivatedRoute } from '@angular/router';
import { IonRangeSliderModule } from "ng2-ion-range-slider"
import { FilterTagsComponent } from '../../secondary-components/filter-tags/filter-tags.component';
import { AdvancedFiltersComponent } from './../../secondary-components/advanced-filters/internal/advanced-filters.component';
import { AdvancedFilterService } from './../../advanced-filter.service';
import { AdvFilters } from './../../adv-filter.directive';
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';





@Component({ 
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  providers: [RequestService, MessageService,AdvancedFilterService],
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit {


  @ViewChild('sliderElement') sliderElement: IonRangeSliderModule;
  @ViewChild('filtertags') FilterTags: FilterTagsComponent;
	@ViewChild(AdvFilters) advFilters: AdvFilters;
  componentFactoryResolver:ComponentFactoryResolver;

  

  @Input() service: any = {};
  private subscription:any;
  public min:any;
  public max:any;
  public from:any;
  public step:any;
  
  advanced_filter_input:any = {
    time_range:{
        show:true,
    },
    slider:{
        show:true,
    },
    period:{
        show:true,
    },
    statistics:{
        show:true,
    },
    path:{
        show:true,
    },
    environment:{
        show:true,
    },
    method:{
        show:true,
    },
    account:{
        show:true,
    },
    region:{
        show:true,
    }
}

  envList:any=['prod','stg'];
  filtersList: Array<string> = ['7 Days', '4 Weeks', '6 Months', '1 Year'];
  rangeList: Array<string> = ['Day', 'Week', 'Month', 'Year'];
  allPeriodList: Array<any> = [
  {
    min : '15 Minutes',
    sec : "900"
  },{
    min : '1 Hour',
    sec : "3600"
  },{
    min : '6 Hours',
    sec : "21600"
  },{
    min : '1 Day',
    sec : "86400"
  },{
    min : '7 Days',
    sec : "604800"
  },{
    min : '30 Days',
    sec : "2592000"
  }];

  periodList: Array<string> = ['15 Minutes','1 Hour','6 Hours','1 Day','7 Days','30 Days'];
  periodListSeconds: Array<string> = ['900','3600','21600','86400','604800','2592000'];

  graphTypeList: Array<string> = ['Line'];
  envSelected:string = this.envList[0];

  statisticList: Array<string> = ['Average', 'Sum', 'Maximum','Minimum'];
  statisticSelected:string= this.statisticList[0];
  viewBox = "0 0 300 150";
  today = new Date();
  yesterday = this.today.setDate(this.today.getDate()-1);
  payload:any;
  errBody: any;
	parsedErrBody: any;
  errMessage: any;
  safeTransformX=0;
  maxCards:boolean = false;
  minCards:boolean = false;
  envUpdate:boolean = false;
  filtersApplied:any;
  private http:any;
  selectedTimeRange:string= this.rangeList[0];
  serviceMetricsList: Array<any>=[];
  isGraphLoading:boolean=true;
  isDataNotAvailable:boolean=false;
  isError:boolean=false;
  private toastmessage:any;
  root: any;
  pathList:Array<string>=[];
  methodList:Array<string>  = ['POST','GET','DELETE','PUT'];

  pathSelected:string = '';
  methodSelected:string = this.methodList[0];
  metricsList:Array<any>=[{
    metric_name : "",
    xAxis : "",
    yAxis : "",
    data : "",
    metricSum: 0
  }];
  
  
  

  graphs: Array<any>;
  graphsOld: Array<any>;
  graphInput:Array<any>;
  slider:any;
  sliderFrom = 1;
  sliderPercentFrom = 0;
  sliderMax:number = 7;
  service_api:boolean = true;
  metricsIndex:number=0;
  filterSelected:boolean;
	errorTime:any;
	errorURL:any;
	errorAPI:any;
	errorRequest:any={};
	errorResponse:any={};
	errorUser:any;
	errorChecked:boolean=true;
	errorInclude:any="";
	json:any={};


  constructor(@Inject(ElementRef) elementRef: ElementRef, @Inject(ComponentFactoryResolver) componentFactoryResolver,private advancedFilters: AdvancedFilterService , private authenticationservice: AuthenticationService , private cache: DataCacheService,private router:Router, private request: RequestService,private toasterService: ToasterService,private messageservice: MessageService) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = el;
    this.graphs = DayData;
    this.graphsOld = DayData;
    this.toasterService = toasterService;
    this.http = request;
    this.toastmessage= messageservice;
    this.componentFactoryResolver = componentFactoryResolver;
		var comp = this;
		setTimeout(function(){
			comp.getFilter(advancedFilters);
		},10);
		
  }
 
	accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
    accSelected:string= this.accList[0];
  regSelected:string = this.regList[0];
  instance_yes;

   onaccSelected(event){
    this.FilterTags.notify('filter-Account',event);
    this.accSelected=event;

   }
	onregSelected(event){
    this.FilterTags.notify('filter-Region',event);
    this.regSelected=event;
   }
  notifyByEnv(envList){
    if(envList.length>2){
      this.envList=envList;
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
        var newStartDateString = (currentYear - sliderFrom).toString() + "/" + "1" + "/" + "1";
        var newStartDate = new Date(newStartDateString);
        var resetdate = newStartDate.toISOString();
        break;
    }
    return resetdate;
  }
  fetchEnvlist(){
    var env_list=this.cache.get('envList');
    if(env_list != undefined){
      this.envList=env_list.friendly_name;
    }
  }
  onFilterSelect(event){
    switch(event.key){
      case 'slider':{
        this.getRange(event.value);
        break;
      }
      case 'period':{
        this.FilterTags.notify('filter-Period',event.value);
        this.payload.interval = this.periodListSeconds[this.periodList.indexOf(event.value)];
        this.callMetricsFunc();
        break;
      }
      case 'range':{
        this.FilterTags.notify('filter-TimeRange',event.value);
        this.sendDefaults(event.value); 
        this.timerangeSelected=event.value;
        this.sliderFrom =1;
        this.FilterTags.notify('filter-TimeRangeSlider',this.sliderFrom);        
        var resetdate = this.getStartDate(event.value, this.sliderFrom);
        this.resetPeriodList(event.value);
        this.selectedTimeRange = event.value;
        this.payload.start_time = resetdate;
        this.callMetricsFunc();
        break;
      }
      case 'environment':{
        var envt = event.value;
        this.FilterTags.notify('filter-Env',envt);
        this.envSelected = envt;
        this.payload.environment = envt;
        var env_list=this.cache.get('envList');
        var fName = env_list.friendly_name;
        var index = fName.indexOf(envt);
        var env = env_list.env[index];
        this.envSelected = envt;
        this.payload.environment = env;
        this.callMetricsFunc();
        this.envUpdate = true;
        break;
      }
      case 'statistics':{
        var statistics=event.value;
        this.FilterTags.notify('filter-Statistic',statistics);
        this.statisticSelected = statistics;
        this.payload.statistics = statistics;
        this.callMetricsFunc();
        break;

      }
      case 'method':{
        var method=event.value;
        this.FilterTags.notify('filter-Method',method);

        this.methodSelected=method;
        this.displayMetrics();
      }
      case 'path':{
        this.pathSelected=event.value;
        this.displayMetrics();
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

   
    }
    
  }
  ngOnInit() {
    this.cache.set("codequality",false)
    if(this.service.serviceType === 'api'){
      this.service_api = false;
    }

    this.resetPeriodList(this.selectedTimeRange); 
    //  to set periodListValue such that total num of datapoints < 1440 .. http://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricStatistics.html
    this.payload = {
        "service":this.service.name,
        "domain": this.service.domain,
        "environment": this.envList[0],
        "end_time": (new Date().toISOString()).toString(),
        "start_time": this.getStartDate(this.selectedTimeRange, this.sliderFrom),
        "interval": this.periodListSeconds[this.periodList.indexOf(this.periodList[0])],
        "statistics": this.statisticSelected
    };
  
    if(!this.service.serviceType){
      if(this.payload.service == "services"){
        this.service.serviceType = "api"; 
      }
      else if(this.payload.service == "events"){
        this.service.serviceType = "api"; 
      }
      else if(this.payload.service == "service-onboarding"){
        this.service.serviceType = "website"; 
      }
      else if(this.payload.service == "custom-ad-authorizer"){
        this.service.serviceType = "function"; 
      }
    }
    else{
    }
    this.callMetricsFunc();
  }
  filterTags(){
    this.filtersApplied='day';
  }
  ngOnChanges(x:any){
    this.filterTags();
    this.fetchEnvlist();

    this.pathList = ['/'+this.service.domain+'/'+this.service.name];
    this.pathSelected = this.pathList[0];
    }
  popToast(type, title, message) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
      this.toasterService.pop(type, title, message);
      setTimeout(() => {
        tst.classList.remove('toaster-anim');
      }, 7000);
  }
  generateArray= function(obj){
     return Object.keys(obj).map((key)=>{ return  {key:key, value : obj[key]}  });
  }

  processServiceList(serviceMetric){
    if (serviceMetric === undefined || serviceMetric.assets.length === undefined) {
      return [];
    }
    let _serviceMetricList = [];
    var monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug", "Sep", "Oct","Nov","Dec"];
    var selectedTimeRange = this.selectedTimeRange;
    var _this = this;
    var compare = function(a,b) {
      if (a.Timestamp < b.Timestamp)
        return -1;
      if (a.Timestamp > b.Timestamp)
        return 1;
      return 0;
    };

    serviceMetric.assets.forEach(function(eachAsset){
      if( (_this.service.serviceType == "api" && eachAsset.type == "apigateway" )|| ((_this.service.serviceType == "function" || _this.service.serviceType == "lambda") && eachAsset.type == "lambda" ) || (_this.service.serviceType == "website" && eachAsset.type == "cloudfront" ) ){
        var eachAssetMetric = [];
        var stat = eachAsset.statistics;
        var asset_name = eachAsset.asset_name;
        var asset_name_array = _this.generateArray(asset_name);
        _serviceMetricList.push({
          type : eachAsset.type,
          asset_properties : asset_name,
          statistics : eachAsset.statistics,
          metrics : eachAssetMetric,
          oldMetrics : [] 
        });
        eachAsset.metrics.forEach(function(eachMetric){
          var eachMetricDatapoint = [];
          var datapointArray = eachMetric.datapoints.sort(compare);
          eachAssetMetric.push({
            metric_name : eachMetric.metric_name,
            xAxis: { label: 'TIME (UTC)', range: selectedTimeRange.toLowerCase() },
            yAxis: { label: datapointArray.length > 0 ? datapointArray[0].Unit : " "}, // commenting metrics y axis label
            data : eachMetricDatapoint,
          });
          if(datapointArray && datapointArray.length > 0){
            datapointArray.forEach(function(eachDatapoint){
              var modifiedkey = eachDatapoint.Timestamp;

              var eachDate=new Date(modifiedkey);
              var monthIndex=eachDate.getMonth();
              let graphDataDate="";

              let serviceRow = {
                date: eachDate, 
                value: eachDatapoint[stat].toFixed(5),
                unit: eachDatapoint["Unit"]
              };
              eachMetricDatapoint.push(serviceRow);

            }); // end of datapointArray
          }
          else{
           
            eachMetricDatapoint = [];
          }
        }); 
      }       
      else{
       
      }
    }); 
      if(_serviceMetricList.length > 0){
        this.isDataNotAvailable = false;
      }
      else{
        this.isDataNotAvailable = true;
      }
      this.isGraphLoading = false;

    return _serviceMetricList;
  }
 
  refreshCostData(event){
		
		this.callMetricsFunc();
  }
  
  callMetricsFunc(){
    this.isGraphLoading=true;
    this.isDataNotAvailable = false;
    this.isError = false;
    	 if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
		this.subscription = this.http.post('/jazz/metrics', this.payload).subscribe(
      response => {
        
          //Bind to view
        let serviceMetrics = response.data;
        
        if (serviceMetrics !== undefined && serviceMetrics !== "" && serviceMetrics.assets !== undefined && serviceMetrics.assets.length > 0 ) {
            this.serviceMetricsList = this.processServiceList(serviceMetrics);
            if(this.service.serviceType === 'api') {
              this.dropDownSelecters();
            }
            this.displayMetrics();
            if(serviceMetrics === "serviceMetrics !== undefined"){
              
              this.isDataNotAvailable = true;
            }
        } else if(serviceMetrics !== undefined && serviceMetrics === "" || serviceMetrics.assets.length == 0 ){
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          if(serviceMetrics === ""){
            let errorMessage = this.toastmessage.successMessage(response,"serviceMetrics");
          }
        } else{
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          this.isError = true;
        }
        setTimeout(() => {
          this.checkcarausal();
          var gHeight ;
          var g_height = document.getElementsByClassName('graph-container')[0];
          if(g_height != undefined){
            gHeight = g_height.clientHeight;
            gHeight=gHeight+31;
            g_height.setAttribute('style','min-height:'+gHeight+'px;')
          }
            
        }, 10)
       
      },
      err => {
        this.isError=true;
        this.isDataNotAvailable = true;
        this.isGraphLoading = false;
        this.errBody = err._body;
        this.errMessage = 'OOPS! something went wrong while fetching data';
        try {
          this.parsedErrBody = JSON.parse(this.errBody);
          if(this.parsedErrBody.message != undefined && this.parsedErrBody.message != '' ) {
            this.errMessage = this.parsedErrBody.message;
          }
          } catch(e) {
            console.log('JSON Parse Error', e);
          }

        // Log errors if any
        let errorMessage;
        errorMessage=this.toastmessage.errorMessage(err,"serviceMetrics");
        this.getTime();
			  this.errorURL = window.location.href;
			  this.errorAPI = env_internal.baseurl+"/jazz/metrics";
			  this.errorRequest = this.payload;
        this.errorUser = this.authenticationservice.getUserId();
        this.errorResponse = JSON.parse(err._body);
	
		})
	};

	getTime() {
		var now = new Date();
		this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
		+ ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
	  }

	feedbackRes:boolean=false;
  openModal:boolean=false;
  timerangeSelected:any;
    feedbackMsg:string='';
    feedbackResSuccess:boolean=false;
	feedbackResErr:boolean=false;
	isFeedback:boolean=false;
    toast:any;
    model:any={
        userFeedback : ''
	};
	buttonText:string='SUBMIT';
	isLoading:boolean=false;
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
  
  dropDownSelecters(){
    var thisele=this;
    var methodlist=[], pathlist=[];
    this.serviceMetricsList.forEach(function(each){
      var pathi = pathlist.indexOf(each.asset_properties.Resource);
      if(pathi<0){
        pathlist.push(each.asset_properties.Resource);
      }
      var methodi = methodlist.indexOf(each.asset_properties.Method);
      if(methodi<0){
        methodlist.push(each.asset_properties.Method);
      }
      thisele.pathList = pathlist;
      thisele.methodList = methodlist;
      if(thisele.envUpdate){
        thisele.methodSelected = thisele.methodList[0];
        thisele.envUpdate = !thisele.envUpdate;
      }
    });
  }

  abbreviate_number = function(num, fixed) {
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
    var b = (num).toPrecision(2).split("e"), // get power
        k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
        c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed), // divide by power
        d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
        e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }

  displayMetrics(){
    var conditon;
    var thisele=this, max = null, min = null;
    thisele.isGraphLoading = true;
    thisele.metricsList=[];
    this.graphInput=[];
    this.serviceMetricsList.forEach(function(each){
      each.asset_properties.Method = "a";
      thisele.methodSelected = "a";
      each.asset_properties.Resource = "b";
      thisele.pathSelected = "b";
      if(thisele.service.serviceType == "api"){
        var first = (each.asset_properties.Method == thisele.methodSelected);
        var second = (each.asset_properties.Resource == thisele.pathSelected);

        conditon = first && second;

      }
      else{
        conditon=true;
      }
      if(conditon){  
        each.metrics.forEach(eachSet => {
          var sum=0; var value =0;
          eachSet.data.forEach(element => {
            var elem =parseInt( element.value);
            sum = sum+parseInt(element.value);
            if(max==null || max<elem) max = elem;
            if(min==null || min>elem) min = elem; 
          });
          switch(each.statistics){
            case 'Average':
              if(sum == 0){
                value = sum;
              } else{
                value = sum/eachSet.data.length;
              }
              break;
            case 'Sum':
              value = sum;
              break;
            case 'Maximum':
              value = max;
              break;
            case 'Minimum':
              value = min;
              break;
          }
          let cardInfo = {
            metric_name : eachSet.metric_name,
            xAxis : eachSet.xAxis,
            yAxis : eachSet.yAxis,
            data : eachSet.data,
            metricSum: thisele.abbreviate_number(value,0),
            statistics:each.statistics
          }
          thisele.metricsList.push(cardInfo);
          thisele.isGraphLoading =false;
        });
      }
    });
    if(thisele.metricsList.length === 0 || thisele.metricsList[0].data.length === 0){
      this.isDataNotAvailable = true;
      this.isGraphLoading = false;
    } else if(thisele.metricsList[0].data.length > 0 && thisele.metricsList[0] != undefined){
      this.isDataNotAvailable = false;
      this.isGraphLoading = false;
      this.graphInput= thisele.metricsList[this.metricsIndex];
      setTimeout(function(){
        if(thisele.metricsList.length>0){
          var ele = document.getElementsByClassName('metrics-card');
          var eachCardWidth;
          if(ele[0] != undefined){
            eachCardWidth =ele[0].clientHeight + 24;
            for(var i = 0; i< ele.length; i++){
              ele[i].setAttribute('style','min-height:'+ele[0].clientHeight+'px');
            }
          }
          var mainEle = document.getElementsByClassName('scroll-cards-wrap')[0].clientWidth;
          var limit = document.getElementsByClassName('metrics-cards-wrap')[0].clientWidth;
          document.getElementsByClassName('metrics-cards-wrap')[0].setAttribute('style','height:'+eachCardWidth+'px')      
          this.maxCards = true;
          if(mainEle > limit){
            thisele.maxCards = true;
          } else {
            thisele.maxCards = false;
            thisele.minCards = false;
          }
        } else{
          this.isDataNotAvailable = true;
        }
      },10)
    } else{
    }
  }
  onResize(event) {
    this.checkcarausal();
  }

  checkcarausal() {
    var main_ele = document.getElementsByClassName('scroll-cards-wrap')[0];
    if(main_ele != undefined)
      var mainEle = document.getElementsByClassName('scroll-cards-wrap')[0].clientWidth;

    var _limit = document.getElementsByClassName('metrics-cards-wrap')[0];
    if(_limit != undefined)
      var limit = document.getElementsByClassName('metrics-cards-wrap')[0].clientWidth;

    if (mainEle > limit) {
      this.maxCards = true;
    } else {
      this.maxCards = false;
      this.minCards = false;
    }
  }

  cancelFilter(event){
		switch(event){
      case 'time-range':{this.instance_yes.onRangeListSelected('Day'); 
      this.getRangefunc(1);
			break;
		  }
      case 'time-range-slider':{this.instance_yes.resetslider(1);
        this.getRangefunc(1);
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
        this.getRangefunc(1);
        this.instance_yes.resetslider(1); 
				break;
		  	}
		}
}
  onPathListicSelected(path){
    this.pathSelected=path;
    this.displayMetrics();
  }
  onMethodListSelected(method){

    this.FilterTags.notify('filter-Method',method);

    this.methodSelected=method;
    this.displayMetrics();
  }

  onPeriodSelected(period){
    this.FilterTags.notify('filter-Period',period);
    this.payload.interval = this.periodListSeconds[this.periodList.indexOf(period)];
    this.callMetricsFunc();
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
    this.FilterTags.notify('filter-TimeRange',range);
    this.sendDefaults(range);
    
    this.timerangeSelected=range;
    this.sliderFrom =1;
    this.FilterTags.notify('filter-TimeRangeSlider',this.sliderFrom);
    
    var resetdate = this.getStartDate(range, this.sliderFrom);
    this.resetPeriodList(range);
    this.selectedTimeRange = range;
    this.payload.start_time = resetdate;
    this.callMetricsFunc();
  }

    
  onEnvSelected(envt){
    this.FilterTags.notify('filter-Env',envt);
    this.envSelected = envt;
    this.payload.environment = envt;
    var env_list=this.cache.get('envList');
		var fName = env_list.friendly_name;
		var index = fName.indexOf(envt);
		var env = env_list.env[index];
    this.envSelected = envt;
    this.payload.environment = env;
    this.callMetricsFunc();
    this.envUpdate = true;
  }

  onStatisticSelected(statistics){
    this.FilterTags.notify('filter-Statistic',statistics);    
    this.statisticSelected = statistics;
    this.payload.statistics = statistics;
    this.callMetricsFunc();
  }

 

  resetPeriodList(filter){
    var resetdate = this.getStartDate(filter, this.sliderFrom);
    let newStartDate = new Date(resetdate);
    let endDate = new Date();
    var timeDiff = Math.abs(endDate.getTime() - newStartDate.getTime());
    var diffSec = Math.ceil(timeDiff / (1000));
    var limitDatapoints = diffSec / 500;
    this.periodList = [];
    this.periodListSeconds = [];
    var _this = this;
    this.allPeriodList.forEach(function(obj){
      if(limitDatapoints < parseInt(obj.sec) ){
        _this.periodList.push(obj.min);
        _this.periodListSeconds.push(obj.sec);
      }
    });
    
    if(this.payload != undefined && this.payload.interval != undefined){
      this.payload.interval = this.periodListSeconds[this.periodList.indexOf(this.periodList[0])];
    }
  }
  public goToAbout(hash){
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag',true);
    this.cache.set('scroll_id',hash);
 }

  setAttributes(el, attrs) {
    for(var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }
  getRangefunc(e){
    this.FilterTags.notify('filter-TimeRangeSlider',e);    
  }

  getRange(e){
    this.FilterTags.notify('filter-TimeRangeSlider',e.from);
    
    this.sliderFrom =e.from;
    this.sliderPercentFrom=e.from_percent;
    var resetdate = this.getStartDate(this.selectedTimeRange, this.sliderFrom);
    this.payload.start_time = resetdate;
    this.callMetricsFunc();
    }
  
  onClickFilter(){
    
      
    var slider = document.getElementById('sliderElement');
    
    slider.getElementsByClassName('irs-line-mid')[0].setAttribute('style','border-radius:10px;')
    slider.getElementsByClassName('irs-bar-edge')[0].setAttribute('style',' background: none;background-color: #ed008c;border-bottom-left-radius:10px;border-top-left-radius:10px;width: 10px;');
    slider.getElementsByClassName('irs-single')[0].setAttribute('style',' background: none;background-color: #ed008c;left:'+this.sliderPercentFrom+'%');
    slider.getElementsByClassName('irs-bar')[0].setAttribute('style',' background: none;left:10px;background-color: #ed008c;width:'+this.sliderPercentFrom+'%');
    slider.getElementsByClassName('irs-slider single')[0].setAttribute('style','width: 20px;top: 20px;height: 20px;border-radius: 50%;cursor:pointer;background: none; background-color: #fff;left:'+this.sliderPercentFrom+'%');
    slider.getElementsByClassName('irs-max')[0].setAttribute('style','background: none');
    slider.getElementsByClassName('irs-min')[0].setAttribute('style','background: none');
    
  }

  getFilter(filterServ){
    this.service['ismetrics']=true;
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

  selectedMetrics(index){
    this.metricsIndex=index;
    this.graphInput = this.metricsList[index];
    var ele = document.getElementsByClassName('metrics-card');
    for(var i=0;i<ele.length;i++){
      ele[i].classList.remove('arrow_box');
    }
    ele[index].className += ' arrow_box';
  }


refresh(){
  this.callMetricsFunc();
}

  leftArrowClick(){
    var mainEle = document.getElementsByClassName('scroll-cards-wrap');
    var innerWidth = (mainEle[0].clientWidth + 12)/this.metricsList.length;
    this.maxCards = true;
    if(this.safeTransformX < 0){
      this.minCards = true;
      this.safeTransformX = this.safeTransformX + innerWidth;
      if(this.safeTransformX >= 0){
        this.minCards = false;
      }
    }
  }

  rightArrowClick(){
    var mainEle = document.getElementsByClassName('scroll-cards-wrap');
    var limit = document.getElementsByClassName('metrics-cards-wrap')[0].clientWidth;
    var innerWidth = (mainEle[0].clientWidth)/this.metricsList.length;
    this.minCards=true;
    if(this.safeTransformX > (-mainEle[0].clientWidth+limit)){
      this.maxCards = true;
      this.safeTransformX = this.safeTransformX - innerWidth;
      if(this.safeTransformX <= (-mainEle[0].clientWidth+limit)){
        this.maxCards = false;
      }
    }
  }
}
