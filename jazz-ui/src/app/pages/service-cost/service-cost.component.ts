import { Component, OnInit, ElementRef ,EventEmitter, Output, Inject, Input} from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { RequestService, MessageService } from '../../core/services/index';
import { Router } from '@angular/router';


@Component({
  selector: 'service-cost',
  templateUrl: './service-cost.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./service-cost.component.scss']
})
export class ServiceCostComponent implements OnInit {

	@Input() service: any = {};
	 private subscription:any;

	cost = {
		perYear: {
			value: '0.00',
			currency: '$',
			date:''
		},
		perDay: {
			value: '0.00',
			currency: '$',
			date:''
		},
		efficiency: '83',
		perWeek: {
			value: '0.00',
			currency: '$',
			date:''
		},
		perMonth: {
			value: '0.00',
			currency: '$',
			date:''
		}
	}

	today = new Date();
	yesterday = this.today.setDate(this.today.getDate()-1);

	filtersList = ['Day', 'Week', 'Month', 'Year']
	selected=['Day']
	filter: any;
	sort: any;
	errBody: any;
	parsedErrBody: any;
	errMessage: any;

	environment = 'dev';
	environmentList = ['prod', 'dev'];
	filterSelected: boolean = false;
	private http:any;
	serviceCostList=[];
	env =this.environmentList[0];
	interval:any;
	start_date:any;
	isGraphLoading:boolean=true;
	isDataNotAvailable:boolean=false;
	noTotalCost:boolean=true;
	loadingState:string='default';

	private toastmessage:any;
	noYearlyCost:boolean=true;
	noDailyCost:boolean=true;

	costGraphData = {
		'filter': 'filter1',
		'environment': this.env
	}

	costTableData = {
		'filter': 'filter1',
		'environment': 'dev',
		'body': [
			{ column1: 'Data 1 row1', column2: 'Data 2 row1', column3: 'Data 3 row1', column4: 'Data 4 row1', column5: 'Data 5 row1'},
			{ column1: 'Data 1', column2: 'Data 2', column3: 'Data 3', column4: 'Data 4', column5: 'Data 5'},
			{ column1: 'Data 1', column2: 'Data 2', column3: 'Data 3', column4: 'Data 4', column5: 'Data 5'},
			{ column1: 'Data 1 row4', column2: 'Data 2 row4', column3: 'Data 3 row4', column4: 'Data 4 row4', column5: 'Data 5 row4'},
			{ column1: 'Data 1', column2: 'Data 2', column3: 'Data 3', column4: 'Data 4', column5: 'Data5'}
		],
		'header': [
			{"label" : "Column 1","key" : "column1"},
			{"label" : "Column 2","key" : "column2"},
			{"label" : "Column 3","key" : "column3"},
			{"label" : "Column 4","key" : "column4"},
			{"label" : "Column 5","key" : "column5"}
		]
	}



	constructor( @Inject(ElementRef) elementRef: ElementRef, private request: RequestService, private messageservice: MessageService, private toasterService: ToasterService,private router: Router) {

		var el:HTMLElement = elementRef.nativeElement;
    	this.root = el;
		this.toasterService = toasterService;
		this.http = request;
		this.toastmessage=messageservice;
	}
	ngOnChanges(x:any){

	}
	onEnvSelected(env){
		this.env = env;
		this.collectInputData(env);
	}

	onRowClicked(row){
	}

  onServiceSearch(searchString){
    this.costTableData.body  = this.filter.searchFunction("any" , searchString);
  };
	root:any;


	popToast(type, title, message) {
		var tst = document.getElementById('toast-container');
        tst.classList.add('toaster-anim'); 
		
	  this.toasterService.pop(type, title, message);
	  setTimeout(() => {
		tst.classList.remove('toaster-anim');
	  }, 7000);
  }

