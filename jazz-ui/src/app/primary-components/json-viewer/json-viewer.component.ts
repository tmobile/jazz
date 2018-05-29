import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss']
})
export class JsonViewerComponent implements OnInit {

  @Input() json: any = {};
  @Input() parent = true;
  @Input() parentType: String;
  public type: String;
  public collapseTracker;

  constructor() {
  }

  ngOnInit() {
    console.log('parsing', this.json);
    this.type = this.getType(this.json);
    this.collapseTracker = Object.keys(this.json).map(() => {return true});
  }

  getKeys(obj) {
    return Object.keys(obj);
  }

  getType(input) {
    if (input === null) {
      return 'null'
    } else if (typeof input === 'string') {
      return 'string'
    } else if (typeof input === 'number') {
      return 'number';
    } else if (input.length) {
      return 'array';
    } else if (typeof input === 'object') {
      return 'object';
    }
  }

  hasChildren(input) {
    let inputString = this.getType(input);
    return !(inputString === 'null' ||
      inputString === 'undefined' ||
      inputString === 'string' ||
      inputString === 'number');
  }

  toString(input) {
    if (input === null) {
      return 'null';
    } else if (input === undefined) {
      return 'undefined';
    } else {
      return input;
    }
  }

}
