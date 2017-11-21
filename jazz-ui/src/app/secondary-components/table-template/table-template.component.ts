import { Component, OnInit, Input, ElementRef, Renderer, Output, EventEmitter } from '@angular/core';
// import { Sort } from './tmobile-table-sort';

@Component({
  selector: 'table-template',
  templateUrl: './table-template.component.html',
  styleUrls: ['./table-template.component.scss']
})
export class TableTemplateComponent implements OnInit {

	@Input() type: string = '';
	@Input() header: Array<any>;
	@Input() showFilters: boolean = false;
  @Input() state: string = 'default';
  @Output() onFilter:EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onSort:EventEmitter<any> = new EventEmitter<any>();

	listenFunc: Function;

	getFilterType(column){
		if (column != undefined && column.filter != undefined) {
			return column.filter['type']
		}
		return '';
	}
  
  onFilterApplied(filter, column){
    if (column.filter['type'] == 'dropdown' && filter == 'ALL'){
    	filter = "";
    }

    column.filter._value = filter;

    this.onFilter.emit(column);
  };

  onSortColumn(col){
    if (col._reverse == undefined) {
      col._reverse = false
    } else{
      col._reverse = !col._reverse
    }
    this.onSort.emit({key:col.key, reverse: col._reverse})
  };

  // onSortColumn(key, reverse){
  // 	this.onSort.emit({key:key, reverse: (reverse || false)})
  // };

  constructor(elementRef: ElementRef, renderer: Renderer) { }

  ngOnInit() {
		for (var i = 0; i < this.header.length; i++) {
			var col = this.header[i]
			if (col.filter != undefined && col.filter['type'] == 'dropdown' && col.filter['data'] != undefined) {
        col.filter['data'].unshift('ALL')
    		col.filter['value'] = 'ALL'
			}
		}
  }

}
