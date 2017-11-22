import { Component, OnInit, ElementRef, Inject, Input } from '@angular/core';
import { DayData, WeekData, MonthData, Month6Data, YearData } from './data';
import { AfterViewInit, ViewChild } from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';

// import { LineGraphComponent }  from './../../secondary-components/line-graph/line-graph.component';

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit {

	// @ViewChild(LineGraphComponent)

	// public lineGraph: LineGraphComponent;
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
  // serviceTypeList : Array<string> = ['api', 'lambda', 'website'];
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
    // below hardcoding for serviceType :: hotfix for Tech Training - Aug 31.. to be removed later
		// if(this.service.serviceType === 'function' || this.service.serviceType === 'lambda'){
		// 	var serviceName = "custom-ad-authorizer"
		// } else if(this.service.serviceType === 'api'){
		// var serviceName = "events"
		// }else if(this.service.serviceType === 'website'){
		// var serviceName = " service-onboarding"
		// }
    console.log("this.service ", this.service);
    this.resetPeriodList(this.selected); //  to set periodListValue such that total num of datapoints < 1440 .. http://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricStatistics.html
    this.payload = {
        "service":this.service.name || "events",// this.service.name,//hotfix for Tech Training - Aug 31
        "domain": this.service.domain || "platform",//this.service.domain,//hotfix for Tech Training - Aug 31
        "environment": this.environmentList[0],//hotfix for Tech Training - Aug 21this.environmentList[0],
        "end_time": (new Date().toISOString()).toString(),
        "start_time": this.getStartDate(this.selected),
        "interval": this.periodListSeconds[this.periodList.indexOf(this.periodList[0])],
        "statistics": this.statisticList[0]
    };
    // console.log("this.payload.interval ", this.payload.interval);
    //     - services (API)
    // - events(API)
    // - service-onboarding(Website)
    // - custom-ad-authorizer(Function)
    // below hardcoding for serviceType :: hotfix for Tech Training - Aug 31.. to be removed later
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
      console.log("this.service.serviceType is defined as ", this.service.serviceType);
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
      // temporary fix as /platform/services backfilling is not done due to which we will not get proper value in of service.serviceType

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
          // var oldGraphObj = this.serviceMetricsList ? this.serviceMetricsList.assets[eachAsset].metrics[eachMetric] : [];
          // var oldGraphObj = [];
          var datapointArray = eachMetric.datapoints.sort(compare);
          // console.log("datapointArray",datapointArray);
          eachAssetMetric.push({
            metric_name : eachMetric.metric_name,
            xAxis: { label: 'TIME', range: selectedTimeRange.toLowerCase() },
            // yAxis: { label: datapointArray.length > 0 ? datapointArray[0].Unit : "-"}, // commenting metrics y axis label
            yAxis: { label: datapointArray.length > 0 ? "" : "-"},
            data : eachMetricDatapoint,
            // dataOld: [] // TODO oldGraphObj ? oldGraphObj.datapoints || eachMetricDatapoint : []
          });
          if(datapointArray && datapointArray.length > 0){
            datapointArray.forEach(function(eachDatapoint){
              var modifiedkey = eachDatapoint.Timestamp;
              // modifiedkey = modifiedkey.replace(/[-]/g, '/');
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
            // let serviceRow = {
            //   date: "", // graphDataDate
            //   value: "",
            //   unit: ""
            // };
            // eachMetricDatapoint.push(serviceRow);
            eachMetricDatapoint = [];
          }
        }); // end of eachAsset.metrics
      }       // ***** uncomment
      else{
        console.log(" *** unmatched this.service.serviceType and eachAsset.type *** ");
        console.log("_this.service.serviceType ", _this.service.serviceType);
        console.log(" eachAsset.type", eachAsset.type);
      }
    }); // end of serviceMetric.assets
    // console.log("_serviceMetricList ",_serviceMetricList);
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

    // console.log(" in callMetricsFunc ");
    this.isGraphLoading=true;
    this.isDataNotAvailable = false;
    this.isError = false;
    //this.payload = {"service":"events","domain":"platform","environment":"prod","end_time":"2017-08-30T09:28:42.279Z","start_time":"2017-08-24T09:28:42.279Z","interval":"900","statistics":"Average"}
    	 if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
		this.subscription = this.http.post('/platform/metrics', this.payload).subscribe(
    // this.http.post('/platform/metrics', this.payload).subscribe(
      response => {
          //Bind to view
          // console.log("response ",response);
        let serviceMetrics = response.data;

        // let serviceInput = response.input;
        if (serviceMetrics !== undefined && serviceMetrics !== "" && serviceMetrics.assets !== undefined && serviceMetrics.assets.length > 0 ) {
            this.serviceMetricsList = this.processServiceList(serviceMetrics);
        } else if(serviceMetrics !== undefined && serviceMetrics === "" || serviceMetrics.assets.length == 0 ){
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          // this.loadingState = 'error';
          if(serviceMetrics === ""){
            let errorMessage = this.toastmessage.successMessage(response,"serviceMetrics");
            this.popToast('error', 'Oops!', errorMessage)
          }
        } else{
          // console.log("unknown case ",response);
          this.isGraphLoading = false;
          this.isDataNotAvailable = true;
          this.isError = true;
        }
      },
      err => {
        this.isError=true;
        console.log("err",err);   
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
        // console.log("err ",err);
        // console.log("err.status ",err.status);
        // console.log("err._body ",err._body);
        errorMessage=this.toastmessage.errorMessage(err,"serviceMetrics");
        // this.popToast('error', 'Oops!', errorMessage);
    })
  }

  onTypeSelected(type){
    // console.log("graph type",type);
  }

  onPeriodSelected(period){
    this.payload.interval = this.periodListSeconds[this.periodList.indexOf(period)];
    this.callMetricsFunc();
  }

  onEnvSelected(environment){
    // console.log("environment",environment);
    this.payload.environment = environment;
    this.callMetricsFunc();
  }

  onStatisticSelected(statistics){
    // console.log("statistics",statistics);
    this.payload.statistics = statistics;
    this.callMetricsFunc();
  }

  getStartDate(filter){
    var todayDate = new Date();
    // console.log("todayDate ",todayDate);
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
        // var resetdate = resetYear+"-"+resetMonth+"-01 00:00:00"
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

    // console.log("allPeriodList", this.allPeriodList);
    var _this = this;
    this.allPeriodList.forEach(function(obj){
      // console.log("obj ", obj);
      if(limitDatapoints < parseInt(obj.sec) ){
        _this.periodList.push(obj.min);
        _this.periodListSeconds.push(obj.sec);
      }
    });
    // console.log("resetPeriodList this.periodList ",this.periodList );
    // console.log("resetPeriodList this.periodListSeconds ",this.periodListSeconds);
    if(this.payload != undefined && this.payload.interval != undefined){
      this.payload.interval = this.periodListSeconds[this.periodList.indexOf(this.periodList[0])];
      // console.log("resetPeriodList this.payload.interval ", this.payload.interval);
    }
  }

  onFilterSelected(filters){
    var filter = 'Day';
    if (filters[0]) {
      filter = filters[0];
    }

    this.selectedTimeRange = filter;
    // console.log("filter",filter);

    var resetdate = this.getStartDate(filter);
    this.resetPeriodList(filter);
    // console.log("resetdate",resetdate);
    this.payload.start_time = resetdate;
    this.callMetricsFunc();
  }

}
