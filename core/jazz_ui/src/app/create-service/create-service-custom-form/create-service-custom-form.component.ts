import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-custom-form',
  templateUrl: './create-service-custom-form.component.html',
  styleUrls: ['./create-service-custom-form.component.scss']
})
export class CreateServiceCustomFormComponent implements OnInit {

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
