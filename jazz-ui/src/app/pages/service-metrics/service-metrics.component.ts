import { Component, OnInit, ElementRef, Inject, Input } from '@angular/core';
import { DayData, WeekData, MonthData, Month6Data, YearData } from './data';
import { AfterViewInit, ViewChild } from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit {

	// @ViewChild(LineGraphComponent)

  @Input() service: any = {};
  private subscription:any;


  filtersList: Array<string> = ['7 Days', '4 Weeks', '6 Months', '1 Year'];
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
  environmentList: Array<string> = ['prod', 'dev'];
  statisticList: Array<string> = ['Average', 'Sum', 'SampleCount','Maximun','Minimum'];
  viewBox = "0 0 300 150";
  today = new Date();
  yesterday = this.today.setDate(this.today.getDate()-1);
  selected = this.filtersList[0];
  payload:any;
  errBody: any;
	parsedErrBody: any;
	errMessage: any;

  private http:any;
  selectedTimeRange:string= this.filtersList[0];
  serviceMetricsList: Array<string>=[];
  isGraphLoading:boolean=true;
  isDataNotAvailable:boolean=false;
  isError:boolean=false;
  private toastmessage:any;
  root: any;

  // temporary graph data
  graphs: Array<any>;
  graphsOld: Array<any>;


  constructor(@Inject(ElementRef) elementRef: ElementRef, private request: RequestService,private toasterService: ToasterService,private messageservice: MessageService) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = el;
    this.graphs = DayData;
    this.graphsOld = DayData;
    this.toasterService = toasterService;
    this.http = request;
    this.toastmessage= messageservice;
  }

  ngOnInit() {
    this.resetPeriodList(this.selected); 
    this.payload = {
        "service":this.service.name || "events",
        "domain": this.service.domain || "platform",
        "environment": this.environmentList[0],
        "end_time": (new Date().toISOString()).toString(),
        "start_time": this.getStartDate(this.selected),
        "interval": this.periodListSeconds[this.periodList.indexOf(this.periodList[0])],
        "statistics": this.statisticList[0]
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
          asset_properties : asset_name_array,
          statistics : eachAsset.statistics,
          metrics : eachAssetMetric,
          oldMetrics : [] // TODO oldG
        });
        eachAsset.metrics.forEach(function(eachMetric){
          var eachMetricDatapoint = [];
          var datapointArray = eachMetric.datapoints.sort(compare);
          eachAssetMetric.push({
            metric_name : eachMetric.metric_name,
            xAxis: { label: 'TIME', range: selectedTimeRange.toLowerCase() },
            yAxis: { label: datapointArray.length > 0 ? "" : "-"},
            data : eachMetricDatapoint,
          });
          if(datapointArray && datapointArray.length > 0){
            datapointArray.forEach(function(eachDatapoint){
              var modifiedkey = eachDatapoint.Timestamp;
              var eachDate=new Date(modifiedkey);
              var monthIndex=eachDate.getMonth();
              let graphDataDate="";

              let serviceRow = {
                date: eachDate, // graphDataDate
                value: eachDatapoint[stat].toFixed(5),
                unit: eachDatapoint["Unit"]
              };
              eachMetricDatapoint.push(serviceRow);

            }); // end of datapointArray
          }
          else{
           
            eachMetricDatapoint = [];
          }
        }); // end of eachAsset.metrics
      }       // ***** uncomment
      else{
      }
    }); // end of serviceMetric.assets
      if(_serviceMetricList.length > 0){
        this.isDataNotAvailable = false;
      }
      else{
        this.isDataNotAvailable = true;
      }
      this.isGraphLoading = false;

    return _serviceMetricList;
  }

  callMetricsFunc(){
    this.isGraphLoading=true;
    this.isDataNotAvailable = false;
    this.isError = false;
    	 if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
		this.subscription = this.http.post('/platform/metrics', this.payload).subscribe(
      response => {
          //Bind to view
        let serviceMetrics = response.data;

        // let serviceInput = response.input;
        if (serviceMetrics !== undefined && serviceMetrics !== "" && serviceMetrics.assets !== undefined && serviceMetrics.assets.length > 0 ) {
            this.serviceMetricsList = this.processServiceList(serviceMetrics);
        } else if(serviceMetrics !== undefined && serviceMetrics === "" || serviceMetrics.assets.length == 0 ){
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          if(serviceMetrics === ""){
            let errorMessage = this.toastmessage.successMessage(response,"serviceMetrics");
            this.popToast('error', 'Oops!', errorMessage)
          }
        } else{
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          this.isError = true;
        }
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
    })
  }

  onTypeSelected(type){
  }

  onPeriodSelected(period){
    this.payload.interval = this.periodListSeconds[this.periodList.indexOf(period)];
    this.callMetricsFunc();
  }

  onEnvSelected(environment){
    this.payload.environment = environment;
    this.callMetricsFunc();
  }

  onStatisticSelected(statistics){
    this.payload.statistics = statistics;
    this.callMetricsFunc();
  }

  getStartDate(filter){
    var todayDate = new Date();
    switch(filter){
      case "1 day":
        var resetdate = new Date(todayDate.setDate(todayDate.getDate()-1)).toISOString();
        break;
      case "7 Days":
        var resetdate = new Date(todayDate.setDate(todayDate.getDate()-6)).toISOString();
        break;
      case "4 Weeks":
        var  resetdate = new Date(todayDate.setDate(todayDate.getDate()-(5*6))).toISOString();
        break;
      case "6 Months":
        var currentMonth = new Date ((todayDate).toISOString()).getMonth();
        var currentYear = new Date ((todayDate).toISOString()).getFullYear();
        if(++currentMonth>6){
          var resetMonth = (currentMonth) - 6;
          var resetYear = currentYear;
        } else{
          var resetMonth= (currentMonth) + 6;
          var resetyear = --currentYear;
        }
        var newStartDateString = resetYear.toString()+"/"+resetMonth.toString()+"/"+"1";
        var newStartDate = new Date(newStartDateString);
        var resetdate = newStartDate.toISOString();
        break;
      case "1 Year":
        var currentYear = new Date((todayDate).toISOString()).getFullYear();
        var newStartDateString = (currentYear).toString()+"/"+"1"+"/"+"1";
        var newStartDate = new Date(newStartDateString);
        var resetdate = newStartDate.toISOString();
        break;
      case "6 Years":
        var currentYear = new Date((todayDate).toISOString()).getFullYear();
        var newStartDateString = (currentYear-6).toString()+"/"+"1"+"/"+"1";
        var newStartDate = new Date(newStartDateString);
        var resetdate = newStartDate.toISOString();
        break;
    }
    return resetdate.toString();
  }

  resetPeriodList(filter){
    var resetdate = this.getStartDate(filter);
    let newStartDate = new Date(resetdate);
    let endDate = new Date();
    var timeDiff = Math.abs(endDate.getTime() - newStartDate.getTime());
    var diffSec = Math.ceil(timeDiff / (1000));
    var limitDatapoints = diffSec / 1400;
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

  onFilterSelected(filters){
    var filter = 'Day';
    if (filters[0]) {
      filter = filters[0];
    }

    this.selectedTimeRange = filter;
    var resetdate = this.getStartDate(filter);
    this.resetPeriodList(filter);
    this.payload.start_time = resetdate;
    this.callMetricsFunc();
  }

}
