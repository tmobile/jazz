import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'radio-checkbox',
  templateUrl: './radio-checkbox.component.html',
  styleUrls: ['./radio-checkbox.component.scss']
})
export class RadioCheckboxComponent implements OnInit {
  @Input() options;
  private _selected;
  @Output() selectedChange = new EventEmitter();
  @Input()
  set selected(value) {
      this._selected = value;
      this. selectedChange.emit(this._selected);
  }
  get selected() {
      return this._selected;
  }
  constructor() { }

  ngOnInit() {
  }

  select(option) {
    if(option.disabled) return;
    this.selected = option.value;
  }

}
