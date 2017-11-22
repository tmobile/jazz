import { Component, OnInit, Input } from '@angular/core';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';

@Component({
  selector: 'env-logs-section',
  templateUrl: './env-logs-section.component.html',
  styleUrls: ['./env-logs-section.component.scss']
})
export class EnvLogsSectionComponent implements OnInit {

  @Input() service: any = {};

	tableHeader = [
		{
			label: 'Time',
			key: 'time',
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
			key: 'requestId',
			sort: true,
			filter: {
				type: ''
			}
		},{
			label: 'Log Level',
			key: 'logLevel',
			sort: true,
			filter: {
				type: 'dropdown',
				data: ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG']
			}
		}
	]

	logs = []

	logsData = []

	filtersList = ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG']

	filterSelected: Boolean = false;
	searchActive: Boolean = false;
	searchbar: string = '';
	filter:any;
	sort:any;

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
		this.logs = this.logsData

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

	onFilterSelected(selectedList){
		this.onFilter({})
		this.logs = this.filter.filterListFunction('logLevel' , selectedList, this.logs);
	}

  
  onServiceSearch(searchbar){
    this.logs  = this.filter.searchFunction("any" , searchbar);
  };

  constructor() { }

  ngOnInit() {
  	this.logs = this.logsData;
		this.filter = new Filter(this.logsData);
    this.sort = new Sort(this.logsData);
  }

}
