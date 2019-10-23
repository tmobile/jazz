import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
// import {IonRangeSliderModule} from 'ng2-ion-range-slider';
import { CheckboxGroupComponent } from './../../primary-components/checkbox-group/checkbox-group.component';
import { CheckboxGroupRegionComponent } from './../../primary-components/checkbox-group-region/checkbox-group-region.component';

import * as _ from "lodash";


@Component({
  selector: 'filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent implements OnInit {
  @Output() formChange = new EventEmitter();
  @Input() fields;
  @Input() options;
  @Input() assetList;
  @Input() slsapp;
  // @ViewChild('sliderElement') sliderElement: IonRangeSliderModule;
  @ViewChild('checkboxGroup') checkboxGroup: CheckboxGroupComponent;
  @ViewChild('checkboxGroupRegion') checkboxGroupRegion: CheckboxGroupRegionComponent;



  multiColumns: boolean = false;
  sliderMax: number = 7;
  sliderPercentFrom: number = 0;

  public form = {
    columns: []
  };
  public opened = false;
  public data: any;

  constructor() {
  }

  getRange(e) {

  }
  reOrderFilterColumns() {
    let columnA = this.form.columns[0];
    let columnB = this.form.columns[1];
    let columnt;

    columnt = columnA;
    columnA = columnB;
    columnB = columnt;

    this.form.columns[0] = columnA;
    this.form.columns[1] = columnB;
  }
  ngOnChanges() {
    this.initialize();
  }
  ngOnInit() {
    this.initialize()
  }

  paintCheckboxes() {

  }

  reset() {
    this.initialize();
  }

  resetFiltersAfterCancel(updatedFields) {
    this.checkboxGroup.reset(updatedFields.selected, updatedFields.options);
  }

  resetFiltersAfterRegionCancel(updatedFields) {
    this.checkboxGroupRegion.resetRegion(updatedFields.selected, updatedFields.options);

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
          fields: column
        }
      })
      .value();

    this.form.columns = columns;
    if (columns.length > 1) {
      if (columns.length > 2) {
        this.multiColumns = true;
      }
    }


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

  changeFilter(filterSelected, filterField) {
    filterField.selected = filterSelected;
    this.formChange.emit(filterField);
  }

  changeCheckboxFilter(filterSelected, filterField) {
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
    } catch (error) {
      return null;
    }
  }

  getAllFields() {
    return this.form.columns.reduce((accumulator, column) => {
      return accumulator.concat(column.fields)
    }, []);
  }

  toggleModal() {
    this.opened = !this.opened;
  }

  addField(column, label, options, type, values?, defaultOption?) {
    let columnIndex = _.findIndex(this.form.columns, { label: column });
    if (!~columnIndex) {
      this.form.columns.push({
        label: column,
        fields: []
      });
      columnIndex = this.form.columns.length - 1;
    }
    let selected = options[0];
    if (defaultOption) {
      let foundDefault = _.find(options, (option) => { return option === defaultOption });
      selected = foundDefault;
    }

    let field = {
      column: column,
      label: label,
      options: options,
      type: type,
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
}
