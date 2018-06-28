import { Component, OnInit, ComponentFactoryResolver, ReflectiveInjector, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';





@Component({ 
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit {
  @Input() service;


  constructor() {}

  

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
  statisticSelected:string= this.statisticList[1];
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

  }
}
