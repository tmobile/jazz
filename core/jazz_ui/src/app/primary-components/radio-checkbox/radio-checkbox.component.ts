import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'radio-checkbox',
  templateUrl: './radio-checkbox.component.html',
  styleUrls: ['./radio-checkbox.component.scss']
})
export class RadioCheckboxComponent implements OnInit {
  @Input() defaultIndex = 0;
  @Output() onSelect: EventEmitter<boolean> = new EventEmitter<boolean>();

  private _options;
  @Input()
  set options(value) {
      this._options = value;
      this.selected = this.options[this.defaultIndex].value;
  }
  get options() {
      return this._options;
  }

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


  select(value) {
    this.selected = value;
    this.onSelect.emit(value);
  }

}
