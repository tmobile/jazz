import { Component, OnInit, ComponentFactoryResolver, ReflectiveInjector, ElementRef ,EventEmitter, Output, Inject, Input,ViewChild} from '@angular/core';
// import { Filter } from '../../secondary-components/tmobile-table/tmobile-filter';
// import { Sort } from '../../secondary-components/tmobile-table/tmobile-table-sort';
import {FilterTagsComponent} from '../../secondary-components/filter-tags/filter-tags.component';
// import { Component, OnInit, Input } from '@angular/core';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';

import { Router, ActivatedRoute } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import {AdvancedFiltersComponent} from './../../secondary-components/advanced-filters/internal/advanced-filters.component';


import { RequestService, MessageService, DataCacheService, AuthenticationService } from '../../core/services/index';
import {AdvancedFilterService} from './../../advanced-filter.service';
import {AdvFilters} from './../../adv-filter.directive';
import {environment} from './../../../environments/environment.internal';

@Component({
	selector: 'env-logs-section',
	templateUrl: './env-logs-section.component.html',
	providers: [RequestService],
	styleUrls: ['./env-logs-section.component.scss']
})
export class EnvLogsSectionComponent implements OnInit {
	private http: any;
	// @ViewChild('adv_filters') adv_filters: AdvancedFiltersComponent;
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
		}
	}
	fromlogs:boolean = true;
	private subscription: any;
	limitValue: number = 20;
	offsetValue: number = 0;
	payload: any;
	filterloglevel: string = 'ERROR';
	loadingState: string = 'default';
	// totalPagesTable: number = 7;
	backupLogs = [];
	errBody: any;
	parsedErrBody: any;
	errMessage: any;
	private toastmessage: any;
	private env: any;
	refreshData: any;
	slider: any;
	sliderFrom = 1;
	sliderPercentFrom;
	sliderMax: number = 7;
	rangeList: Array<string> = ['Day', 'Week', 'Month', 'Year'];
	selectedTimeRange: string = this.rangeList[0];




	@Input() service: any = {};

	tableHeader = [
		{
			label: 'Time',
			key: 'time',
			sort: true,
			filter: {
				type: 'dateRange'
			}
		}, {
			label: 'Message',
			key: 'message',
			sort: true,
			filter: {
				type: 'input'
			}
		}, {
			label: 'Request ID',
			key: 'requestId',
			sort: true,
			filter: {
				type: ''
			}
		}, {
			label: 'Log Level',
			key: 'logLevel',
			sort: true,
			filter: {
				type: 'dropdown',
				data: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE']
			}
		}
	]

	logs = []

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
			message: 'START RequestId: 6b0bfa2b-451b-11e7-8b01-d9deac4f71e0 Version: $LATEST'
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
			message: 'START RequestId: 6b0bfa2b-451b-11e7-8b01-d9deac4f71e0 Version: $LATEST'
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
			message: 'START RequestId: 6b0bfa2b-451b-11e7-8b01-d9deac4f71e0 Version: $LATEST'
		},
		{
			time: '2017-05-30T09:36:16.866Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: '',
			message: ''
		}
	]

	filtersList = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'];
	selected = ['ERROR'];

	filterSelected: Boolean = false;
	searchActive: Boolean = false;
	searchbar: string = '';
	filter: any;
	sort: any;
	paginationSelected: Boolean = true;
	totalPagesTable: number = 7;
	prevActivePage: number = 1;
	expandText: string = 'Expand all';
	errorTime: any;
	errorURL: any;
	errorAPI: any;
	errorRequest: any = {};
	errorResponse: any = {};
	errorUser: any;
	errorChecked: boolean = true;
	errorInclude: any = "";
	json: any = {};
	model: any = {
		userFeedback: ''
	};



	accList=['tmodevops','tmonpe'];
	regList=['us-west-2', 'us-east-1'];
	  accSelected:string = 'tmodevops';
	regSelected:string = 'us-west-2';
	
	getFilter(filterServ){
		// let viewContainerRef = this.advanced_filters.viewContainerRef;
		// viewContainerRef.clear();
		// filterServ.setRootViewContainerRef(viewContainerRef);
		// let filtertypeObj = filterServ.addDynamicComponent({"service" : this.service, "advanced_filter_input" : this.advanced_filter_input});
		// let componentFactory = this.componentFactoryResolver.resolveComponentFactory(filtertypeObj.component);
		// // console.log(this.advFilters);
		// var comp = this;
		// // this.advfilters.clearView();
		// let viewContainerRef = this.advFilters.viewContainerRef;
		// // console.log(viewContainerRef);
		// viewContainerRef.clear();
		// let componentRef = viewContainerRef.createComponent(componentFactory);
		// // this.instance_yes=(<AdvancedFiltersComponent>componentRef.instance);
		// (<AdvancedFiltersComponent>componentRef.instance).data = {"service" : this.service, "advanced_filter_input" : this.advanced_filter_input};
		// (<AdvancedFiltersComponent>componentRef.instance).onFilterSelect.subscribe(event => {
		// 	alert("1");
		// 	comp.onFilterSelect(event);
		// });

	}

	 onaccSelected(event){
	//   this.FilterTags.notify('filter-Account',event);
	  this.accSelected=event;
  
	 }
	  onregSelected(event){
	//   this.FilterTags.notify('filter-Region',event);
	  this.regSelected=event;
	 }
	expandall() {
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i];
			rowData['expanded'] = true;
		}
		this.expandText = 'Collapse all';

	}

	collapseall() {
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i];
			rowData['expanded'] = false;
		}
		this.expandText = 'Expand all';
	}

	onRowClicked(row, index) {
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i]

			if (i == index) {
				rowData['expanded'] = !rowData['expanded'];
			} else {
				rowData['expanded'] = false;
			}
		}
	}

	onFilter(column) {
		// this.logs = this.logsData

		for (var i = 0; i < this.tableHeader.length; i++) {
			var col = this.tableHeader[i]
			if (col.filter != undefined && col.filter['_value'] != undefined) {
				if (col.filter['type'] == 'dateRange') {
					// code...
				} else {
					this.logs = this.filter.filterFunction(col.key, col.filter['_value'], this.logs);
				}
			}
		}
	};

	onSort(sortData) {

		var col = sortData.key;
		var reverse = false;
		if (sortData.reverse == true) {
			reverse = true
		}

		this.logs = this.sort.sortByColumn(col, reverse, function (x: any) { return x; }, this.logs);
	};

	trim_Message() {

		if (this.logs != undefined)
			for (var i = 0; i < this.logs.length; i++) {
				var reg = new RegExp(this.logs[i].timestamp, "g");
				this.logs[i].message = this.logs[i].message.replace(reg, '');
				this.logs[i].request_id = this.logs[i].request_id.substring(0, this.logs[i].request_id.length - 1);
				this.logs[i].message = this.logs[i].message.replace(this.logs[i].request_id, '');
			}

	}


	paginatePage(currentlyActivePage) {
		this.expandText = 'Expand all';
		if (this.prevActivePage != currentlyActivePage) {
			this.prevActivePage = currentlyActivePage;
			this.logs = [];
			this.offsetValue = (this.limitValue * (currentlyActivePage - 1));
			this.payload.offset = this.offsetValue;
			this.callLogsFunc();
			/*
			* Required:- we need the total number of records from the api, which will be equal to totalPagesTable.
			* We should be able to pass start number, size/number of records on each page to the api, where,
			* start = (size * currentlyActivePage) + 1
			*/
		}

	}

	resetPayload() {
		this.payload.offset = 0;
		$(".pagination.justify-content-center li:nth-child(2)")[0].click();
		this.callLogsFunc();
	}

	onFilterSelected(filters) {

		this.loadingState = 'loading';
		var filter;
		if (filters[0]) {
			filter = filters[0];
		}
		this.filterloglevel = filter;
		this.payload.type = this.filterloglevel;
		this.resetPayload();
	}

	onClickFilter() {

		//ng2-ion-range-slider

		var slider = document.getElementById('sliderElement');

		slider.getElementsByClassName('irs-line-mid')[0].setAttribute('style', 'border-radius:10px;')
		slider.getElementsByClassName('irs-bar-edge')[0].setAttribute('style', ' background: none;background-color: #ed008c;border-bottom-left-radius:10px;border-top-left-radius:10px;width: 10px;');
		slider.getElementsByClassName('irs-single')[0].setAttribute('style', ' background: none;background-color: #ed008c;left:' + this.sliderPercentFrom + '%');
		slider.getElementsByClassName('irs-bar')[0].setAttribute('style', ' background: none;left:10px;background-color: #ed008c;width:' + this.sliderPercentFrom + '%');
		slider.getElementsByClassName('irs-slider single')[0].setAttribute('style', 'width: 20px;cursor:pointer;top: 20px;height: 20px;border-radius: 50%; background: none; background-color: #fff;left:' + this.sliderPercentFrom + '%');

		slider.getElementsByClassName('irs-max')[0].setAttribute('style', 'background: none');
		slider.getElementsByClassName('irs-min')[0].setAttribute('style', 'background: none');
	}
	getRange(e) {
		this.sliderFrom = e.from;
		this.sliderPercentFrom = e.from_percent;
		this.FilterTags.notifyLogs('filter-TimeRangeSlider',this.sliderFrom);

		var resetdate = this.getStartDate(this.selectedTimeRange, this.sliderFrom);
		this.payload.start_time = resetdate;
		this.resetPayload();

		

	}
	getRangefunc(e){
    
		this.FilterTags.notify('filter-TimeRangeSlider',e);
		
		this.sliderFrom=1;
		this.sliderPercentFrom=1;
		var resetdate = this.getStartDate(this.selectedTimeRange, this.sliderFrom);
		this.callLogsFunc();
		
	  }

	onRangeListSelected(range) {
		this.sliderFrom = 1;
		var resetdate = this.getStartDate(range, this.sliderFrom);
		// this.resetPeriodList(range);
		this.selectedTimeRange = range;
		this.payload.start_time = resetdate;
		this.resetPayload();

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

	getStartDate(filter, sliderFrom) {
		var todayDate = new Date();
		switch (filter) {
			case "Day":
				this.sliderMax = 7;
				var resetdate = new Date(todayDate.setDate(todayDate.getDate() - sliderFrom)).toISOString();
				break;
			case "Week":
				this.sliderMax = 5;
				var resetdate = new Date(todayDate.setDate(todayDate.getDate() - (sliderFrom * 7))).toISOString();
				break;
			case "Month":

				this.sliderMax = 12;
				var currentMonth = new Date((todayDate).toISOString()).getMonth();
				var currentDay = new Date((todayDate).toISOString()).getDate();
				currentMonth++;
				var currentYear = new Date((todayDate).toISOString()).getFullYear();
				var diffMonth = currentMonth - sliderFrom;
				if (diffMonth > 0) {
					var resetYear = currentYear;
					var resetMonth = diffMonth;
				} else if (diffMonth === 0) {
					var resetYear = currentYear - 1;
					var resetMonth = 12;
				} else if (diffMonth < 0) {
					var resetYear = currentYear - 1;
					// var resetMonth = sliderFrom - currentMonth;
					var resetMonth = 12 + diffMonth;
				}
				if (currentDay == 31) currentDay = 30;
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


	onServiceSearch(searchbar) {
		this.logs = this.filter.searchFunction("any", searchbar);
	};

	constructor(private route: ActivatedRoute,
		private request: RequestService,
		private router: Router,
		private cache: DataCacheService,
		private authenticationservice: AuthenticationService,
		@Inject(ComponentFactoryResolver) componentFactoryResolver,private advancedFilters: AdvancedFilterService ,
		private toasterService: ToasterService, private messageservice: MessageService) {
		this.toasterService = toasterService;
		this.http = request;
		this.toastmessage = messageservice;
		this.componentFactoryResolver = componentFactoryResolver;
		var comp = this;
		setTimeout(function(){
			comp.getFilter(advancedFilters);
		},5000);
	}



	callLogsFunc() {
		this.loadingState = 'loading';
		if (this.subscription) {
			this.subscription.unsubscribe();
		}
		this.subscription = this.http.post('/jazz/logs', this.payload).subscribe(
			response => {
				this.logs = response.data.logs;
				if (this.logs.length != 0) {
					var pageCount = response.data.count;
					if (pageCount) {
						this.totalPagesTable = Math.ceil(pageCount / this.limitValue);
					}
					else {
						this.totalPagesTable = 0;
					}
					this.backupLogs = this.logs;
					this.sort = new Sort(this.logs);
					this.loadingState = 'default';
					this.trim_Message();

				} else {
					this.loadingState = 'empty';
				}

			},
			err => {
				this.loadingState = 'error';
				this.errBody = err._body;

				this.errMessage = this.toastmessage.errorMessage(err, "serviceLogs");
				try {
					this.parsedErrBody = JSON.parse(this.errBody);
					if (this.parsedErrBody.message != undefined && this.parsedErrBody.message != '') {
						this.errMessage = this.parsedErrBody.message;
					}
				} catch (e) {
				}
				this.getTime();
				this.errorURL = window.location.href;
				this.errorAPI = environment.baseurl+"/jazz/logs";
				this.errorRequest = this.payload;
				this.errorUser = this.authenticationservice.getUserId();
				this.errorResponse = JSON.parse(err._body);

				this.cache.set('feedback', this.model.userFeedback)
				this.cache.set('api', this.errorAPI)
				this.cache.set('request', this.errorRequest)
				this.cache.set('resoponse', this.errorResponse)
				this.cache.set('url', this.errorURL)
				this.cache.set('time', this.errorTime)
				this.cache.set('user', this.errorUser)
				this.cache.set('bugreport', this.json)

			})
	};
	cancelFilter(event){
		// console.log('event',event);
		// switch(event){
		// 	case 'time-range':{this.adv_filters.onRangeListSelected('Day'); 
		// 	  break;
		// 	}
		// 	case 'time-range-slider':{
		// 		this.getRangefunc(1);
			
		// 	  break;
		// 	}
		// 	case 'account':{this.adv_filters.onaccSelected('Acc 1');
		
		// 	break;
		// 	}
		// 	case 'region':{this.adv_filters.onregSelected('reg 1');
		
		// 	break;
		// 	}
		// 	case 'env':{this.adv_filters.onEnvSelected('prod');
		
		// 	break;
		// 	}
				
		// 	case 'all':{ this.adv_filters.onRangeListSelected('Day'); 
		// 	this.adv_filters.onaccSelected('Acc 1');   
		// 	this.adv_filters.onregSelected('reg 1');
		// 	this.adv_filters.onEnvSelected('prod');
		// 	  break;
		// 	}
		// }
	}
	onFilterSelect(event){
		// alert('key: '+event.key+'  value: '+event.value);
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
			// this.resetPeriodList(range);
			this.selectedTimeRange = event.value;
			this.payload.start_time = resetdate;
			this.resetPayload();
			// this.FilterTags.notify('filter-TimeRange',event.value);
			// this.sendDefaults(event.value); 
			// this.timerangeSelected=event.value;
			// this.sliderFrom =1;
			// this.FilterTags.notify('filter-TimeRangeSlider',this.sliderFrom);        
			// var resetdate = this.getStartDate(event.value, this.sliderFrom);
			// this.resetPeriodList(event.value);
			// this.selectedTimeRange = event.value;
			// this.payload.start_time = resetdate;
			// this.callMetricsFunc();
			// this.adv_filters.setSlider(this.sliderMax);
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
	getTime() {
		var now = new Date();
		this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
			+ ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
	}

	ngOnChanges(x: any) {
		this.route.params.subscribe(
			params => {
				this.env = params.env;
			});
		if (this.env == 'prd')
			this.env = 'prod';
	}

	ngOnInit() {
		var todayDate = new Date();
		//   this.getData();
		this.payload = {
			"service": this.service.name,//"logs", //
			"domain": this.service.domain,//"jazz", //
			"environment": this.env, //"dev"
			"category": this.service.serviceType,//"api",//
			"size": this.limitValue,
			"offset": this.offsetValue,
			"type": this.filterloglevel || "ERROR",
			"end_time": (new Date().toISOString()).toString(),
			"start_time": new Date(todayDate.setDate(todayDate.getDate() - this.sliderFrom)).toISOString()
		}
		this.callLogsFunc();
		this.filter = new Filter(this.logs);
		this.sort = new Sort(this.logs);
	}

}
