/**
  * @type Component
  * @desc Generic dropdowns element
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges} from '@angular/core';


@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit, OnChanges {

  @Input() dropdwnContent;
  @Input() IsEnvList:boolean=false;

  @Input() selected;
  @Input() type;
  @Input() rtl;
  @Input() defaultIndex;
  @Input() public statusFilter: Function;
  @Output() onSelected:EventEmitter<boolean> = new EventEmitter<boolean>();

  onDropdownClick(selected){
    this.onSelected.emit(selected)
    this.selected = selected;
  }
  onDropdownOpen(){
  }
  onDropdownClose(){
  }
  notifyDropdown(value){
    this.selected = value;
    this.onSelected.emit(value)

  }
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.type === 'ASSET TYPE' || this.type === 'ENVIRONMENT')
      return;
    const dropdwnContent = changes['dropdwnContent'];
    if(dropdwnContent) {
      // on content change, selecting first value by default
      const cur  = JSON.stringify(dropdwnContent.currentValue);
      const prev = JSON.stringify(dropdwnContent.previousValue);
      if (cur !== prev) {
        this.selected = dropdwnContent.currentValue &&
          dropdwnContent.currentValue[this.defaultIndex || 0];
      }
    }
  }

}
