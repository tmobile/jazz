import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'radio-panels',
  templateUrl: './radio-panels.component.html',
  styleUrls: ['./radio-panels.component.scss']
})
export class RadioPanelsComponent implements OnInit {
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

  select(value) {
    this.selected = value;
  }

}
