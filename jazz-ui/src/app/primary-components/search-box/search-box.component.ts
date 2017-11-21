import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {

  @Input() searchString: string="";
  @Output() onChange:EventEmitter<boolean> = new EventEmitter<boolean>();
  searchActive: boolean;
  searchbar: string;

  constructor() { }
  
  onServiceSearch(searchString){
    this.onChange.emit(searchString);
  };

  ngOnInit() {
  }

}
