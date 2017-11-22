import { Component, OnInit, Input, ElementRef, Renderer, Output, EventEmitter } from '@angular/core';
// import { Sort } from './tmobile-table-sort';

@Component({
  selector: 'table-template',
  templateUrl: './table-template.component.html',
  styleUrls: ['./table-template.component.scss']
})
export class TableTemplateComponent implements OnInit {

  @Input() type: string = '';
  @Input() message: string = '';
	@Input() header: Array<any>;
	@Input() showFilters: boolean = false;
  @Input() state: string = 'default';
  @Input() showPaginationtable: boolean = true;
  @Input() currentlyActive: number = 1;
  @Input() totalPageNum: number = 12;
  @Output() onFilter:EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() refreshData:EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onSort:EventEmitter<any> = new EventEmitter<any>();
  @Output() paginatePage:EventEmitter<number> = new EventEmitter<number>();
  errBody: any;
  error:any;
	parsedErrBody: any;
  errMessage: any;
  response: any;
  err_disp:boolean=true;

	listenFunc: Function;

	getFilterType(column){
		if (column != undefined && column.filter != undefined) {
			return column.filter['type']
		}
		return '';
  }
  
  onRefresh(event){
    this.refreshData.emit(true);
  }

  
  onFilterApplied(filter, column){

    if (column.filter['type'] == 'dropdown' && filter == 'all'){
    	filter = "";
    }
    else{
      column.keyCode = filter.keyCode;
    }

    column.filter._value = filter;

    this.onFilter.emit(column);
  };

  mySort(col, rev){
    if (col._reverse == undefined) {
      col._reverse = false;
    } else{
      if(rev){
        col._reverse = rev;
      }
      else{
        col._reverse = !col._reverse;
      }
    }
    return col._reverse;
  }

  onSortColumn(col, rev){
    for (var i = 0; i < this.header.length; i++) {
      var colSort = this.header[i];
      // console.log("colSort.label",colSort.label);
      // console.log("col.label",col.label);
      if (colSort.label == col.label) {
        colSort._reverse = this.mySort(col, rev);
        col._reverse = colSort._reverse;
      }
      else{
        colSort._reverse = undefined;
      }
    }
    this.onSort.emit({key:col.key, reverse: col._reverse})
  };
   paginatePageInTable(clickedPage){
     switch(clickedPage){
      case 'prev':
        if(this.currentlyActive > 1)
          this.currentlyActive = this.currentlyActive - 1;
        break;
      case 'next':
        if(this.currentlyActive < this.totalPageNum)
          this.currentlyActive = this.currentlyActive + 1;
        break;
      case '1':
        this.currentlyActive = 1;
        break;
      default:
        if(clickedPage > 1){
          this.currentlyActive = clickedPage;
        }
     }
     this.paginatePage.emit(this.currentlyActive);
   }
  // onSortColumn(key, reverse){
  // 	this.onSort.emit({key:key, reverse: (reverse || false)})
  // };

  constructor(elementRef: ElementRef, renderer: Renderer) { }

  ngOnInit() {
		for (var i = 0; i < this.header.length; i++) {
			var col = this.header[i]
			if (col.filter != undefined && col.filter['type'] == 'dropdown' && col.filter['data'] != undefined) {
        col.filter['data'].unshift('all')
        col.filter['value'] = 'all';
        
      }
    }
    
    if(this.message == undefined)
      {
        this.err_disp = false;
      }
      else{this.err_disp=true;}
    
  }

}
