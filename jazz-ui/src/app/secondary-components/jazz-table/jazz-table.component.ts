/** 
  * @type Component 
  * @desc table component
  * @author
*/

import { Component, OnInit, Input, ElementRef, Renderer, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Sort } from './jazz-table-sort';
import { Filter } from './jazz-filter';
declare var $:any;

@Component({
    selector: 'jazz-table',
    templateUrl: './jazz-table.component.html',
    styleUrls: ['./jazz-table.component.scss']
})

export class JazzTableComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        elementRef: ElementRef, 
        renderer: Renderer
    ) { }

    filterRequired: boolean = true;
    filter:any;

    @Input() serviceList;
    @Input() backupData;
    @Input() tableHeader;
    @Input() showFilterHeader: boolean = false;
    @Input() sort:Sort;
    @Input() state: string = 'default';
    
    onRowClicked (rowData){
        if (rowData != undefined) {
            if (rowData.link != undefined) {
                this.router.navigateByUrl(rowData.link);
            }
        }
    }
    ngOnInit() {
        // this.backupData = this.serviceList;
        this.sort = new Sort(this.serviceList);  
        this.filter = new Filter(this.serviceList);
    }

    // hemanth //
    selectedtab:string = '';
    serviceName:string;
    DomainName:string;
    rateData = ['Pending approval','Stopped','Active','Deleting','all'];
    
    onSelectedDr(val,filteredCol){
        filteredCol.selectedtab = val;
        this.selectedtab = val;
        this.onServiceChange();
    };
    
    onServiceChange(){
        if(this.selectedtab != 'all'){
            this.serviceList = this.filter.filterFunction("status" , this.selectedtab , this.backupData);
        } else if(this.selectedtab == 'all') {
            this.serviceList = this.filter.filterFunction("status" , "" ,  this.backupData);
        }
        if(this.serviceName){
          this.serviceList  = this.filter.searchFunction("name" , this.serviceName , this.serviceList);
        }
        if(this.DomainName){
             this.serviceList  = this.filter.searchFunction("domain" , this.DomainName , this.serviceList);
        }
        
    };


    sortColumn(column){
        if (column._reverse == undefined) {
        column._reverse = false
        } else{
        column._reverse = !column._reverse
        }
        var col = column.field;
        this.serviceList = this.sort.sortByColumn(col , column._reverse , function(x:any){return x;}, this.serviceList);
    };

    statusFilter(x){

    };
}
// $( document ).ready(function() {
//    var ele = $("tr.filter-row");
//    if(ele.not('.open')){
//     setTimeout(function() { 
//         ele.addClass("hide-content");
//     }, 500);
//    }
//    else{
//     ele.removeClass("hide-content");
//    }
    
// });
