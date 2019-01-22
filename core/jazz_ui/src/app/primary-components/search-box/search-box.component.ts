import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {

  @Input() searchString: any;
  @Output() onChange:EventEmitter<any> = new EventEmitter<any>();
  searchActive: boolean;
  searchbar: string;
  searchval:any;
  keyCodeVal: any;

  constructor() { }
  clearSearchbox(value){
    this.searchbar=value;
  }
  onServiceSearchkey(searchString,searchVal){
    if(searchVal) {
      if (searchString.keyCode) {
        this.keyCodeVal = searchString.keyCode;
        searchString = searchVal
      }
  
      if (this.keyCodeVal == "13") {
        this.searchval = searchVal;
        searchString = this.searchval;
        if (searchVal == "") {
          this.keyCodeVal = 13;
        }
        this.onChange.emit({ "searchString": searchString, "keyCode": this.keyCodeVal })
      }
    }
  };
  
  onServiceSearchngModel(searchString,searchVal){
      this.searchval = searchVal;
      searchString = this.searchval;
    if(searchVal == ""){
      this.keyCodeVal = 13;
    }
     this.onChange.emit({"searchString":searchString,"keyCode":this.keyCodeVal})
  };

 

  ngOnChanges(x:any){

}

  ngOnInit() {
  }

}
