import { Component, OnInit, ElementRef, Inject, Input, Pipe, PipeTransform } from '@angular/core';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { ToasterService} from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';
declare var $:any;

@Component({
  selector: 'service-logs',
  templateUrl: './service-logs.component.html',
  styleUrls: ['./service-logs.component.scss']
})
export class ServiceLogsComponent implements OnInit {
	@Input() service: any = {};
	payload:any={};
	private http:any;
	root: any;
	errBody: any;
	parsedErrBody: any;
	errMessage: any;
	private toastmessage:any;
	loadingState:string='default';
	logsSearch:any = {"environment" : "prod"};
	 private subscription:any;
	 filterloglevel:string = 'INFO';
	 environment:string = 'prod';
	 pageSelected:number =1;
	 expandText:string='Expand all';
	 ReqId=[];

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
				data: ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG']
			}
		}
	]

	logs = [];
	backupLogs=[];

	logsData = []

	filtersList = ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG'];
	selected=['INFO']

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

	environmentList = ['dev', 'prod'];

	onEnvSelected(env){
		this.logsSearch.environment = env;
		if(env === 'prod'){
			env='prod'
		}
		this.environment = env;
		this.payload.environment=this.environment;
		this.resetPayload();
	}

	onClickFilter(){
		
		//ng2-ion-range-slider
		  
		var slider = document.getElementById('sliderElement');
		
		slider.getElementsByClassName('irs-line-mid')[0].setAttribute('style','border-radius:10px;')
		slider.getElementsByClassName('irs-bar-edge')[0].setAttribute('style',' background: none;background-color: #ed008c;border-bottom-left-radius:10px;border-top-left-radius:10px;width: 10px;');
		slider.getElementsByClassName('irs-single')[0].setAttribute('style',' background: none;background-color: #ed008c;left:'+this.sliderPercentFrom+'%');
		slider.getElementsByClassName('irs-bar')[0].setAttribute('style',' background: none;left:10px;background-color: #ed008c;width:'+this.sliderPercentFrom+'%');
		slider.getElementsByClassName('irs-slider single')[0].setAttribute('style','width: 20px;cursor:pointer;top: 20px;height: 20px;border-radius: 50%; background: none; background-color: #fff;left:'+this.sliderPercentFrom+'%');
		
		slider.getElementsByClassName('irs-max')[0].setAttribute('style','background: none');
		slider.getElementsByClassName('irs-min')[0].setAttribute('style','background: none');
	}
	getRange(e){
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

	onRangeListSelected(range){
		this.sliderFrom =1;
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
		// console.log('row,index',row,index)
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i]

			if (i == index) {
				rowData['expanded'] = !rowData['expanded'];
			} else{
				rowData['expanded'] = false;
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
	  console.log(todayDate,todayDate.getMonth());
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
		// console.log('',this.service);
		// this.payload= {
		// 	 "service" :  this.service.name ,//"logs", //
		// 	"domain" :   this.service.domain ,//"jazz", //
		// 	"environment" :  this.environment, //"dev"
		// 	"category" :   this.service.serviceType ,//"api",//
		// 	"size" : this.limitValue,
		// 	"offset" : this.offsetValue,
		// 	"type":this.filterloglevel ||"INFO",
		// 	"end_time": (new Date().toISOString()).toString()
		// }
		// console.log("logs payload:", this.payload);
		 if ( this.subscription ) {
			this.subscription.unsubscribe();
		}
		this.subscription = this.http.post('/jazz/logs', this.payload).subscribe(
      response => {
		  console.log("response:", response)
	   this.logs  = response.data.data.logs;
		
		if(this.logs.length !=0){
			var pageCount = response.data.count;
			this.totalPagesTable = 0;
			// console.log("total count:"+pageCount);
			if(pageCount){
			  this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
			}
			else{
			  this.totalPagesTable = 0;
			}
			this.backupLogs = this.logs;
			this.filter = new Filter(this.logs);
			this.logs = this.filter.filterFunction("type", this.filterloglevel, this.backupLogs);
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

        // console.log("err",err);

        // this.isDataNotAvailable = true;
        // this.isGraphLoading = false;
        // this.isError = true;

        // // Log errors if any
        // let errorMessage;
        // // console.log("err ",err);
        // // console.log("err.status ",err.status);
        // // console.log("err._body ",err._body);
        // errorMessage=this.toastmessage.errorMessage(err,"serviceMetrics");
        // // this.popToast('error', 'Oops!', errorMessage);
    })


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
    //   console.log("page not changed");
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
		
		// this.logs = this.filter.filterFunction("type", this.filterloglevel, this.backupLogs);
		// console.log("this.logs.length:"+this.logs.length);
		// if(this.logs.length === 0){
		// 	this.loadingState = 'empty';
		// } else{
		// 	this.loadingState = 'default';
		// }

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

	

  constructor(@Inject(ElementRef) elementRef: ElementRef, private request: RequestService,private toasterService: ToasterService,private messageservice: MessageService) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = el;
    this.toasterService = toasterService;
    this.http = request;
    this.toastmessage= messageservice;
  }

  ngOnInit() {
		//this.logs = this.logsData;
		var todayDate = new Date();
		this.payload= {
			"service" :  this.service.name ,//"logs", //
		   "domain" :   this.service.domain ,//"jazz", //
		   "environment" :  this.environment, //"dev"
		   "category" :   this.service.serviceType ,//"api",//
		   "size" : this.limitValue,
		   "offset" : this.offsetValue,
		   "type":this.filterloglevel ||"INFO",
		   "end_time": (new Date().toISOString()).toString(),
		   "start_time":new Date(todayDate.setDate(todayDate.getDate()-this.sliderFrom)).toISOString()
	   }				
	this.callLogsFunc();
  }

	
	

}
