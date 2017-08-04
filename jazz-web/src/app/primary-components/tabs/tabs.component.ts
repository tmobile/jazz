/** 
  * @type Component 
  * @desc Generic tab element
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';

@Component({
  selector: 'tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  @Input() tabData;
  @Input() selectedTab;
  @Input() public tabChanged: Function;
  @Output() onSelected:EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  onDropdownClick(index){
    this.onSelected.emit(index)
    this.selectedTab = index;
  }

  ngOnInit() {
  }

}
