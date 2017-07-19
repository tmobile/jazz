import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent implements OnInit {

	filters: Array<{id:number, label:string, selected: boolean}> = [];
  @Input() multiple: boolean = true;
  @Input() filtersList: Array<string>;
  @Input() selectedList: Array<string> = [];
  @Output() onSelected:EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  constructor() { }

  onClick(index){
    let selectedList = [];
    for (var item of this.filters){
    	if (item.id == index) {
        if (this.multiple == false) {
    		  item.selected = true;
        } else{
          item.selected = !(item.selected);
        }
    	} else{
        if (this.multiple == false) {
          item.selected = false;
        }
      }
    	if (item.selected == true) {
    		selectedList.push(item.label);
    	}
    }
    this.selectedList = selectedList;
    // for (var i = 0; i < this.filters.length; ++i) {
    // 	let item = this.filters[i]
    // 	if (i == index) {
	   //  	if (item.selected == true) {
	   //  		item.selected = false;
	   //  	} else{
	   //  		item.selected = true;
	   //  	}
    // 	}
    // 	if (item.selected == true) {
    // 		selectedList.push(item.label)
    // 	}
    // }
    this.onSelected.emit(this.selectedList);
  }

  ngOnInit() {
  	if (this.filtersList) {
  		for (var i = 0; i < this.filtersList.length; ++i) {
  			let isSelected = false;
  			let label = this.filtersList[i];
  			if (label in this.selectedList) {
			  	isSelected = true;
			  }
  			let item = {
  				id: i,
  				label: label,
  				selected: isSelected
  			}
  			this.filters.push(item);
  		}
  	}
  }

}
