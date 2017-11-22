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

  constructor() { }
  
  onServiceSearch(searchString,searchVal){
    var keyCodeVal;
    if(searchString.keyCode){
      keyCodeVal = searchString.keyCode;
      searchString = searchVal
    }
    this.onChange.emit({"searchString":searchString,"keyCode":keyCodeVal});
  };

  ngOnInit() {
  }

}