  processServiceList(serviceCost,serviceInput){
	if (serviceCost === undefined || serviceCost.cost.length === undefined) {
		return [];
	}
	let _serviceCostList = [];

	serviceCost.cost.forEach(function _processassets(eachCostObj){
		var monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug", "Sep", "Oct","Nov","Dec"];
		var modifiedkey = eachCostObj.key;
		modifiedkey = modifiedkey.replace(/[-]/g, '/');
		var eachDate=new Date(modifiedkey);
		var monthIndex=eachDate.getMonth();
		let graphDataDate="";
		switch(serviceInput.interval){
		case "Daily":
		 graphDataDate=monthName[monthIndex]+" "+eachDate.getDate();
		  break;
		case "Weekly":
		 graphDataDate=monthName[monthIndex]+" "+eachDate.getDate();
		  break;
		case "Monthly":
		 graphDataDate=monthName[monthIndex];
		  break;
		case "Yearly":
		 graphDataDate=eachDate.getFullYear().toString();
		  break;
		}

		let serviceRow = {
			date: graphDataDate,
			cost: eachCostObj.cost.toFixed(5)
		};
		_serviceCostList.push(serviceRow);

	});

    return _serviceCostList;
  	}

  	fetchServices(inputParams){
		var payload = {
			"start_date": inputParams[0].startDate,
			"end_date": new Date().toISOString().substring(0,10),
			"service": this.service.name || "events",
			"environments":[inputParams[0].env],
			"domain":this.service.domain || "platform",
			"interval": inputParams[0].setInterval,
			"group_by":["environments"]
		};
		let mockCost:any = {
			"data": {
				"totalCostYear": {
					"key": "2017-04-01 00:00:00",
					"cost": 0.36712248072083753
				},
				"totalCostMonth": {
					"key": "2017-10-01 00:00:00",
					"cost": 0.014299193244525554
				},
				"totalCostWeek": {
					"key": "2017-10-09 00:00:00",
					"cost": 0.008796081443250614
				},
				"totalCostDay": {
					"key": "2017-10-09 00:00:00",
					"cost": 0.0018929634201185763
				},
				"cost": [
					{
						"key": "2017-07-31 00:00:00",
						"cost": 0.015356270021641194
					},
					{
						"key": "2017-08-07 00:00:00",
						"cost": 0.01665646010008004
					},
					{
						"key": "2017-08-14 00:00:00",
						"cost": 0.027630850040580412
					},
					{
						"key": "2017-08-21 00:00:00",
						"cost": 0.018311100101826128
					},
					{
						"key": "2017-08-28 00:00:00",
						"cost": 0.016806625976300893
					},
					{
						"key": "2017-09-04 00:00:00",
						"cost": 0.00019572208466726693
					},
					{
						"key": "2017-09-11 00:00:00",
						"cost": 0.0029940571347196965
					},
					{
						"key": "2017-09-18 00:00:00",
						"cost": 0.00015370311081682075
					},
					{
						"key": "2017-09-25 00:00:00",
						"cost": 0.0001795176893706696
					},
					{
						"key": "2017-10-02 00:00:00",
						"cost": 0.00011646751236042974
					},
					{
						"key": "2017-10-09 00:00:00",
						"cost": 0.000018929634201185763
					}
				]
			},
			"input": {
				"start_date": "2017-08-01",
				"end_date": "2017-10-10",
				"service": "events",
				"environments": [
					"prod"
				],
				"domain": "platform",
				"interval": "Weekly",
				"group_by": [
					"environments"
				]
			}
		};
				let serviceCost:any = mockCost.data;
				let serviceInput:any = mockCost.input;
			
			if(serviceCost.totalCostDay !== undefined && serviceCost.totalCostMonth !== "" && serviceCost.totalCostWeek !== "" && serviceCost.totalCostYear !== "" && serviceCost.totalCostDay !== undefined && serviceCost.totalCostMonth !== undefined && serviceCost.totalCostWeek !== undefined && serviceCost.totalCostYear !== undefined){
				this.cost.perDay.value = serviceCost.totalCostDay.cost.toFixed(2).toString();
				this.cost.perDay.date = serviceCost.totalCostDay.key.substring(0,10);;
				this.cost.perWeek.value = serviceCost.totalCostWeek.cost.toFixed(2).toString();
				this.cost.perWeek.date = serviceCost.totalCostWeek.key.substring(0,10);;
				this.cost.perMonth.value = serviceCost.totalCostMonth.cost.toFixed(2).toString();
				this.cost.perMonth.date = serviceCost.totalCostMonth.key.substring(0,10);;
				this.cost.perYear.value = serviceCost.totalCostYear.cost.toFixed(2).toString();
				this.cost.perYear.date = serviceCost.totalCostYear.key.substring(0,4);
				this.noTotalCost = false;
			} else {
				this.noTotalCost = true;
			}
          if (serviceCost !== undefined && serviceCost.cost.length !== 0 ) {
			  this.noTotalCost = false;
			  

			this.serviceCostList = this.processServiceList(serviceCost, serviceInput);
			this.isGraphLoading=false;
			this.isDataNotAvailable=false;
			this.loadingState = 'default';
          } else if(serviceCost.cost.length === 0 ){
			this.noTotalCost = true;
			this.isGraphLoading=false;
			this.isDataNotAvailable=true;
			this.loadingState = 'default';
          } else{
			this.noTotalCost = true;
			this.isGraphLoading=true;
		  }
	};
	refreshCostData(event){
		this.isGraphLoading=true;
		this.isDataNotAvailable=false;
		this.loadingState = 'default';
		this.fetchGraphData('Day');
	}

