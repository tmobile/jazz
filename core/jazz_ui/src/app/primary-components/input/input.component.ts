/** 
  * @type Component 
  * @desc Generic form input element
  * @author
*/

import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
// import { Control, ControlGroup, FORM_DIRECTIVES } from '@angular/common';
@Component({
    selector: 'form-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {

    @Input() type: string = 'text';
    @Input() name: string = 'name';
    @Input() label: string = 'label';
    @Input() value: any;
    @Input() error: string;
    @Input() popoverTitle:string;
    @Input() popoverSubTitle:string;
    @Input() popoverContent:string;
    @Output() valueChange:EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() errorChange:EventEmitter<string> = new EventEmitter<string>();
    // formGroup: FormGroup;

  	constructor() {
  	}

    onChange(val) {
      this.value = val;
      this.valueChange.emit(this.value);

      this.error = undefined;
      this.errorChange.emit(this.error);
    }

  	ngOnInit() {
  	}

}