import { Component, OnInit, ElementRef, Inject, Input, Pipe, PipeTransform } from '@angular/core';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
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

	logsData = []

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
		this.callLogsFunc();

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
	});
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
  }

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
	this.callLogsFunc();
  }

}
