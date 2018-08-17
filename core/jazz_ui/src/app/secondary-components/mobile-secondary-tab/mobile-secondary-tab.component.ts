import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'mobile-secondary-tab',
  templateUrl: './mobile-secondary-tab.component.html',
  styleUrls: ['./mobile-secondary-tab.component.scss']
})
export class MobileSecondaryTabComponent implements OnInit {

  @Input() tabList: Array<string> = [];

  @Output() mobSecClicked:EventEmitter<number> = new EventEmitter<number>();

	
	thisIndex:number=1;

  constructor() { }

  ngOnInit() {
  	
  }

  changeIndex = function (index) {
  	this.thisIndex = index;
  
    this.mobSecClicked.emit(this.thisIndex);
    
  }

}