	ngOnInit() {
		this.filter = new Filter(this.costTableData.body);
		this.sort = new Sort(this.costTableData.body);
		this.fetchGraphData("Day");
	}
	collectInputData(input){
		this.isDataNotAvailable=false;
		this.loadingState = 'default';
		this.isGraphLoading=true;

		//collect data from filter and dropdown onchange
		var filteredData=[];
		if(input!=undefined && input=="dev" || input =="stg"||input == "prod"){
			this.env = input;
		} else{
			this.start_date = input[0].start_date;
			this.interval = input[0].interval;
		}
		let dataCollect={
			env : this.env,
			startDate : this.start_date,
			setInterval : this.interval
		}
		filteredData.push(dataCollect);
		this.fetchServices(filteredData);
	}

    fetchGraphData(range){
		//Based on filter selected generate start date and interval params for payload
		
		var graphDataInterval =[];
		var todayDate = new Date();
		var graphDataList = ["Daily", "Weekly", "Monthly",  "Yearly"];
		switch(range){
			case "Day":
			var resetdate = new Date(todayDate.setDate(todayDate.getDate()-6)).toISOString().substring(0, 10);
			var filteredData={
					start_date: resetdate,
					interval:graphDataList[0]
				}
				graphDataInterval.push(filteredData);
				break;

			case "Week":
			var  resetdate = new Date(todayDate.setDate(todayDate.getDate()-(7*6))).toISOString().substring(0, 10);
			var filteredData={
					start_date: resetdate,
					interval:graphDataList[1]
				}
				graphDataInterval.push(filteredData);
				break;

			case "Month":
			var currentMonth = new Date ((todayDate).toISOString().substring(0, 10)).getMonth();
			var currentYear = new Date ((todayDate).toISOString().substring(0, 10)).getFullYear();
			if(++currentMonth>6){
				var resetMonth = (currentMonth) - 6;
				var resetYear = currentYear;
			} else{
				var resetMonth= (currentMonth) + 6;
				var resetyear = --currentYear;
			}
			var resetdate = ""+resetYear+"-"+resetMonth+"-01 00:00:00"
				var filteredData={
					start_date: resetdate,
					interval: graphDataList[2]
				}
				graphDataInterval.push(filteredData);
				break;

			case "Year":
				var currentYear = new Date((todayDate).toISOString().substring(0, 10)).getFullYear();
				var resetdate = ""+(currentYear-6)+"-01-01"+" "+"00:00:00";
				var filteredData={
					start_date: resetdate,
					interval: graphDataList[3]
				}
				graphDataInterval.push(filteredData);
				break;
		}

		this.collectInputData(graphDataInterval);
  }

  onTypeSelected(event){}

	onFilterSelected(filters){
		var filter ;
		if (filters[0]) {
			filter = filters[0];
		}
			this.fetchGraphData(filter);
	}

}
