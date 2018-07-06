import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent implements OnInit {
  @Output() formChange = new EventEmitter();
  @Input() form;
  public selectedList = [];
  public opened = false;

  constructor() {
  }

  ngOnInit() {

  }

  updateSelectedList() {
    let allFields = this.getAllFields();
    this.selectedList = allFields.map((field) => {
      return {
        field: field.label,
        label: field.selected,
        value: this.getFieldValue(field)
      }
    });
  }

  changeFilter(filterSelected, filterField) {
    filterField.selected = filterSelected;
    this.updateSelectedList();
    this.formChange.emit({
      list: this.selectedList,
      changed: filterField
    });
  }

  getField(label) {
    return this.getAllFields().find((field) => {return field.label === label;});
  }

  getFieldValueOfLabel(fieldLabel) {
    let foundField = this.getAllFields().find((field) => {
      return field.label === fieldLabel
    });
    return this.getFieldValue(foundField);
  }

  getFieldValue(field) {
    return field.values[field.options.findIndex((option) => {
      return option === field.selected;
    })];
  }

  getAllFields() {
    return this.form.columns.reduce((accumulator, column) => {
      return accumulator.concat(column.fields)
    }, []);
  }

  toggleModal() {
    this.opened = !this.opened;
  }

}
