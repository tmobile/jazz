import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'square-checkbox',
  templateUrl: './square-checkbox.component.html',
  styleUrls: ['./square-checkbox.component.scss']
})
export class SquareCheckboxComponent implements OnInit {
  @Input() disabled = false;
  private _value;
  @Output() valueChange = new EventEmitter();

  @Input()
  set value(value) {
    this._value = value;
    this.valueChange.emit(this._value);
  }

  get value() {
    return this._value;
  }

  constructor() {
  }

  ngOnInit() {
  }

  clickCheckbox() {
    if(this.disabled) return;
    this.value = !this.value;
  }

}
