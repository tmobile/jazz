/**
  * @type Component
  * @desc Generic Radio group element
  * @author Sughosh
*/

import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';


@Component({
  selector: 'radio-group',
  templateUrl: './radio-group.component.html',
  styleUrls: ['./radio-group.component.scss']
})
export class RadioGroupComponent implements OnInit {

  @Input() radioContent;
  @Input() IsEnvList:boolean=false;

  @Input() selected;
  @Input() idName;
  @Input() public statusFilter: Function;
  @Output() onRadioSelected:EventEmitter<boolean> = new EventEmitter<boolean>();

  itemselected = "all";
  onSelectionChange(value){
    this.selected = value;
    this.onRadioSelected.emit(value)
  }

  setRadio(value){
    this.selected = value;
  }

  constructor() { }

  ngOnInit() {
  }



}
