import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-form-custom',
  templateUrl: './create-service-form-custom.component.html',
  styleUrls: ['./create-service-form-custom.component.scss']
})
export class CreateServiceFormCustomComponent implements OnInit {

  @Input() form;


  public customForm = {};


  constructor() {
  }

  ngOnInit() {
  }

  applyFormFields(createServicePayload) {
    // Overwrites properties made in /create-serverless-service request
    return;
  }

  formIsValid() {
    // Returning false disables the submit button
    return true;
  }

}
