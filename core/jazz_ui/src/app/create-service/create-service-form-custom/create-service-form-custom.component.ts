import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-form-custom',
  templateUrl: './create-service-form-custom.component.html',
  styleUrls: ['./create-service-form-custom.component.scss']
})
export class CreateServiceFormCustomComponent implements OnInit {
  @Input() form;

  constructor() {
  }

  ngOnInit() {
  }

  //@param: http post request object sent to /create-serverless-service without custom fields
  //@return: returns modified request payload to create service
  applyFormFields(createServicePayload) {
    return createServicePayload;
  }

  //Return true to enable [SUBMIT] if generic form is also valid, return false to disable [SUBMIT]
  formIsValid() {
    return true;
  }
}
