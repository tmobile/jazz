import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as _ from "lodash";

@Component({
  selector: 'filter-metrics',
  templateUrl: './filter-metrics.component.html',
  styleUrls: ['./filter-metrics.component.scss']
})
export class FilterMetricsComponent implements OnInit {
  @Output() formChange = new EventEmitter();
  @Input() fields;
  @Input() options;

  public form = {
    columns: []
  };
  public isReverse: boolean;

  constructor() {
  }

  ngOnInit() {
    this.initialize();
  }
  initialize(updatedFields?) {
    if (updatedFields) {
      this.fields = updatedFields;
    }
    let columns = _(this.fields)
      .groupBy('column')
      .map((column, key, array) => {
        return {
          label: key,
          fields: column,
        }
      })
      .value();

    this.form.columns = columns;
    }
  setFields(value) {
    this.fields = value;
    let columns = _(this.fields)
      .groupBy('column')
      .map((column, key, array) => {
        return {
          label: key,
          fields: column
        }
      })
      .value();
    this.form.columns = columns;
  }

  reset() {
    this.ngOnInit();
  }

  changeFilter(filterSelected, filterField) {
    filterField.selected = filterSelected;
    this.formChange.emit(filterField);
  }

  getFieldValueOfLabel(fieldLabel) {
    try {
      let foundField = this.getAllFields().find((field) => {
        return field.label === fieldLabel
      });
      let value = foundField.values[foundField.options.findIndex((option) => {
        return option === foundField.selected;
      })];

      return value;
    } catch(error) {
      return null;
    }
  }

  getAllFields() {
    return this.form.columns.reduce((accumulator, column) => {
      return accumulator.concat(column.fields)
    }, []);
  }

  addField(column, label, options, values?, defaultOption?) {
    let columnIndex = _.findIndex(this.form.columns, {label: column});
    if(!~columnIndex) {
      this.form.columns.push({
        label: column,
        fields: []
      });
      columnIndex = this.form.columns.length - 1;
    }
    let selected = options[0];
    if(defaultOption) {
      let foundDefault = _.find(options, (option) => {return option === defaultOption});
      selected = foundDefault;
    }

    let field = {
      column: column,
      label: label,
      options: options,
      values: values || options,
      selected: selected
    };
    this.form.columns[columnIndex].fields.push(field);
  }

  removeField(column, label) {
    let columnIndex = _.findIndex(this.form.columns, {label: column});
    if (columnIndex >= 0) {
      let fieldIndex = _.findIndex(this.form.columns[columnIndex].fields, {label: label});
      if(fieldIndex >= 0) {
        this.form.columns[columnIndex].fields.splice(fieldIndex, 1);
      }
    }
  }

  reverseToolbar () {
    if (typeof this.isReverse === 'undefined') this.isReverse = true;
  }
}
