import {Component, Input, OnInit, ViewChildren} from '@angular/core';

@Component({
  selector: 'json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss']
})
export class JsonViewerComponent implements OnInit {

  @Input() json: any = {};
  @Input() root = true;
  @Input() parent;
  @ViewChildren('jsonChild') jsonChildren;
  public rowTracker;

  constructor() {
  }

  ngOnInit() {
    this.rowTracker = Object.keys(this.json).map((key) => {
      return {
        key: key,
        collapsed: true,
        children: this.hasChildren(this.json(key)),
        value: this.toString(this.json[key]),
        collapsedSymbol: this.isArray(this.json(key)) ? '[ . . . ]' : '{ . . . }'
      }
    });
  }

  setCollapse(flag) {
    this.rowTracker.forEach((row) => {
      row.collapsed = flag;
    });
    this.jsonChildren.forEach((jsonChild) => {
      jsonChild.setCollapse(flag);
    });
  }

  getKeys(obj) {
    return Object.keys(obj);
  }

  hasChildren(input) {
    try {
      return Object.keys(input).length;
    } catch(error) {
      return false;
    }
  }

  isArray(input) {
    return this.hasChildren(input) &&
      input.length &&
      typeof input.length === 'number';
  }

  toString(input) {
    if(input === null) {
      return null;
    } else if (input === undefined) {
      return 'undefined';
    } else if (this.isArray(input)) {
      return '[]';
    } else if(typeof input === 'object') {
      return '{}';
    } else {
      return input
    }
  }

}
