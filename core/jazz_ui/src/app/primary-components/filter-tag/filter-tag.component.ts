/**
  * @type Component
  * @desc Generic dropdowns element
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';


@Component({
  selector: 'filter-tag',
  templateUrl: './filter-tag.component.html',
  styleUrls: ['./filter-tag.component.scss']
})
export class FilterTagComponent implements OnInit {

  allFilterTags = [];
  checkboxFilterTags = [];
  checkboxfiltertagsObj = {};
  filterCount:number = 0;
  @Output() filterCancelled:EventEmitter<boolean> = new EventEmitter<boolean>();


  constructor() { }

  getFilter(filterObj){
    this.manageFilters(filterObj);
  }

  cancelClicked(item){
    for( let i = 0; i < this.allFilterTags.length; i++){
      if ( this.allFilterTags[i] === item) {
        this.allFilterTags.splice(i, 1);
      }
    }
    for( let i = 0; i < this.checkboxFilterTags.length; i++){
      if ( this.checkboxFilterTags[i] === item) {
        this.checkboxFilterTags.splice(i, 1);
      }
    }
    this.filterCancelled.emit(item);
  }


  fillCheckboxTags(filterObj){
    this.filterCount = 0;
    this.checkboxFilterTags = [];
    this.checkboxfiltertagsObj[filterObj.label]=[]
    let selectedF = filterObj.selected;
    if ( typeof selectedF === 'object') {
      for (let i in filterObj.values) {
        if(selectedF[filterObj.values[i]]) {
          this.filterCount++;
          this.checkboxfiltertagsObj[filterObj.label].push({
            'key': filterObj.label,
            'value': filterObj.values[i]
          });
        }
      }
      // if(!this.filterCount){
      //   this.checkboxfiltertagsObj[filterObj.label].push({
      //     'key': filterObj.label,
      //     'value': 'All'
      //   });
      // }
    }
    let keys = Object.keys(this.checkboxfiltertagsObj);
    for(let i=0; i<keys.length; i++){
      this.checkboxFilterTags.push(this.checkboxfiltertagsObj[keys[i]]);
    }
    this.checkboxFilterTags = [].concat.apply([], this.checkboxFilterTags);
  }

  manageFilters(filterObj){
    if(filterObj){

      if(filterObj.type === 'checkbox'){
        this.fillCheckboxTags(filterObj);
      }
      else{
        let selectedF = filterObj.selected;
        if(filterObj.selected !== "All"){
          if(this.allFilterTags.length === 0){
            this.allFilterTags.push({
              'key': filterObj.label,
              'value': filterObj.selected
            });
          }
        }
        for(let i in this.allFilterTags){
          if (this.allFilterTags[i].key === filterObj.label){
            this.allFilterTags[i].value = filterObj.selected;
          }
          else{
            this.allFilterTags.push({
              'key': filterObj.label,
              'value': filterObj.selected
            });
          }

        }
      }
    }

  }



  ngOnInit() {
  }

}
