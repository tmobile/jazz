import { Component, OnInit } from '@angular/core';
import { Filter } from '../../secondary-components/tmobile-table/tmobile-filter';
import { Sort } from '../../secondary-components/tmobile-table/tmobile-table-sort';

@Component({
  selector: 'service-cost',
  templateUrl: './service-cost.component.html',
  styleUrls: ['./service-cost.component.scss']
})
export class ServiceCostComponent implements OnInit {

	cost = {
		perYear: {
			value: '2.1M',
			currency: '$'
		},
		perDay: {
			value: '2.94',
			currency: '$'
		},
		efficiency: '83'
	}

	filtersList = ['filter 1', 'filter 2', 'filter 3', 'filter 4', 'filter 5']
	filter: any;
	sort: any;
	environment = 'dev';
	environmentList = ['dev', 'stg', 'prd'];
	filterSelected: boolean = false;

	costGraphData = {
		'filter': 'filter1',
		'environment': 'dev'
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

	onEnvSelected(env){
		console.log('onEnvSelected',env);
	}

	onRowClicked(row){
		console.log('onRowClicked',row);
	}

  onServiceSearch(searchString){
  	console.log("onServiceSearch", searchString)
    this.costTableData.body  = this.filter.searchFunction("any" , searchString);
  };

  constructor() { }

  ngOnInit() {
		this.filter = new Filter(this.costTableData.body);
    this.sort = new Sort(this.costTableData.body);  
  }

}
