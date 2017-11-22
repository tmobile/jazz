import { Component, OnInit, ElementRef, Inject, Input, Pipe, PipeTransform } from '@angular/core';
import { Filter } from '../../secondary-components/tmobile-table/tmobile-filter';
import { Sort } from '../../secondary-components/tmobile-table/tmobile-table-sort';
import { ToasterService} from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';

@Component({
  selector: 'service-logs',
  templateUrl: './service-logs.component.html',
  styleUrls: ['./service-logs.component.scss']
})
export class ServiceLogsComponent implements OnInit {
	@Input() service: any = {};
	payload:any;
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

	logsData = [
		{
			time: '2017-05-30T09:36:12.210Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: '',
			message: 'START RequestId: 6b0bfa2b-451b-11e7-8b01-d9deac4f71e0 Version: $LATEST'
		},
		{
			time: '2017-05-30T09:36:12.845Z',
			requestId: '9e472a9c-4525-11e7-ab3f-773ba7a550a0',
			logLevel: 'INFO',
			message: 'eventDetailslatest\n{\n    "body": {\n        "service_type": "api",\n        "service_name": "testService-capi32830d",\n        "approvers": [\n            "AAnand12"\n        ],\n        "username": "aanand12",\n        "password": "Welcome@1234567",\n        "domain": "domain",\n        "runtime": "java",\n        "require_internal_access": true,\n        "slack_channel": "general"\n    },\n    "method": "POST",\n    "principalId": "",\n    "stage": "dev",\n    "headers": {\n        "Accept": "application/json, text/plain, */*",\n        "Accept-Encoding": "gzip, deflate, br",\n        "Accept-Language": "en-US,en;q=0.8",\n        "CloudFront-Forwarded-Proto": "https",\n        "CloudFront-Is-Desktop-Viewer": "true",\n        "CloudFront-Is-Mobile-Viewer": "false",\n        "CloudFront-Is-SmartTV-Viewer": "false",\n        "CloudFront-Is-Tablet-Viewer": "false",\n        "CloudFront-Viewer-Country": "US",\n        "content-type": "application/json",\n        "Host": "dev-cloud-api.corporate.t-mobile.com",\n        "origin": "http://localhost:4200",\n        "Referer": "http://localhost:4200/services",\n        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",\n        "Via": "2.0 16d2657cebef5191828b055567b4efeb.cloudfront.net (CloudFront)",\n        "X-Amz-Cf-Id": "PkYaef8MpkJXVfsISK1kqw03u2x5jNXHN5Mq62TJ2r_O6KAx5OG98Q==",\n        "X-Amzn-Trace-Id": "Root=1-592d3d0c-6e3ad9b21f31e5de6efcea4d",\n        "X-Forwarded-For": "206.29.176.51, 54.182.214.76",\n        "X-Forwarded-Port": "443",\n        "X-Forwarded-Proto": "https"\n    },\n    "query": {},\n    "path": {},\n    "identity": {\n        "cognitoIdentityPoolId": "",\n        "accountId": "",\n        "cognitoIdentityId": "",\n        "caller": "",\n        "apiKey": "",\n        "sourceIp": "206.29.176.51",\n        "accessKey": "",\n        "cognitoAuthenticationType": "",\n        "cognitoAuthenticationProvider": "",\n        "userArn": "",\n        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",\n        "user": ""\n    },\n    "stageVariables": {}\n}'
		},
		{
			time: '2017-05-30T09:36:13.513Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:13.534Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'value null'
		},
		{
			time: '2017-05-30T09:36:13.534Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'IncomingMessage { _readableState: ReadableState { objectMode: false, highWaterMark: 16384, buffer: [], length: 0, pipes: null, pipesCount: 0, flowing: true, ended: true, endEmitted: true, reading: false, sync: true, needReadable: false, emittedReadable:'
		},
		{
			time: '2017-05-30T09:36:13.813Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: 'body { data: { message: \'authentication successfull\' }, input: { username: \'aanand12\' } }'
		},
		{
			time: '2017-05-30T09:36:13.813Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'in function capi328'
		},
		{
			time: '2017-05-30T09:36:13.815Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'enter function loop capi328'
		},
		{
			time: '2017-05-30T09:36:13.815Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: 'after appending vpc { uri: \'https://cloud-api.corporate.t-mobile.com/api/platform/create-serverless-service\', method: \'POST\', json:  { service_type: \'api\', service_name: \'testService-capi32830d\', runtime: \'java\', username: \'aanand12\', approvers: [ \'AAnand12\' ], domain: \'domain\', request_id: \'6b85e4e0-451b-11e7-b7ca-73e8a165d222\', slack_channel: \'general\', require_internal_access: true }, rejectUnauthorized: false } '
		},
		{
			time: '2017-05-30T09:36:14.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:14.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:16.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:16.146Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: '{ return_result: { signin: { data: [Object], input: [Object] }, create_service: { data: \'Your Service Code will be available at https://bitbucket.corporate.t-mobile.com/projects/CAS/repos/domain_testservice-capi32830d/browse\', input: [Object] } }'
		},
		{
			time: '2017-05-30T09:36:16.866Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: '',
			message: ''
		}
	]

	filtersList = ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG'];
	selected=['INFO']


	filterSelected: Boolean = false;
	searchActive: Boolean = false;
	searchbar: string = '';
	filter:any;
	sort:any;
	paginationSelected: Boolean = true;
	totalPagesTable: number = 7;
	prevActivePage: number = 1;
	limitValue : number = 10;
	offsetValue:number = 0;

	environmentList = ['dev', 'prod'];

	onEnvSelected(env){
		this.logsSearch.environment = env;
		if(env === 'prod'){
			env='prod'
		}
		this.environment = env;

		// this.loadingState = 'loading';
		this.callLogsFunc();

	}

	navigateTo(event){
		var url = "http://search-cloud-api-es-services-smbsxcvtorusqpcygtvtlmzuzq.us-west-2.es.amazonaws.com/_plugin/kibana/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$$hashKey':'object:705','$state':(store:appState),meta:(alias:!n,disabled:!f,index:applicationlogs,key:domain,negate:!f,value:"+this.service.domain+"),query:(match:(domain:(query:"+this.service.domain+",type:phrase)))),('$$hashKey':'object:100','$state':(store:appState),meta:(alias:!n,disabled:!f,index:applicationlogs,key:servicename,negate:!f,value:"+this.service.domain+"_"+this.service.name+"-prod),query:(match:(servicename:(query:"+this.service.domain+"_"+this.service.name+"-prod,type:phrase))))),index:applicationlogs,interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(timestamp,desc),uiState:(spy:(mode:(fill:!f,name:!n))))"
		window.open(url);
	}

	onRowClicked(row, index) {
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i]

			if (i == index) {
				rowData['expanded'] = !rowData['expanded'];
			} else{
				rowData['expanded'] = false;
			}
		}
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
		this.payload= {
			 "service" :  this.service.name ,//"logs", //
			"domain" :   this.service.domain ,//"jazz", //
			"environment" :  this.environment, //"dev"
			"category" :   this.service.serviceType ,//"api",//
			"size" : this.limitValue,
			"offset" : this.offsetValue,
			"type":this.filterloglevel ||"INFO"
		}
		// console.log("logs payload:", this.payload);
		 if ( this.subscription ) {
			this.subscription.unsubscribe();
		}
	
		this.subscription = this.http.post('/platform/logs', this.payload).subscribe(
      response => {
		
	   this.logs  =  response.data.logs || response.data.data.logs;
		if(this.logs.length !=0){
			var pageCount = response.data.count || response.data.data.count;
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
			this.backupLogs = this.logs;
			this.filter = new Filter(this.logs);
			this.loadingState = 'empty';
		}

      },
      err => {
		  this.loadingState='error';
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
		this.callLogsFunc();
	}

	paginatePage(currentlyActivePage){
    if(this.prevActivePage != currentlyActivePage){
	  this.prevActivePage = currentlyActivePage;
	  this.logs=[];
	  this.offsetValue = (this.limitValue * (currentlyActivePage-1));
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

	// onFilterSelected(selectedList){
	// 	this.onFilter({})
	// 	this.logs = this.filter.filterListFunction('logLevel' , selectedList, this.logs);
	// }
	onFilterSelected(filters){
		this.loadingState = 'loading';
		var filter ;
		if (filters[0]) {
			filter = filters[0];
		}
		this.filterloglevel=filter;
		this.offsetValue = 0;
		this.callLogsFunc();
		// console.log("filter:"+filter);

		 this.logs = this.filter.filterFunction("type", this.filterloglevel, this.backupLogs);
		// console.log("this.logs.length:"+this.logs.length);
		 if(this.logs.length === 0){
		 	this.loadingState = 'empty';
		 } else{
		 	this.loadingState = 'default';
		 }

	}

  onServiceSearch(searchbar){
    this.logs  = this.filter.searchFunction("any" , searchbar);
  };

  constructor(@Inject(ElementRef) elementRef: ElementRef, private request: RequestService,private toasterService: ToasterService,private messageservice: MessageService) {
    var el:HTMLElement = elementRef.nativeElement;
    this.root = el;
    this.toasterService = toasterService;
    this.http = request;
    this.toastmessage= messageservice;
  }

  ngOnInit() {
  	//this.logs = this.logsData;

	this.callLogsFunc();
  }

}
