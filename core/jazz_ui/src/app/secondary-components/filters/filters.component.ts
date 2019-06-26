// enhancement for logs filters done 
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
  @Input() logs:boolean;
  @Input() selectedList: Array<string> = [];
  @Output() onSelected:EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  constructor() { }

  onClick(index){
       let selectedList = [];

    if(this.logs){
      for(var item of this.filters){
        item.selected=false;
      }
      var i = index;
      while(i>=0){
        this.filters[i].selected=true;
        i--;
      }
      selectedList.push(this.filters[index].label);
      this.selectedList=selectedList;

      this.onSelected.emit(this.selectedList);

      return;

    }
    
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
  
    this.onSelected.emit(this.selectedList);
  }

  ngOnInit() {
  
  	if (this.filtersList) {

  		for (var i = 0; i < this.filtersList.length; ++i) {
  			let isSelected = false;
        let label = this.filtersList[i];
        
  			if (this.selectedList.indexOf(label) >= 0) {
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
